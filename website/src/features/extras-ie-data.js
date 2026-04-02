// Win95 IE shared data/helpers split from extras-app-internet-explorer.js
(function() {
  'use strict';

  function createWin95IEData() {
var presets = [
  {
    label: 'Google 1999',
    url: 'https://www.google.com/',
    timestamp: '19991130235959',
    display: 'Google (1999)',
    mode: 'local-google-1999',
    searchLabel: 'Google 1999',
    searchUrl: function(query) {
      return 'https://www.google.com/search?q=' + encodeURIComponent(query);
    }
  },
  {
    label: 'Yahoo 1998',
    url: 'https://www.yahoo.com/',
    timestamp: '19981202230410',
    display: 'Yahoo! (1998)',
    mode: 'local-yahoo-1998',
    searchLabel: 'Yahoo! Search 1998',
    searchUrl: function(query) {
      return 'http://search.yahoo.com/bin/search?p=' + encodeURIComponent(query);
    }
  },
  {
    label: 'AltaVista 1999',
    url: 'http://www.altavista.com/',
    timestamp: '19991012013445',
    display: 'AltaVista (1999)',
    mode: 'local-altavista-1999',
    searchLabel: 'AltaVista 1999',
    searchUrl: function(query) {
      return 'http://www.altavista.com/cgi-bin/query?q=' + encodeURIComponent(query);
    }
  },
  {
    label: 'GeoCities 1999',
    url: 'http://www.geocities.com/',
    timestamp: '19991013031733',
    display: 'GeoCities (1999)',
    mode: 'local-geocities-1999'
  },
  {
    label: 'Amazon 1997',
    url: 'https://www.amazon.com/',
    timestamp: '19970715000000',
    display: 'Amazon (1997)',
    searchLabel: 'Amazon 1997'
  },
  {
    label: 'Win98 Inside Win98',
    url: 'about:win98-inside',
    timestamp: '19991130235959',
    display: 'Win98 Inside Win98',
    mode: 'local-win98-inside-win98'
  }
];
var archiveSearchIndex = [
  {
    title: 'Google! (1999)',
    url: 'https://www.google.com/',
    timestamp: '19991130235959',
    snippet: 'Minimal search homepage from late 1999.',
    keywords: ['google', 'search', 'internet', 'web', 'search engine']
  },
  {
    title: 'AltaVista Search',
    url: 'http://www.altavista.com/',
    timestamp: '19991012013445',
    snippet: 'One of the major full-text web search engines of the era.',
    keywords: ['altavista', 'search', 'web', 'internet', 'engine']
  },
  {
    title: 'Yahoo! Directory',
    url: 'https://www.yahoo.com/',
    timestamp: '19981202230410',
    snippet: 'Human-curated portal and directory of the late 1990s web.',
    keywords: ['yahoo', 'directory', 'web', 'portal', 'internet']
  },
  {
    title: 'NVIDIA Home Page',
    url: 'http://www.nvidia.com/',
    timestamp: '19991012035450',
    snippet: 'Graphics accelerator company site from the GeForce 256 era.',
    keywords: ['nvidia', 'gpu', 'graphics', 'geforce', 'video card']
  },
  {
    title: '3dfx Interactive',
    url: 'http://www.3dfx.com/',
    timestamp: '19991117041050',
    snippet: 'Voodoo graphics boards and late-1990s 3D gaming hardware.',
    keywords: ['3dfx', 'gpu', 'graphics', 'voodoo', 'gaming']
  },
  {
    title: 'AMD',
    url: 'http://www.amd.com/',
    timestamp: '19991012024939',
    snippet: 'Processor manufacturer site from the K6 and Athlon transition era.',
    keywords: ['amd', 'cpu', 'processor', 'chip', 'hardware']
  },
  {
    title: 'Intel',
    url: 'http://www.intel.com/',
    timestamp: '19991013002126',
    snippet: 'Pentium-era processor and platform information.',
    keywords: ['intel', 'cpu', 'processor', 'chip', 'hardware']
  },
  {
    title: 'Slashdot',
    url: 'http://slashdot.org/',
    timestamp: '19991012041539',
    snippet: 'News for nerds covering Linux, hardware, software, and internet culture.',
    keywords: ['linux', 'open source', 'hardware', 'internet', 'technology', 'ai']
  },
  {
    title: 'Netscape',
    url: 'http://home.netscape.com/',
    timestamp: '19991013012456',
    snippet: 'Browser software and portal content from the late browser wars.',
    keywords: ['browser', 'netscape', 'internet explorer', 'web', 'internet']
  },
  {
    title: 'Microslop Windows',
    url: 'http://www.microsoft.com/windows/',
    timestamp: '19991013043549',
    snippet: 'Windows product pages from the Windows 98/2000 timeframe.',
    keywords: ['windows', 'microsoft', 'os', 'operating system', 'internet explorer']
  },
  {
    title: 'Stanford University',
    url: 'http://www.stanford.edu/',
    timestamp: '19991012141104',
    snippet: 'Academic homepage strongly associated with early web search history.',
    keywords: ['stanford', 'research', 'ai', 'artificial intelligence', 'education']
  },
  {
    title: 'Open Directory Project',
    url: 'http://dmoz.org/',
    timestamp: '19991012010831',
    snippet: 'Volunteer-maintained web directory used across many search products.',
    keywords: ['directory', 'search', 'web', 'internet', 'topics']
  }
];
var DEFAULT_WAYBACK_YEAR = 1999;

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildGoogle1999Doc() {
  return [
    '<!doctype html>',
    '<html><head><meta charset="utf-8"><title>Google! (1999)</title></head>',
    '<body style="margin:0;background:#fff;color:#000;font-family:Times New Roman,Times,serif;">',
    '<table width="100%" height="100%" cellpadding="0" cellspacing="0">',
    '<tr><td align="center" valign="middle">',
    '<div style="width:720px;max-width:92vw;text-align:center;">',
    '<div style="font-size:14px;margin-bottom:18px;">',
    '<a href="#" style="color:#00c;">Stanford Search</a>',
    '&nbsp;&nbsp;&nbsp;<a href="#" style="color:#00c;">Linux Search</a>',
    '</div>',
    '<div style="font-size:74px;line-height:1;font-weight:normal;letter-spacing:-3px;font-family:Times New Roman,Times,serif;">',
    '<span style="color:#4285f4;">G</span><span style="color:#db4437;">o</span><span style="color:#f4b400;">o</span><span style="color:#4285f4;">g</span><span style="color:#0f9d58;">l</span><span style="color:#db4437;">e</span><span style="color:#000;">!</span>',
    '</div>',
    '<form onsubmit="parent.Win95IEHandleSearch && parent.Win95IEHandleSearch(this.q.value); return false;" style="margin:14px 0 8px;">',
    '<input name="q" type="text" value="" style="width:420px;max-width:80vw;height:24px;border:1px solid #000;padding:2px 4px;font-size:16px;">',
    '<div style="margin-top:10px;">',
    '<input type="submit" value="Google Search" style="font-size:13px;">',
    '&nbsp;',
    '<input type="button" value="I\'m Feeling Lucky" onclick="parent.Win95IEHandleSearch && parent.Win95IEHandleSearch(this.form.q.value);" style="font-size:13px;">',
    '</div>',
    '</form>',
    '<div style="font-size:14px;line-height:1.7;">',
    '<a href="#" style="color:#00c;">Advanced Search</a>',
    '&nbsp;|&nbsp;',
    '<a href="#" style="color:#00c;">Preferences</a>',
    '&nbsp;|&nbsp;',
    '<a href="#" style="color:#00c;">Language Tools</a>',
    '</div>',
    '<div style="margin-top:26px;font-size:13px;">',
    'Search the web using Google',
    '</div>',
    '<div style="margin-top:10px;font-size:13px;">',
    '<a href="#" style="color:#00c;">Google.com in English</a>',
    '</div>',
    '<div style="margin-top:38px;font-size:12px;color:#444;">',
    'Snapshot-inspired local recreation of a late-1999 Google homepage.',
    '<br><a href="#" onclick="parent.Win95IEOpenArchive && parent.Win95IEOpenArchive(\'https://web.archive.org/web/19991130235959/https://www.google.com/\'); return false;" style="color:#00c;">Open archived Google 1999 snapshot</a>',
    '</div>',
    '</div>',
    '</td></tr>',
    '</table>',
    '</body></html>'
  ].join('');
}

function buildYahoo1998Doc() {
  return [
    '<!doctype html>',
    '<html><head><meta charset="utf-8"><title>Yahoo! (1998)</title></head>',
    '<body style="margin:0;background:#fff7d6;color:#000;font-family:Arial,Helvetica,sans-serif;">',
    '<div style="max-width:940px;margin:0 auto;padding:18px 24px 36px;">',
    '<div style="font-size:54px;font-weight:bold;color:#6a0dad;letter-spacing:-1px;margin-bottom:12px;">Yahoo!</div>',
    '<form onsubmit="parent.Win95IEHandleSearch && parent.Win95IEHandleSearch(this.q.value); return false;" style="margin-bottom:18px;">',
    '<input name="q" type="text" style="width:420px;max-width:78vw;height:24px;border:2px inset #c0c0c0;padding:2px 4px;font-size:16px;background:#fff;">',
    '<input type="submit" value="Yahoo! Search" style="margin-left:8px;font-size:13px;">',
    '</form>',
    '<div style="font-size:14px;line-height:1.8;">',
    '<strong>Categories</strong><br>',
    '<a href="#" style="color:#0000cc;">Arts</a> | <a href="#" style="color:#0000cc;">Business</a> | <a href="#" style="color:#0000cc;">Computers</a> | <a href="#" style="color:#0000cc;">Education</a> | <a href="#" style="color:#0000cc;">Entertainment</a><br>',
    '<a href="#" style="color:#0000cc;">Government</a> | <a href="#" style="color:#0000cc;">Health</a> | <a href="#" style="color:#0000cc;">News</a> | <a href="#" style="color:#0000cc;">Science</a> | <a href="#" style="color:#0000cc;">Sports</a>',
    '</div>',
    '<div style="margin-top:24px;font-size:13px;color:#333;">Portal-style directory homepage inspired by Yahoo! in 1998.</div>',
    '</div>',
    '</body></html>'
  ].join('');
}

function buildAltaVista1999Doc() {
  return [
    '<!doctype html>',
    '<html><head><meta charset="utf-8"><title>AltaVista (1999)</title></head>',
    '<body style="margin:0;background:#ffffff;color:#000;font-family:Arial,Helvetica,sans-serif;">',
    '<div style="max-width:940px;margin:0 auto;padding:22px 28px 36px;">',
    '<div style="font-size:46px;font-weight:bold;color:#113baf;margin-bottom:10px;">AltaVista</div>',
    '<div style="font-size:13px;color:#444;margin-bottom:16px;">The most powerful search engine on the web</div>',
    '<form onsubmit="parent.Win95IEHandleSearch && parent.Win95IEHandleSearch(this.q.value); return false;" style="margin-bottom:20px;">',
    '<input name="q" type="text" style="width:460px;max-width:78vw;height:24px;border:1px solid #000;padding:2px 4px;font-size:16px;background:#fff;">',
    '<input type="submit" value="Search" style="margin-left:8px;font-size:13px;">',
    '</form>',
    '<div style="font-size:14px;line-height:1.8;">',
    '<a href="#" style="color:#003399;">Images</a> | <a href="#" style="color:#003399;">Audio</a> | <a href="#" style="color:#003399;">Video</a> | <a href="#" style="color:#003399;">News</a> | <a href="#" style="color:#003399;">Advanced Search</a>',
    '</div>',
    '<div style="margin-top:24px;font-size:13px;color:#333;">AltaVista-inspired landing page for late-1999 search demos.</div>',
    '</div>',
    '</body></html>'
  ].join('');
}

function buildGeoCities1999Doc() {
  return [
    '<!doctype html>',
    '<html><head><meta charset="utf-8"><title>GeoCities (1999)</title></head>',
    '<body style="margin:0;background:#00154a;color:#000;font-family:Verdana,Arial,sans-serif;">',
    '<div style="max-width:940px;margin:0 auto;padding:18px 22px 36px;background:linear-gradient(180deg,#fff9cf,#ffe8f7);border-left:5px double #002e96;border-right:5px double #002e96;">',
    '<div style="font-size:46px;font-weight:bold;color:#cf1322;margin-bottom:8px;text-shadow:2px 2px 0 #fff;">GeoCities</div>',
    '<div style="font-size:14px;margin-bottom:14px;color:#2d2d2d;">Build your own neighborhood on the web. Last updated: 1999.</div>',
    '<marquee behavior="alternate" scrollamount="6" style="border:1px solid #5f5f5f;background:#fff;padding:5px 8px;font-size:13px;color:#123a7d;margin-bottom:16px;">WELCOME TO MY HOMEPAGE!!! UNDER CONSTRUCTION</marquee>',
    '<div style="font-size:14px;line-height:1.95;">',
    '<a href="#hollywood" style="color:#003399;">Hollywood</a> | <a href="#siliconvalley" style="color:#003399;">SiliconValley</a> | <a href="#sunsetstrip" style="color:#003399;">SunsetStrip</a> | <a href="#enchantedforest" style="color:#003399;">EnchantedForest</a> | <a href="#area51" style="color:#003399;">Area51</a> | <a href="#tokyo" style="color:#003399;">Tokyo</a>',
    '</div>',
    '<table cellpadding="4" cellspacing="0" style="margin-top:16px;border:2px outset #c9c9c9;background:#fff;width:100%;max-width:620px;">',
    '<tr><td style="font-size:12px;color:#1c1c1c;"><strong>Neighborhood Spotlight:</strong> /Area51/Corridor/1999</td></tr>',
    '<tr><td style="font-size:12px;color:#1c1c1c;"><strong>Cool Links:</strong> <a href="#" style="color:#003399;">Guestbook</a> • <a href="#" style="color:#003399;">Webrings</a> • <a href="#" style="color:#003399;">MIDI Collection</a></td></tr>',
    '</table>',
    '<div id="hollywood" style="margin-top:16px;padding:8px 10px;border:1px dashed #9da7c2;background:#fff;font-size:12px;color:#202020;"><strong>Hollywood:</strong> Fan pages, movie countdowns, and glitter GIF banners.</div>',
    '<div id="siliconvalley" style="margin-top:10px;padding:8px 10px;border:1px dashed #9da7c2;background:#fff;font-size:12px;color:#202020;"><strong>SiliconValley:</strong> Personal coding journals and Java applet experiments.</div>',
    '<div id="sunsetstrip" style="margin-top:10px;padding:8px 10px;border:1px dashed #9da7c2;background:#fff;font-size:12px;color:#202020;"><strong>SunsetStrip:</strong> Music fan shrines, MIDI autoplay, and tour-photo scans.</div>',
    '<div id="enchantedforest" style="margin-top:10px;padding:8px 10px;border:1px dashed #9da7c2;background:#fff;font-size:12px;color:#202020;"><strong>EnchantedForest:</strong> Fantasy art rings, poems, and magic-themed roleplay pages.</div>',
    '<div id="area51" style="margin-top:10px;padding:8px 10px;border:1px dashed #9da7c2;background:#fff;font-size:12px;color:#202020;"><strong>Area51:</strong> UFO theories, conspiracy archives, and weird web rabbit holes.</div>',
    '<div id="tokyo" style="margin-top:10px;padding:8px 10px;border:1px dashed #9da7c2;background:#fff;font-size:12px;color:#202020;"><strong>Tokyo:</strong> Anime fan clubs, scanlations, and pixel-art galleries.</div>',
    '<div style="margin-top:22px;font-size:13px;color:#333;">GeoCities-inspired landing page recreation for late-1990s browsing demos.</div>',
    '</div>',
    '</body></html>'
  ].join('');
}

function buildYoutube2005Doc() {
  return [
    '<!doctype html>',
    '<html><head><meta charset="utf-8"><title>YouTube (2005)</title></head>',
    '<body style="margin:0;background:#f1f1f1;color:#000;font-family:Arial,Helvetica,sans-serif;">',
    '<div style="padding:14px 18px;background:#ffffff;border-bottom:1px solid #d0d0d0;box-shadow:0 1px 0 #fff inset;">',
    '<div style="font-size:34px;font-weight:bold;color:#cc181e;letter-spacing:-1px;">YouTube</div>',
    '<div style="font-size:12px;color:#666;margin-top:2px;">Broadcast Yourself</div>',
    '</div>',
    '<div style="max-width:1080px;margin:0 auto;padding:18px 20px 30px;">',
    '<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:16px;">',
    '<input type="text" value="search videos" style="flex:1;min-width:240px;max-width:520px;height:26px;border:1px solid #999;padding:3px 8px;font-size:14px;background:#fff;" onfocus="this.select()">',
    '<button type="button" style="height:30px;padding:0 14px;font-size:13px;border:1px solid #999;background:linear-gradient(180deg,#fefefe,#dfdfdf);">Search</button>',
    '</div>',
    '<div style="display:grid;grid-template-columns:minmax(420px,1fr) 320px;gap:16px;align-items:start;">',
    '<div style="background:#fff;border:1px solid #c9c9c9;padding:10px;box-shadow:0 1px 2px rgba(0,0,0,0.12);">',
    '<video id="yt2005-player" controls preload="metadata" style="display:block;width:100%;max-height:480px;background:#000;" poster="/assets/media/videos/youtube2005/thumbnails/movie-fake-thumb.jpg"></video>',
    '<div id="yt2005-title" style="margin-top:8px;font-size:16px;font-weight:bold;color:#111;">Me at the zoo</div>',
    '<div id="yt2005-meta" style="font-size:12px;color:#666;">jawed • 2005</div>',
    '<div style="margin-top:8px;font-size:11px;color:#666;">Tip: click a video on the right to play it here.</div>',
    '</div>',
    '<div id="yt2005-list" style="display:flex;flex-direction:column;gap:8px;max-height:540px;overflow:auto;padding-right:2px;"></div>',
    '</div>',
    '</div>',
    '<script>(function(){',
    'var videos = [',
    '{title:"Me at the zoo",meta:"jawed • 2005",src:"/assets/media/videos/youtube2005/jNQXAC9IVRw - Me at the zoo.mp4"},',
    '{title:"My Snowboarding Skillz",meta:"community upload • 2005",src:"/assets/media/videos/youtube2005/LeAltgu_pbM - My Snowboarding Skillz.mp4"},',
    '{title:"Funny Surfer Dude",meta:"community upload • 2005",src:"/assets/media/videos/youtube2005/n-5F_7DwPpo - Funny Surfer Dude.mp4"},',
    '{title:"Lazy Sunday",meta:"SNL clip • 2005",src:"/assets/media/videos/youtube2005/YKSIaeQHV94 - Lazy Sunday.mp4"},',
    '{title:"Extreme Mentos & Diet Coke",meta:"viral experiments • 2006",src:"/assets/media/videos/youtube2005/h_2osOb2SMU - Extreme Mentos & Diet Coke.mp4"},',
    '{title:"Numa Numa Original Music Video",meta:"viral classic • 2006",src:"/assets/media/videos/youtube2005/ILtz5nX3_fc - Numa Numa Original Music Video.mp4"},',
    '{title:"Evolution of Dance",meta:"viral hit • 2006",src:"/assets/media/videos/youtube2005/dMH0bHeiRNg - Evolution of Dance.mp4"},',
    '{title:"Burger King Foot Lettuce",meta:"meme upload",src:"/assets/media/videos/youtube2005/9PWjqgM_CU8 - Burger King Foot Lettuce (Original full version).mp4"},',
    '{title:"Totally Normal Pop Song",meta:"definitely not a rickroll",src:"/assets/media/videos/youtube2005/movie.mp4",thumb:"/assets/media/videos/youtube2005/thumbnails/movie-fake-thumb.jpg"}',
    '];',
    'var list = document.getElementById("yt2005-list");',
    'var player = document.getElementById("yt2005-player");',
    'var title = document.getElementById("yt2005-title");',
    'var meta = document.getElementById("yt2005-meta");',
    'if(!list||!player||!title||!meta){return;}',
    'function setActive(idx){',
    'var item = videos[idx]; if(!item){return;}',
    'player.src = item.src; if(item.thumb){player.poster = item.thumb;}',
    'title.textContent = item.title; meta.textContent = item.meta;',
    'Array.prototype.forEach.call(list.children,function(node,n){',
    'node.style.background = n===idx ? "#dbe8ff" : "#fff";',
    'node.style.borderColor = n===idx ? "#4a70c7" : "#c9c9c9";',
    '});',
    '}',
    'videos.forEach(function(item, idx){',
    'var btn = document.createElement("button");',
    'btn.type = "button";',
    'btn.style.textAlign = "left";',
    'btn.style.width = "100%";',
    'btn.style.border = "1px solid #c9c9c9";',
    'btn.style.background = "#fff";',
    'btn.style.cursor = "pointer";',
    'btn.style.padding = "8px";',
    'btn.innerHTML = "<div style=\\"font-size:13px;font-weight:bold;color:#111;\\">"+item.title+"</div><div style=\\"font-size:11px;color:#666;margin-top:3px;\\">"+item.meta+"</div>";',
    'btn.addEventListener("click", function(){ setActive(idx); player.play().catch(function(){}); });',
    'list.appendChild(btn);',
    '});',
    'setActive(0);',
    '})();<\/script>',
    '</body></html>'
  ].join('');
}

function escapeHtmlAttr(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getNestedDesktopDepth() {
  if (typeof window === 'undefined' || !window.location) return 0;
  try {
    var params = new URLSearchParams(window.location.search || '');
    var parsed = Number(params.get('nestedDepth') || '0');
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.floor(parsed));
  } catch (_) {
    return 0;
  }
}

function buildNestedDesktopUrl() {
  if (typeof window === 'undefined' || !window.location) return '';
  var depth = getNestedDesktopDepth();
  var url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('boot', 'auto');
  url.searchParams.set('login', 'auto');
  url.searchParams.set('nestedDesktop', '1');
  url.searchParams.set('nestedDepth', String(depth + 1));
  return url.toString();
}

function buildWin98InsideWin98Doc() {
  var maxDepth = 3;
  var currentDepth = getNestedDesktopDepth();
  var reachedEnd = currentDepth >= maxDepth;
  var nestedUrl = buildNestedDesktopUrl();
  return [
    '<!doctype html>',
    '<html><head><meta charset="utf-8"><title>Win98 Inside Win98</title></head>',
    '<body style="margin:0;background:linear-gradient(180deg,#0a2f74,#153f93);color:#fff;font-family:Arial,Helvetica,sans-serif;overflow:hidden;">',
    '<div style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.35);background:linear-gradient(90deg,#001e67,#0f58be);font-size:13px;">',
    '<strong>Nested Desktop Mode:</strong> level ' + String(currentDepth) + ' of ' + String(maxDepth) + '.',
    '</div>',
    '<div style="height:calc(100vh - 42px);padding:14px;background:rgba(0,0,0,0.12);box-sizing:border-box;">',
    reachedEnd
      ? '<div style="display:flex;width:100%;height:100%;border:2px solid rgba(255,255,255,0.65);background:linear-gradient(180deg,#081a4e,#071133);box-shadow:0 0 0 2px rgba(0,0,0,0.35), 8px 8px 0 rgba(0,0,0,0.18);align-items:center;justify-content:center;padding:24px;box-sizing:border-box;"><div style="max-width:620px;border:2px outset #b9c8ea;background:#d7deea;color:#000;padding:14px 16px;"><div style="font-weight:bold;font-size:16px;margin-bottom:8px;">You reached the end of the nested tunnel.</div><div style="font-size:12px;line-height:1.5;">This is the deepest level. To keep performance stable, additional nesting stops here.</div></div></div>'
      : '<iframe style="display:block;width:100%;height:100%;border:2px solid rgba(255,255,255,0.65);background:#000;box-shadow:0 0 0 2px rgba(0,0,0,0.35), 8px 8px 0 rgba(0,0,0,0.18);" src="' + escapeHtmlAttr(nestedUrl) + '" title="Nested Win98 Desktop"></iframe>',
    '</div>',
    '</body></html>'
  ].join('');
}

function scoreArchiveResult(query, item) {
  var tokens = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return 0;
  var haystack = [
    item.title,
    item.snippet,
    (item.keywords || []).join(' ')
  ].join(' ').toLowerCase();
  var score = 0;
  tokens.forEach(function(token) {
    if (haystack.indexOf(token) !== -1) score += 3;
    if ((item.keywords || []).some(function(keyword) { return keyword.toLowerCase().indexOf(token) !== -1; })) score += 2;
  });
  return score;
}

function buildArchiveSearchResultsDoc(query, engine) {
  var safeQuery = escapeHtml(query);
  var activeEngine = engine || presets[0];
  var ranked = archiveSearchIndex
    .map(function(item) {
      return {
        item: item,
        score: scoreArchiveResult(query, item)
      };
    });
  var matched = ranked
    .filter(function(entry) { return entry.score > 0; })
    .sort(function(a, b) { return b.score - a.score; });

  if (!matched.length) {
    matched = archiveSearchIndex.slice(0, 6).map(function(item, index) {
      return { item: item, score: 6 - index };
    });
  }

  var usedTitles = {};
  matched.forEach(function(entry) {
    usedTitles[entry.item.title] = true;
  });
  ranked
    .filter(function(entry) { return !usedTitles[entry.item.title]; })
    .sort(function(a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.item.title.localeCompare(b.item.title);
    })
    .forEach(function(entry) {
      if (matched.length >= 8) return;
      matched.push({
        item: entry.item,
        score: Math.max(entry.score, 1)
      });
      usedTitles[entry.item.title] = true;
    });

  matched = matched.slice(0, 8);

  var resultHtml = matched.map(function(entry, index) {
    var item = entry.item;
    var waybackUrl = 'https://web.archive.org/web/' + item.timestamp + '/' + item.url;
    return [
      '<div style="margin-bottom:18px;">',
      '<div style="color:#008000;font-size:12px;">Result ' + (index + 1) + ' of ' + matched.length + '</div>',
      '<a href="#" onclick="parent.Win95IEOpenArchive && parent.Win95IEOpenArchive(\'' + escapeHtml(waybackUrl) + '\'); return false;" style="color:#00c;font-size:20px;text-decoration:underline;">' + escapeHtml(item.title) + '</a>',
      '<div style="color:#006621;font-size:13px;margin:2px 0 4px;">' + escapeHtml(item.url) + '</div>',
      '<div style="font-size:15px;line-height:1.35;color:#222;">' + escapeHtml(item.snippet) + '</div>',
      '</div>'
    ].join('');
  }).join('');

  return [
    '<!doctype html>',
    '<html><head><meta charset="utf-8"><title>' + escapeHtml(activeEngine.searchLabel || activeEngine.label || 'Archive Search') + '</title></head>',
    '<body style="margin:0;background:#fff;color:#000;font-family:Times New Roman,Times,serif;">',
    '<div style="padding:18px 26px 36px;max-width:920px;">',
    '<div style="font-size:34px;color:#1a3dc1;margin-bottom:10px;">' + escapeHtml(activeEngine.searchLabel || activeEngine.label || 'Archive Search') + '</div>',
    '<div style="border:1px solid #9f9f9f;padding:10px 12px;margin-bottom:16px;background:#f6f6f6;font-size:16px;">Showing archived late-1990s pages for: <strong>' + safeQuery + '</strong></div>',
    '<div style="font-size:13px;color:#444;margin-bottom:18px;">These are real Wayback snapshots from the 1998-1999 web, ranked locally so search works inside the browser window.</div>',
    resultHtml,
    '</div>',
    '</body></html>'
  ].join('');
}

function looksLikeSearchQuery(raw) {
  var value = String(raw || '').trim();
  if (!value) return false;
  if (/^https?:\/\//i.test(value)) return false;
  if (/^web\.archive\.org\//i.test(value)) return false;
  if (value.indexOf(' ') !== -1) return true;
  if (!/[.:/\\]/.test(value)) return true;
  return false;
}

function buildSearchTarget(query, engine) {
  var activeEngine = engine && typeof engine.searchUrl === 'function' ? engine : presets[0];
  return {
    archiveUrl: '',
    displayValue: query,
    sourceUrl: query,
    title: activeEngine.searchLabel + ' results for "' + query + '"',
    mode: 'local-search-results',
    engine: activeEngine
  };
}

function extractRequestedYear(input) {
  var value = String(input || '').toLowerCase();
  var explicitYear = value.match(/\b(19\d{2}|20\d{2})\b/);
  if (explicitYear) return Number(explicitYear[1]);
  if (/\b(late\s*90s|nineteen\s*nineties|nineties|90s)\b/.test(value)) return 1999;
  if (/\b(early\s*2000s)\b/.test(value)) return 2001;
  return DEFAULT_WAYBACK_YEAR;
}

function resolveNaturalCommand(input, engine, requestedYear) {
  var value = String(input || '').toLowerCase();
  var activeEngine = engine && typeof engine.searchUrl === 'function' ? engine : presets[0];

  if (/\b(surprise me|random site|random page)\b/.test(value)) {
    var randomItem = archiveSearchIndex[Math.floor(Math.random() * archiveSearchIndex.length)] || archiveSearchIndex[0];
    if (!randomItem) return null;
    return {
      archiveUrl: '',
      displayValue: randomItem.url,
      sourceUrl: randomItem.url,
      title: randomItem.title + ' (' + requestedYear + ')',
      requestedYear: requestedYear,
      engine: activeEngine
    };
  }

  if (/\b(old|classic|90s|late 90s)\b/.test(value) && /\b(search engines?|search)\b/.test(value)) {
    return buildSearchTarget('google altavista yahoo dmoz netscape', activeEngine);
  }

  if (/\b(classic|retro|90s)\b/.test(value) && /\b(gaming sites?|gaming web|games?)\b/.test(value)) {
    return buildSearchTarget('3dfx nvidia slashdot', activeEngine);
  }

  return null;
}

function buildAliasMap() {
  var aliasMap = {};

  function addAlias(alias, url, title, extra) {
    var key = String(alias || '').toLowerCase().trim();
    if (!key || !url) return;
    if (!aliasMap[key]) {
      aliasMap[key] = Object.assign({ url: url, title: title || key }, extra || {});
    }
  }

  function addHostnameAliases(url, title, extra) {
    var value = String(url || '');
    if (!value) return;
    var hostMatch = value.match(/^https?:\/\/([^\/]+)/i);
    if (!hostMatch) return;
    var host = hostMatch[1].toLowerCase();
    var noWww = host.replace(/^www\./, '');
    addAlias(host, url, title, extra);
    addAlias(noWww, url, title, extra);
    var root = noWww.split('.')[0];
    addAlias(root, url, title, extra);
  }

  presets.forEach(function(preset) {
    var presetMeta = {
      mode: preset.mode || '',
      timestamp: preset.timestamp || String(DEFAULT_WAYBACK_YEAR) + '0101000000',
      display: preset.display || preset.label || ''
    };
    addHostnameAliases(preset.url, preset.display || preset.label, presetMeta);
    addAlias(preset.label, preset.url, preset.display || preset.label, presetMeta);
  });

  archiveSearchIndex.forEach(function(item) {
    addHostnameAliases(item.url, item.title);
    addAlias(item.title, item.url, item.title);
    (item.keywords || []).forEach(function(keyword) {
      addAlias(keyword, item.url, item.title);
    });
  });

  addAlias('wayback', presets[0].url, presets[0].display);
  addAlias('internet archive', presets[0].url, presets[0].display);
  return aliasMap;
}

var aliasMap = buildAliasMap();

function extractDomainLikeToken(input) {
  var match = String(input || '').match(/((?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?)/i);
  return match ? match[1] : '';
}

function extractWaybackOriginalUrl(input) {
  var match = String(input || '').match(/web\.archive\.org\/web\/(?:\d{4,14}[^\/]*)\/(https?:\/\/[^\s]+)/i);
  if (!match || !match[1]) return '';
  return match[1].replace(/[)\].,!?;:]+$/, '');
}

function resolveAliasUrl(input) {
  var lower = String(input || '').toLowerCase();
  var tokens = lower
    .replace(/[^a-z0-9.\-\/: ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  var seen = {};
  var candidates = [];
  var i;

  for (i = 0; i < tokens.length; i += 1) {
    if (!seen[tokens[i]]) {
      seen[tokens[i]] = true;
      candidates.push(tokens[i]);
    }
  }

  if (tokens.length >= 2) {
    for (i = 0; i < tokens.length - 1; i += 1) {
      var pair = tokens[i] + ' ' + tokens[i + 1];
      if (!seen[pair]) {
        seen[pair] = true;
        candidates.push(pair);
      }
    }
  }

  var best = null;
  Object.keys(aliasMap).forEach(function(alias) {
    var matched = lower.indexOf(alias) !== -1 || candidates.indexOf(alias) !== -1;
    if (!matched) return;
    if (!best || alias.length > best.alias.length) {
      best = { alias: alias, entry: aliasMap[alias] };
    }
  });
  return best ? best.entry : null;
}

function inferHostFromKeywords(input) {
  var tokens = String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (!tokens.length) return '';
  var stopwords = {
    open: true, go: true, to: true, in: true, on: true, at: true, the: true,
    wayback: true, web: true, archive: true, please: true, show: true, me: true,
    visit: true, site: true, page: true, random: true, surprise: true, with: true,
    a: true, an: true
  };
  for (var i = 0; i < tokens.length; i += 1) {
    var token = tokens[i];
    if (stopwords[token]) continue;
    if (token.length < 2) continue;
    if (/^\d+$/.test(token)) continue;
    return 'https://www.' + token + '.com/';
  }
  return '';
}

function parseWaybackTarget(rawValue, engine) {
  var input = String(rawValue || '').trim();
  if (!input) return null;
  var requestedYear = extractRequestedYear(input);
  var activeEngine = engine && typeof engine.searchUrl === 'function' ? engine : presets[0];
  var commandTarget = resolveNaturalCommand(input, activeEngine, requestedYear);
  if (commandTarget) return commandTarget;

  var originalFromWayback = extractWaybackOriginalUrl(input);
  var domainToken = extractDomainLikeToken(input);
  var aliasEntry = resolveAliasUrl(input);
  var keywordHost = inferHostFromKeywords(input);
  var source = originalFromWayback || domainToken || (aliasEntry && aliasEntry.url) || keywordHost || '';

  if (!source) return null;
  if (!/^https?:\/\//i.test(source)) source = 'https://' + source.replace(/^\/+/, '');

  var forceLocalMode = aliasEntry && aliasEntry.mode === 'local-geocities-1999';
  if (aliasEntry && aliasEntry.mode && (requestedYear === DEFAULT_WAYBACK_YEAR || forceLocalMode)) {
    return {
      archiveUrl: 'https://web.archive.org/web/' + (aliasEntry.timestamp || String(DEFAULT_WAYBACK_YEAR) + '0101000000') + '/' + source,
      displayValue: source,
      sourceUrl: source,
      title: aliasEntry.display || aliasEntry.title || source,
      mode: aliasEntry.mode,
      requestedYear: requestedYear,
      engine: activeEngine
    };
  }
  var target = normalizeArchiveTarget(source);
  target.archiveUrl = 'https://web.archive.org/web/' + String(requestedYear) + '0101000000/' + source;
  target.displayValue = source;
  target.sourceUrl = source;
  target.title = (aliasEntry && aliasEntry.title ? aliasEntry.title : source) + ' (Wayback ' + requestedYear + ')';
  target.requestedYear = requestedYear;
  target.engine = activeEngine;
  return target;
}

function suggestAddressInput(rawValue, engine) {
  var value = String(rawValue || '').trim();
  if (!value) return [];
  var query = value.toLowerCase();
  var activeEngine = engine && typeof engine.searchUrl === 'function' ? engine : presets[0];
  var results = [];
  var seen = {};

  function push(label, suggestionValue, meta, target) {
    var key = String(suggestionValue || label || '').toLowerCase();
    if (!key || seen[key]) return;
    seen[key] = true;
    results.push({
      label: label,
      value: suggestionValue,
      meta: meta || '',
      target: target || null
    });
  }

  Object.keys(aliasMap).forEach(function(alias) {
    if (alias.indexOf(query) === -1 && query.indexOf(alias) === -1) return;
    var entry = aliasMap[alias];
    var year = extractRequestedYear(value);
    var target = parseWaybackTarget(alias + ' in ' + year, activeEngine);
    push(entry.title || alias, alias + ' in ' + year, 'Wayback ' + year, target);
  });

  archiveSearchIndex.forEach(function(item) {
    var haystack = (item.title + ' ' + item.url + ' ' + (item.keywords || []).join(' ')).toLowerCase();
    if (haystack.indexOf(query) === -1) return;
    var year = extractRequestedYear(value);
    var target = parseWaybackTarget(item.url + ' in ' + year, activeEngine);
    push(item.title, item.url + ' in ' + year, 'Snapshot suggestion', target);
  });

  if (results.length < 6) {
    push('Search archived web for "' + value + '"', value, 'Archive search', buildSearchTarget(value, activeEngine));
  }

  return results.slice(0, 6);
}

function normalizeYearForWayback(year) {
  var numericYear = Number(year);
  if (!Number.isFinite(numericYear)) return DEFAULT_WAYBACK_YEAR;
  if (numericYear < 1994) return 1994;
  if (numericYear > 2026) return 2026;
  return Math.round(numericYear);
}

async function resolveArchiveTarget(target) {
  if (!target || typeof target !== 'object') return target;
  if (target.mode && /^local-/.test(target.mode)) return target;
  if (target.mode === 'local-search-results') return target;
  var sourceUrl = String(target.sourceUrl || target.displayValue || '').trim();
  if (!sourceUrl) return target;
  var year = normalizeYearForWayback(target.requestedYear || DEFAULT_WAYBACK_YEAR);

  var desiredTimestamp = String(year) + '0701000000';
  var availabilityUrl = 'https://archive.org/wayback/available?url=' +
    encodeURIComponent(sourceUrl) +
    '&timestamp=' + desiredTimestamp;

  var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  var timeoutId = controller ? setTimeout(function() { controller.abort(); }, 3200) : 0;
  try {
    var response = await fetch(availabilityUrl, controller ? { signal: controller.signal } : {});
    if (!response.ok) throw new Error('Wayback availability request failed');
    var payload = await response.json();
    var closest = payload && payload.archived_snapshots && payload.archived_snapshots.closest ? payload.archived_snapshots.closest : null;
    if (closest && closest.url) {
      return Object.assign({}, target, {
        archiveUrl: String(closest.url),
        title: (target.title || sourceUrl) + ' • closest snapshot',
        resolvedTimestamp: closest.timestamp || ''
      });
    }
  } catch (_) {
    // Fall back to static timestamp URL if lookup fails.
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  return Object.assign({}, target, {
    archiveUrl: 'https://web.archive.org/web/' + String(year) + '0101000000/' + sourceUrl
  });
}

function normalizeArchiveTarget(rawValue) {
  var raw = String(rawValue || '').trim();
  if (!raw) raw = presets[0].url;
  if (raw.toLowerCase() === 'about:win98-inside' || raw.toLowerCase() === 'win98 inside win98') {
    return {
      archiveUrl: '',
      displayValue: 'about:win98-inside',
      sourceUrl: 'about:win98-inside',
      title: 'Win98 Inside Win98',
      mode: 'local-win98-inside-win98'
    };
  }
  if (raw.indexOf('web.archive.org/web/') !== -1) {
    return { archiveUrl: raw, displayValue: raw, sourceUrl: raw, title: raw };
  }
  if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw.replace(/^\/+/, '');
  return {
    archiveUrl: 'https://web.archive.org/web/19991130235959/' + raw,
    displayValue: raw,
    sourceUrl: raw,
    title: raw
  };
}
    return {
      presets: presets,
      escapeHtml: escapeHtml,
      buildGoogle1999Doc: buildGoogle1999Doc,
      buildYahoo1998Doc: buildYahoo1998Doc,
      buildAltaVista1999Doc: buildAltaVista1999Doc,
      buildGeoCities1999Doc: buildGeoCities1999Doc,
      buildYoutube2005Doc: buildYoutube2005Doc,
      buildWin98InsideWin98Doc: buildWin98InsideWin98Doc,
      buildArchiveSearchResultsDoc: buildArchiveSearchResultsDoc,
      looksLikeSearchQuery: looksLikeSearchQuery,
      buildSearchTarget: buildSearchTarget,
      parseWaybackTarget: parseWaybackTarget,
      suggestAddressInput: suggestAddressInput,
      resolveArchiveTarget: resolveArchiveTarget,
      normalizeArchiveTarget: normalizeArchiveTarget
    };
  }

  window.Win95IEData = createWin95IEData();
})();
