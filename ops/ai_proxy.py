#!/usr/bin/env python3
import json
import os
import socketserver
import threading
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


BIND_HOST = os.environ.get("AI_PROXY_HOST", "127.0.0.1")
BIND_PORT = int(os.environ.get("AI_PROXY_PORT", "3015"))
OLLAMA_BASE = os.environ.get("OLLAMA_BASE", "http://127.0.0.1:21434").rstrip("/")
TTS_BASE = os.environ.get("TTS_BASE", "http://127.0.0.1:28880").rstrip("/")
OPENAI_BASE = os.environ.get("OPENAI_BASE", "https://api.openai.com").rstrip("/")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "").strip()
ALLOWED_ORIGINS = tuple(
    origin.strip().rstrip("/")
    for origin in os.environ.get("AI_PROXY_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
)
OLLAMA_TIMEOUT = int(os.environ.get("OLLAMA_TIMEOUT", "120"))
TTS_TIMEOUT = int(os.environ.get("TTS_TIMEOUT", "60"))
OPENAI_TIMEOUT = int(os.environ.get("OPENAI_TIMEOUT", "45"))
MAX_OLLAMA_CONCURRENCY = max(1, int(os.environ.get("MAX_OLLAMA_CONCURRENCY", "1")))
MAX_TTS_CONCURRENCY = max(1, int(os.environ.get("MAX_TTS_CONCURRENCY", "5")))
MAX_OPENAI_CONCURRENCY = max(1, int(os.environ.get("MAX_OPENAI_CONCURRENCY", "6")))
FORCED_OLLAMA_MODEL = os.environ.get("FORCED_OLLAMA_MODEL", "qwen3.5:0.8b").strip()
ALLOWED_OLLAMA_MODELS = tuple(
    model.strip() for model in os.environ.get("ALLOWED_OLLAMA_MODELS", FORCED_OLLAMA_MODEL).split(",") if model.strip()
)
ALLOW_REMOTE_BIND = os.environ.get("AI_PROXY_ALLOW_REMOTE", "").strip().lower() in {"1", "true", "yes", "on"}

OLLAMA_SEMAPHORE = threading.BoundedSemaphore(MAX_OLLAMA_CONCURRENCY)
TTS_SEMAPHORE = threading.BoundedSemaphore(MAX_TTS_CONCURRENCY)
OPENAI_SEMAPHORE = threading.BoundedSemaphore(MAX_OPENAI_CONCURRENCY)


class ReusableServer(ThreadingHTTPServer):
    allow_reuse_address = True


def join_url(base: str, path: str) -> str:
    return base + path


def is_loopback_host(host: str) -> bool:
    normalized = (host or "").strip().lower()
    return normalized in {"127.0.0.1", "localhost", "::1"}


class ProxyHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        return

    def _is_origin_allowed(self, origin):
        if not origin:
            return True
        normalized = origin.rstrip("/")
        if normalized in ALLOWED_ORIGINS:
            return True
        try:
            parsed = urllib.parse.urlparse(normalized)
        except Exception:
            return False
        if parsed.scheme not in {"http", "https"}:
            return False
        host = (parsed.hostname or "").lower()
        return host in {"localhost", "127.0.0.1", "::1"}

    def _write_cors(self, origin=None):
        if origin and self._is_origin_allowed(origin):
            self.send_header("Access-Control-Allow-Origin", origin.rstrip("/"))
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

    def do_OPTIONS(self):
        origin = self.headers.get("Origin", "")
        if not self._is_origin_allowed(origin):
            payload = json.dumps({"error": "origin_not_allowed"}).encode("utf-8")
            self.send_response(403)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        self.send_response(204)
        self._write_cors(origin)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        self._handle_proxy()

    def do_POST(self):
        self._handle_proxy()

    def _handle_proxy(self):
        origin = self.headers.get("Origin", "")
        if not self._is_origin_allowed(origin):
            payload = json.dumps({"error": "origin_not_allowed"}).encode("utf-8")
            self.send_response(403)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return

        if self.path == "/healthz":
            payload = json.dumps({
                "ok": True,
                "ollama_base": OLLAMA_BASE,
                "tts_base": TTS_BASE,
                "openai_base": OPENAI_BASE,
                "max_ollama_concurrency": MAX_OLLAMA_CONCURRENCY,
                "max_tts_concurrency": MAX_TTS_CONCURRENCY,
                "max_openai_concurrency": MAX_OPENAI_CONCURRENCY,
                "forced_ollama_model": FORCED_OLLAMA_MODEL,
                "allowed_ollama_models": list(ALLOWED_OLLAMA_MODELS),
                "openai_api_key_configured": bool(OPENAI_API_KEY),
            }).encode("utf-8")
            self.send_response(200)
            self._write_cors(origin)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return

        if self.path.startswith("/api/ollama/"):
            self._forward(OLLAMA_BASE, self.path[len("/api/ollama"):], OLLAMA_SEMAPHORE, OLLAMA_TIMEOUT, "ollama")
            return

        if self.path.startswith("/api/tts/"):
            self._forward(TTS_BASE, self.path[len("/api/tts"):], TTS_SEMAPHORE, TTS_TIMEOUT, "tts")
            return

        if self.path.startswith("/api/openai/"):
            self._forward(OPENAI_BASE, self.path[len("/api/openai"):], OPENAI_SEMAPHORE, OPENAI_TIMEOUT, "openai")
            return

        payload = json.dumps({"error": "not_found"}).encode("utf-8")
        self.send_response(404)
        self._write_cors(origin)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _forward(self, base_url, upstream_path, semaphore, timeout, name):
        origin = self.headers.get("Origin", "")
        acquired = semaphore.acquire(blocking=False)
        if not acquired:
            payload = json.dumps({
                "error": f"{name}_busy",
                "message": f"{name} backend is busy, please retry shortly"
            }).encode("utf-8")
            self.send_response(503)
            self._write_cors(origin)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return

        try:
            length = int(self.headers.get("Content-Length", "0") or "0")
            body = self.rfile.read(length) if length > 0 else None
            if name == "ollama":
                body = self._rewrite_ollama_request(upstream_path, body)
                if body is False:
                    return
            upstream_url = join_url(base_url, upstream_path)
            request = urllib.request.Request(
                upstream_url,
                data=body,
                method=self.command,
                headers={
                    "Content-Type": self.headers.get("Content-Type", "application/json"),
                },
            )
            if name == "openai":
                if not OPENAI_API_KEY:
                    payload = json.dumps({
                        "error": "openai_auth_missing",
                        "message": "Set OPENAI_API_KEY on the proxy host"
                    }).encode("utf-8")
                    self.send_response(503)
                    self._write_cors(origin)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("Content-Length", str(len(payload)))
                    self.end_headers()
                    self.wfile.write(payload)
                    return
                request.add_header("Authorization", f"Bearer {OPENAI_API_KEY}")
            try:
                with urllib.request.urlopen(request, timeout=timeout) as response:
                    response_body = response.read()
                    if name == "ollama":
                        response_body = self._rewrite_ollama_response(upstream_path, response_body, response.headers)
                    self.send_response(response.getcode())
                    self._write_cors(origin)
                    for key, value in response.headers.items():
                        lower = key.lower()
                        if lower in {"transfer-encoding", "connection", "server", "date", "content-length"}:
                            continue
                        self.send_header(key, value)
                    self.send_header("Content-Length", str(len(response_body)))
                    self.end_headers()
                    self.wfile.write(response_body)
                    self.wfile.flush()
            except urllib.error.HTTPError as err:
                data = err.read() or json.dumps({"error": f"{name}_upstream_error"}).encode("utf-8")
                self.send_response(err.code)
                self._write_cors(origin)
                self.send_header("Content-Type", err.headers.get("Content-Type", "application/json"))
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
            except Exception as err:
                payload = json.dumps({
                    "error": f"{name}_proxy_error",
                    "message": str(err),
                }).encode("utf-8")
                self.send_response(502)
                self._write_cors(origin)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
        finally:
            semaphore.release()

    def _rewrite_ollama_request(self, upstream_path, body):
        path = upstream_path.split("?", 1)[0]
        if path == "/api/create":
            payload = json.dumps({
                "error": "ollama_create_disabled",
                "message": "public model creation is disabled on this endpoint"
            }).encode("utf-8")
            self.send_response(403)
            self._write_cors()
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return False

        if path not in {"/api/generate", "/api/chat"} or not body:
            return body

        try:
            payload = json.loads(body.decode("utf-8"))
        except Exception:
            return body

        payload["model"] = FORCED_OLLAMA_MODEL
        options = payload.get("options")
        if not isinstance(options, dict):
            options = {}
        options["num_ctx"] = min(int(options.get("num_ctx", 4096) or 4096), 4096)
        payload["options"] = options
        return json.dumps(payload).encode("utf-8")

    def _rewrite_ollama_response(self, upstream_path, body, headers):
        path = upstream_path.split("?", 1)[0]
        content_type = headers.get("Content-Type", "")
        if path != "/api/tags" or "application/json" not in content_type:
            return body
        try:
            payload = json.loads(body.decode("utf-8"))
        except Exception:
            return body
        models = payload.get("models")
        if isinstance(models, list):
            payload["models"] = [
                item for item in models
                if str(item.get("name", "")).strip() in ALLOWED_OLLAMA_MODELS
            ]
        return json.dumps(payload).encode("utf-8")


def main():
    if not is_loopback_host(BIND_HOST) and not ALLOW_REMOTE_BIND:
        raise SystemExit(
            "AI proxy refuses to bind outside loopback unless AI_PROXY_ALLOW_REMOTE is enabled."
        )
    with ReusableServer((BIND_HOST, BIND_PORT), ProxyHandler) as server:
        server.serve_forever()


if __name__ == "__main__":
    socketserver.ThreadingMixIn.daemon_threads = True
    main()
