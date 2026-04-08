export function startBootSequence(options = {}) {
  const onBootStart = typeof options.onBootStart === 'function' ? options.onBootStart : () => {};
  const onDesktopReady = typeof options.onDesktopReady === 'function' ? options.onDesktopReady : () => {};
  const onStartupChime = typeof options.onStartupChime === 'function' ? options.onStartupChime : () => {};
  const params = new URLSearchParams((typeof window !== 'undefined' && window.location && window.location.search) ? window.location.search : '');
  const autoBootFromUrl = ['1', 'true', 'yes', 'auto'].includes(String(params.get('boot') || '').toLowerCase());
  const autoLoginFromUrl = ['1', 'true', 'yes', 'auto'].includes(String(params.get('login') || '').toLowerCase());

const bootAudio = new Audio('./assets/media/audio/boot.mp3');
  bootAudio.volume = 1.0;
  const BOOT_AUDIO_GAIN = 1.7;
  let bootAudioBoostReady = false;

  function initBootAudioBoost() {
    if (bootAudioBoostReady) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaElementSource(bootAudio);
      const gain = ctx.createGain();
      gain.gain.value = BOOT_AUDIO_GAIN;
      src.connect(gain);
      gain.connect(ctx.destination);
      bootAudioBoostReady = true;
    } catch (_) {}
  }

  const loaderEl = document.getElementById('loader');
  if (loaderEl) loaderEl.style.display = 'none';
  const hud = document.getElementById('hud');
  if (hud) hud.style.display = 'none';

  const bios = document.getElementById('biosScreen');
  const out = document.getElementById('biosOutput');
  const energyStar = document.getElementById('biosEnergyStarLogo');
  const awardRibbon = document.getElementById('biosAwardRibbon');
  const biosFooter = document.getElementById('biosFooter');
  const splashStatus = document.getElementById('win95Splash') ? document.querySelector('#win95Splash .win95-splash-status') : null;
  if (!bios || !out) return;
  let bootCursorShield = null;

  function isAiWarmupBusyError(err) {
    const message = String(err && err.message ? err.message : err || '').toLowerCase();
    return (
      message.indexOf('busy') !== -1 ||
      message.indexOf('503') !== -1 ||
      message.indexOf('queue') !== -1 ||
      message.indexOf('timeout') !== -1
    );
  }

  async function waitForAiWarmup(maxWaitMs = 8000) {
    const warmup = window.__WIN95_AI_PREWARM_PROMISE;
    if (!warmup || typeof warmup.then !== 'function') return { state: 'none' };

    let timedOut = false;
    const timeout = new Promise((resolve) => {
      setTimeout(() => {
        timedOut = true;
        resolve({ state: 'timeout' });
      }, maxWaitMs);
    });

    try {
      const result = await Promise.race([warmup.then(() => true, (err) => ({ error: err })), timeout]);
      if (result && result.error) {
        if (isAiWarmupBusyError(result.error)) return { state: 'busy' };
        return timedOut ? { state: 'timeout' } : { state: 'ready' };
      }
      if (result && result.state) return result;
      return timedOut ? { state: 'timeout' } : { state: 'ready' };
    } catch (err) {
      if (isAiWarmupBusyError(err)) return { state: 'busy' };
      return timedOut ? { state: 'timeout' } : { state: 'ready' };
    }
  }

  function forceBootCursorHidden() {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;
    const head = document.head || document.getElementsByTagName('head')[0];
    if (head && !document.getElementById('boot-no-cursor-style')) {
      const style = document.createElement('style');
      style.id = 'boot-no-cursor-style';
      style.textContent = 'html, body, html * { cursor: none !important; }';
      head.appendChild(style);
    }
    if (root && root.classList) root.classList.add('boot-no-cursor');
    if (root && root.style) root.style.setProperty('cursor', 'none', 'important');
    if (body && body.style) body.style.setProperty('cursor', 'none', 'important');
    if (body && !bootCursorShield) {
      bootCursorShield = document.createElement('div');
      bootCursorShield.id = 'bootCursorShield';
      bootCursorShield.style.cssText = [
        'position:fixed',
        'inset:0',
        'z-index:2147483647',
        'background:transparent',
        'cursor:none',
        'pointer-events:auto'
      ].join(';');
      body.appendChild(bootCursorShield);
    }
  }

  function restoreCursorForLogin() {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;
    const style = document.getElementById('boot-no-cursor-style');
    if (style && style.parentNode) style.parentNode.removeChild(style);
    if (root && root.classList) root.classList.remove('boot-no-cursor');
    if (root && root.style) root.style.removeProperty('cursor');
    if (body && body.style) body.style.removeProperty('cursor');
    if (bootCursorShield && bootCursorShield.parentNode) {
      bootCursorShield.parentNode.removeChild(bootCursorShield);
      bootCursorShield = null;
    }
  }

  if (typeof document !== 'undefined' && document.body) {
    document.body.setAttribute('data-boot-phase', '1');
    document.body.setAttribute('data-login-phase', '0');
  }
  forceBootCursorHidden();

  bios.classList.add('active');
  out.textContent = '';
  const autoPowerOn = sessionStorage.getItem('boot.autoPowerOn') === '1' || autoBootFromUrl;
  sessionStorage.removeItem('boot.autoPowerOn');

  function beginBoot() {
    try {
      onBootStart();
    } catch (_) {}
    runBoot();
  }

  if (autoPowerOn) {
    initBootAudioBoost();
    bootAudio.play().catch(() => {});
    beginBoot();
  } else {
    const prompt = document.createElement('div');
    prompt.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:10;';
    const label = document.createElement('div');
    label.textContent = 'CLICK TO POWER ON';
    label.style.cssText = 'font-size:16px;color:#888;letter-spacing:0.3em;animation:biosBlink 1.2s step-end infinite;';
    prompt.appendChild(label);
    bios.appendChild(prompt);

    if (bootCursorShield) {
      bootCursorShield.addEventListener('click', () => {
        if (prompt.parentNode) prompt.remove();
        initBootAudioBoost();
        bootAudio.play().catch(() => {});
        beginBoot();
      }, { once: true });
    }

    prompt.addEventListener('click', () => {
      prompt.remove();
      initBootAudioBoost();
      bootAudio.play().catch(() => {});
      beginBoot();
    }, { once: true });
  }

  function showLoginScreen(onComplete, opts = {}) {
    const restoreBios = opts.restoreBios !== false;
    bios.classList.remove('active');
    const loginScreen = document.getElementById('loginScreen');
    const loginStatus = document.getElementById('loginStatus');
    const okBtn = document.getElementById('loginOkBtn');
    const loginInput = document.getElementById('loginUser');
    if (!loginScreen || !okBtn) {
      onComplete();
      return;
    }

    loginScreen.classList.add('active');
    restoreCursorForLogin();
    if (typeof document !== 'undefined' && document.body) {
      document.body.setAttribute('data-boot-phase', '0');
      document.body.setAttribute('data-login-phase', '1');
    }
    if (loginInput) setTimeout(() => loginInput.focus(), 200);
    if (loginStatus) {
      loginStatus.textContent = '';
      loginStatus.classList.remove('is-active');
    }

    function doLogin() {
      okBtn.disabled = true;
      if (loginStatus) {
        const username = (loginInput && loginInput.value.trim()) || 'User';
        loginStatus.textContent = 'Welcome, ' + username + '...';
        loginStatus.classList.add('is-active');
      }
      setTimeout(() => {
        loginScreen.classList.remove('active');
        if (typeof document !== 'undefined' && document.body) {
          document.body.setAttribute('data-login-phase', '0');
        }
        if (restoreBios) bios.classList.add('active');
        okBtn.disabled = false;
        onComplete();
      }, 480);
    }

    okBtn.addEventListener('click', doLogin, { once: true });
    if (loginInput) {
      loginInput.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        doLogin();
      }, { once: true });
    }
    if (autoLoginFromUrl) {
      setTimeout(() => {
        if (!okBtn.disabled) doLogin();
      }, 260);
    }
  }

  function runBoot() {
    let text = '';
    if (energyStar) energyStar.classList.add('visible');
    if (awardRibbon) awardRibbon.classList.add('visible');

    const screen1Lines = [
      'Award Modular BIOS v4.51PG, An Energy Star Ally',
      'Copyright (C) 1984-2026, Award Software, Inc.',
      '',
      '(7800X3DE) AMD X670E PCIset(TM)',
      '',
      'AMD Ryzen 7 7800X3D 8-Core Processor at 4674MHz',
    ];

    const screen1Drives = [
      '',
      '',
      'Award Plug and Play BIOS Extension  v1.0A',
      'Copyright (C) 2026, Award Software, Inc.',
      '',
      '    Detecting IDE Primary Master  ... Samsung 990 PRO 2TB',
      '    Detecting IDE Primary Slave   ... PCemCD',
      '    Detecting IDE Secondary Master... None',
      '    Detecting IDE Secondary Slave ... None',
    ];

    function typeLines(lines, idx, cb) {
      if (idx >= lines.length) {
        cb();
        return;
      }
      const line = lines[idx];
      text += line + '\n';
      out.textContent = text;
      const delay = line === '' ? 80 : line.includes('Detecting') ? 250 : 40;
      setTimeout(() => typeLines(lines, idx + 1, cb), delay);
    }

    function memoryCount(kb, cb) {
      if (kb > 32768) {
        text += 'Memory Test :    32768K OK\n';
        out.textContent = text;
        setTimeout(cb, 200);
        return;
      }
      out.textContent = text + 'Memory Test :    ' + kb + 'K';
      setTimeout(() => memoryCount(kb + 4096, cb), 30);
    }

    typeLines(screen1Lines, 0, () => {
      memoryCount(0, () => {
        typeLines(screen1Drives, 0, () => {
          if (biosFooter) {
            biosFooter.textContent = '';
            const footerLine1 = document.createElement('div');
            footerLine1.append('Press ');
            const del1 = document.createElement('span');
            del1.textContent = 'DEL';
            del1.style.cssText = 'color:#fff;font-weight:bold';
            footerLine1.append(del1);
            footerLine1.append(' to enter SETUP, ');
            const esc1 = document.createElement('span');
            esc1.textContent = 'ESC';
            esc1.style.cssText = 'color:#fff;font-weight:bold';
            footerLine1.append(esc1);
            footerLine1.append(' to skip memory test');
            biosFooter.appendChild(footerLine1);
            const footerLine2 = document.createElement('div');
            footerLine2.textContent = '03/30/2026-AMD-X670E-7800X3D-00';
            biosFooter.appendChild(footerLine2);
          }
          setTimeout(showScreen2, 800);
        });
      });
    });

    function showScreen2() {
      if (energyStar) energyStar.classList.remove('visible');
      if (awardRibbon) awardRibbon.classList.remove('visible');
      if (biosFooter) biosFooter.textContent = '';
      bios.classList.add('screen2-layout');
      text = '';
      const pad = (value, width) => {
        const str = String(value);
        return str.length >= width ? str.slice(0, width) : str + ' '.repeat(width - str.length);
      };
      const innerW = 66;
      const line = (content) => '|' + pad(content, innerW) + '|';
      const border = '+' + '-'.repeat(innerW) + '+';
      const pair = (k1, v1, k2, v2) => {
        const c1 = pad(k1, 14) + ': ' + pad(v1, 16);
        const c2 = pad(k2, 15) + ': ' + pad(v2, 10);
        return line(' ' + c1 + '  ' + c2 + ' ');
      };
      const pciCols = [8, 11, 9, 11, 11, 20, 3];
      const pciRow = (vals) => vals.map((val, i) => pad(val, pciCols[i])).join(' ');
      const title = 'System Configurations';
      const heading = ' '.repeat(Math.max(0, Math.floor((innerW - title.length) / 2))) + title;

      out.textContent = '';
      out.innerHTML = '';
      [
        [
          heading,
          border,
          pair('CPU Type', 'Ryzen 7 7800X3D', 'Base Memory', '640K'),
          pair('Co-Processor', 'Installed', 'Extended Memory', '32768K'),
          pair('CPU Clock', '4674MHz', 'Cache Memory', '96MB'),
          border
        ].join('\n'),
        [
          border,
          pair('Pri. Master Disk', 'NVMe, 1907729MB', 'Display Type', 'EGA/VGA'),
          pair('Pri. Slave Disk', 'None', 'Serial Port(s)', '3F8'),
          pair('Sec. Master Disk', 'None', 'DDR5 at Row(s)', '0 1'),
          pair('Sec. Slave Disk', 'None', 'L2 Cache Type', '96MB'),
          border
        ].join('\n'),
        [
          'PCI device listing.....',
          pciRow(['Bus No.', 'Device No.', 'Func No.', 'Vendor ID', 'Device ID', 'Device Class', 'IRQ']),
          '-'.repeat(79),
          pciRow(['1', '0', '0', '10DE', '2705', 'VGA Controller', '11']),
          pciRow(['8', '0', '0', '8086', '15F3', 'Ethernet Controller', '10']),
          pciRow(['12', '0', '1', '1002', 'AB38', 'Multimedia Device', '5'])
        ].join('\n')
      ].forEach((blockText) => {
        const block = document.createElement('pre');
        block.className = 'bios-screen2-block';
        block.textContent = blockText;
        out.appendChild(block);
      });

      setTimeout(() => {
        bios.classList.remove('active', 'screen2-layout');
        bios.style.display = 'none';
        out.textContent = '';
        if (biosFooter) biosFooter.textContent = '';
        showWin95Splash();
      }, 1500);
    }

    function showWin95Splash() {
      bios.classList.remove('active', 'screen2-layout');
      bios.style.display = 'none';
      out.textContent = '';
      if (biosFooter) biosFooter.textContent = '';
      if (energyStar) energyStar.classList.remove('visible');
      if (awardRibbon) awardRibbon.classList.remove('visible');

      const splash = document.getElementById('win95Splash');
      const bar = document.getElementById('win95SplashBar');
      if (!splash || !bar) {
        onDesktopReady();
        return;
      }
      splash.classList.add('active');
      let pct = 0;
      const barInterval = setInterval(() => {
        pct += 2;
        bar.style.width = pct + '%';
        if (pct < 100) return;
        clearInterval(barInterval);
        setTimeout(transitionToDesktop, 220);
      }, 35);
    }

  function transitionToDesktop() {
    const splash = document.getElementById('win95Splash');
    if (!splash) {
      onDesktopReady();
      return;
    }
      if (splashStatus) splashStatus.textContent = (window.BonziCore && typeof window.BonziCore.getRivalryBootStatus === 'function')
        ? window.BonziCore.getRivalryBootStatus('warmup')
        : 'Warming AI for Bonzi and Clippy...';
      waitForAiWarmup(8000).then((warmState) => {
        if (splashStatus) {
          splashStatus.textContent =
            warmState.state === 'busy'
              ? ((window.BonziCore && typeof window.BonziCore.getRivalryBootStatus === 'function')
                ? window.BonziCore.getRivalryBootStatus('busy')
                : 'AI queue busy. Starting desktop...')
              : warmState.state === 'timeout'
                ? ((window.BonziCore && typeof window.BonziCore.getRivalryBootStatus === 'function')
                  ? window.BonziCore.getRivalryBootStatus('timeout')
                  : 'AI warmup timed out. Starting desktop...')
                : warmState.state === 'ready'
                  ? ((window.BonziCore && typeof window.BonziCore.getRivalryBootStatus === 'function')
                    ? window.BonziCore.getRivalryBootStatus('ready')
                    : 'AI ready. Starting desktop...')
                  : 'Starting desktop...';
        }

        const revealDesktop = () => {
          const done = () => {
            onStartupChime();
            onDesktopReady();
          };
          const dt = document.getElementById('desktop');
          if (!dt) {
            if (splash) {
              splash.classList.remove('active');
              splash.style.cssText = '';
            }
            done();
            return;
          }

          const finishLogin = () => {
            dt.classList.add('visible');
            if (typeof gsap !== 'undefined') {
              gsap.to(dt, {
                opacity: 1,
                duration: 0.14,
                ease: 'none',
                onComplete: () => {
                  dt.style.opacity = '';
                  done();
                }
              });
            } else {
              dt.style.opacity = '';
              done();
            }
          };

          dt.style.opacity = '0';
          if (typeof gsap !== 'undefined') {
            const tl = gsap.timeline();
            tl.to(splash, { opacity: 0, duration: 0.12, ease: 'none' });
            tl.call(() => {
              splash.classList.remove('active');
              splash.style.cssText = '';
            });
            tl.set({}, {}, '+=0.12');
            tl.call(() => {
              showLoginScreen(finishLogin, { restoreBios: false });
            });
          } else {
            splash.classList.remove('active');
            showLoginScreen(finishLogin, { restoreBios: false });
          }
        };

        revealDesktop();
      });
    }
  }
}
