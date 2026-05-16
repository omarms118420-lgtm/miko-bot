const express = require("express");
const https   = require("https");
const http    = require("http");
const path    = require("path");
const fs      = require("fs");

const app  = express();
const PORT = process.env.PORT || 5000;
const BOT_START_TIME = Date.now();
const EXTERNAL_URL   = process.env.RENDER_EXTERNAL_URL
  || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dashDir = path.join(__dirname, "..", "dashboard");
app.use("/css",    express.static(path.join(dashDir, "css")));
app.use("/js",     express.static(path.join(dashDir, "js")));
app.use("/images", express.static(path.join(dashDir, "images")));

/* ── Health check endpoints (Render uses these) ── */
app.get(["/health", "/healthz", "/ping"], (_,res) => {
  const mgr = global.botManager || {};
  res.json({
    status: "ok",
    bot:    mgr.status || "unknown",
    uptime: Math.floor((Date.now() - BOT_START_TIME) / 1000),
    memory: Math.round(process.memoryUsage().rss / 1024 / 1024) + "MB",
    ts:     Date.now()
  });
});

/* ── Uptime API (used by dashboard) ── */
app.get("/uptime", (_,res) => {
  const mgr = global.botManager || {};
  const Mirror = global.Mirror || {};
  res.json({
    uptime:    Math.floor((Date.now() - BOT_START_TIME) / 1000),
    botStatus: mgr.status    || "stopped",
    errorMsg:  mgr.errorMsg  || "",
    pid:       mgr.pid       || null,
    threads:   Mirror.client?.threads?.size || 0,
    users:     Mirror.client?.users?.size   || 0,
    commands:  Mirror.client?.commands?.size || 0,
    logs:      (mgr.logs || []).slice(-50),
    memory:    Math.round(process.memoryUsage().rss / 1024 / 1024)
  });
});

/* ── Bot control API ── */
app.post("/api/restart", (req,res) => {
  const mgr = global.botManager;
  if (!mgr) return res.json({ ok: false, msg: "botManager غير جاهز" });
  try { mgr.restart(); res.json({ ok: true }); }
  catch(e) { res.json({ ok: false, msg: e.message }); }
});

app.post("/api/stop", (req,res) => {
  const mgr = global.botManager;
  if (!mgr) return res.json({ ok: false });
  try { mgr.stop(); res.json({ ok: true }); }
  catch(e) { res.json({ ok: false, msg: e.message }); }
});

app.post("/api/start", (req,res) => {
  const mgr = global.botManager;
  if (!mgr) return res.json({ ok: false });
  try { mgr.start(); res.json({ ok: true }); }
  catch(e) { res.json({ ok: false, msg: e.message }); }
});

/* ── PWA Manifest ── */
app.get("/manifest.json", (_,res) => {
  res.setHeader("Content-Type","application/manifest+json");
  res.json({
    name: "بوت ميكو 🌸",
    short_name: "ميكو 🌸",
    description: "لوحة تحكم بوت ميكو على فيسبوك ماسنجر",
    start_url: "/",
    display: "standalone",
    background_color: "#0d0d1a",
    theme_color: "#c084fc",
    orientation: "portrait-primary",
    lang: "ar",
    dir: "rtl",
    icons: [
      { src: "/images/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "/images/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
    ],
    shortcuts: [{ name: "تشغيل البوت", url: "/", description: "لوحة التحكم" }]
  });
});

/* ── Service Worker ── */
app.get("/sw.js", (_,res) => {
  res.setHeader("Content-Type","application/javascript");
  res.setHeader("Service-Worker-Allowed","/");
  res.send(`
const CACHE='miko-v4';
const OFFLINE='/offline.html';
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/','/offline.html','/manifest.json']).catch(()=>{})));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.pathname.startsWith('/api/')||u.pathname==='/uptime'||u.pathname==='/health')return;
  e.respondWith(
    fetch(e.request).then(r=>{
      if(r&&r.status===200){const c=r.clone();caches.open(CACHE).then(ca=>ca.put(e.request,c));}
      return r;
    }).catch(()=>caches.match(e.request).then(r=>r||caches.match(OFFLINE)))
  );
});`);
});

/* ── Offline Page ── */
app.get("/offline.html",(_,res)=>{
  res.setHeader("Content-Type","text/html;charset=utf-8");
  res.send(`<!DOCTYPE html><html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>بوت ميكو 🌸 — غير متصل</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0d0d1a;color:#f1f5f9;font-family:'Tajawal',sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:2rem}
h1{font-size:2rem;color:#c084fc;margin-bottom:1rem}
p{color:#94a3b8;margin-bottom:2rem}
button{background:#7c3aed;color:#fff;border:none;padding:.75rem 2rem;border-radius:12px;font-size:1rem;cursor:pointer}
button:hover{background:#6d28d9}
</style></head>
<body>
<h1>🌸 أنت غير متصل</h1>
<p>تحقق من اتصالك بالإنترنت ثم حاول مجدداً.</p>
<button onclick="location.reload()">🔄 إعادة المحاولة</button>
</body></html>`);
});

/* ── Main dashboard ── */
app.get("/", (_,res) => {
  const dashFile = path.join(dashDir, "index.html");
  if (fs.existsSync(dashFile)) return res.sendFile(dashFile);

  // Fallback inline dashboard
  res.setHeader("Content-Type","text/html;charset=utf-8");
  res.send(`<!DOCTYPE html><html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>بوت ميكو 🌸</title>
<link rel="manifest" href="/manifest.json">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap" rel="stylesheet">
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
<style>
:root{--bg:#0d0d1a;--card:#161627;--border:#2d2d4e;--accent:#c084fc;--accent2:#818cf8;--green:#4ade80;--red:#f87171;--yellow:#fbbf24;--text:#f1f5f9;--muted:#64748b}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:'Tajawal',sans-serif;min-height:100vh}
.header{background:linear-gradient(135deg,#1e1b4b,#2d1b69);padding:1.5rem;text-align:center;border-bottom:1px solid var(--border)}
.header h1{font-size:1.8rem;font-weight:900;background:linear-gradient(90deg,#c084fc,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.header p{color:var(--muted);font-size:.9rem;margin-top:.3rem}
.container{max-width:900px;margin:0 auto;padding:1.5rem}
.card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:1.5rem;margin-bottom:1.2rem}
.card-title{font-size:1rem;font-weight:700;color:var(--accent);margin-bottom:1rem;display:flex;align-items:center;gap:.5rem}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1rem}
.stat{background:#1a1a2e;border-radius:12px;padding:1rem;text-align:center}
.stat-val{font-size:1.8rem;font-weight:900;color:var(--accent);display:block}
.stat-lbl{font-size:.8rem;color:var(--muted);margin-top:.2rem}
.status-pill{display:inline-flex;align-items:center;gap:.5rem;padding:.4rem 1rem;border-radius:999px;font-size:.9rem;font-weight:700}
.s-run{background:rgba(74,222,128,.15);color:var(--green);border:1px solid rgba(74,222,128,.3)}
.s-stop{background:rgba(248,113,113,.15);color:var(--red);border:1px solid rgba(248,113,113,.3)}
.s-start{background:rgba(251,191,36,.15);color:var(--yellow);border:1px solid rgba(251,191,36,.3)}
.dot{width:8px;height:8px;border-radius:50%;background:currentColor}
.d-pulse{animation:pulse 1.5s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.btn{display:inline-flex;align-items:center;gap:.5rem;padding:.6rem 1.4rem;border:none;border-radius:10px;font-size:.95rem;font-weight:700;cursor:pointer;transition:.2s;font-family:'Tajawal',sans-serif}
.btn-primary{background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 20px rgba(124,58,237,.4)}
.btn-danger{background:rgba(248,113,113,.15);color:var(--red);border:1px solid rgba(248,113,113,.3)}
.btn-danger:hover{background:rgba(248,113,113,.3)}
.btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btns{display:flex;gap:.8rem;flex-wrap:wrap}
.log-box{background:#0a0a14;border-radius:10px;padding:1rem;max-height:280px;overflow-y:auto;font-family:monospace;font-size:.78rem;line-height:1.6;border:1px solid var(--border)}
.ll{color:#94a3b8;padding:.1rem 0}
.le{color:#f87171}
.lg{color:#4ade80}
.err-banner{background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.3);color:var(--red);padding:.75rem 1rem;border-radius:10px;margin-bottom:1rem;font-size:.9rem;display:none}
.mem-bar{height:6px;background:#1a1a2e;border-radius:3px;overflow:hidden;margin-top:.5rem}
.mem-fill{height:100%;background:linear-gradient(90deg,#4ade80,#fbbf24,#f87171);border-radius:3px;transition:width .5s}
</style>
</head>
<body>
<div class="header">
  <h1>🌸 بوت ميكو</h1>
  <p>لوحة تحكم فيسبوك ماسنجر</p>
</div>
<div class="container">

  <!-- Error Banner -->
  <div class="err-banner" id="err-banner"></div>

  <!-- Status card -->
  <div class="card">
    <div class="card-title"><i class="fas fa-circle-dot"></i> حالة البوت</div>
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem">
      <span class="status-pill s-stop" id="status-badge">
        <span class="dot" id="status-dot"></span>
        <span id="status-txt">يتحقق...</span>
      </span>
      <div class="btns">
        <button class="btn btn-primary" id="btn-restart" onclick="doAction('restart')">
          <i class="fas fa-play" id="btn-icon"></i>
          <span id="btn-txt">تشغيل البوت</span>
        </button>
        <button class="btn btn-danger" onclick="doAction('stop')">
          <i class="fas fa-stop"></i> إيقاف
        </button>
      </div>
    </div>
    <div style="margin-top:1rem">
      <div style="display:flex;justify-content:space-between;font-size:.8rem;color:var(--muted)">
        <span>الذاكرة</span>
        <span id="mem-label">0 MB / 512 MB</span>
      </div>
      <div class="mem-bar"><div class="mem-fill" id="mem-fill" style="width:0%"></div></div>
    </div>
  </div>

  <!-- Stats -->
  <div class="card">
    <div class="card-title"><i class="fas fa-chart-bar"></i> الإحصائيات</div>
    <div class="stats">
      <div class="stat"><span class="stat-val" id="s-up">0د</span><div class="stat-lbl">وقت التشغيل</div></div>
      <div class="stat"><span class="stat-val" id="s-t">0</span><div class="stat-lbl">المحادثات</div></div>
      <div class="stat"><span class="stat-val" id="s-u">0</span><div class="stat-lbl">المستخدمون</div></div>
      <div class="stat"><span class="stat-val" id="s-c">0</span><div class="stat-lbl">الأوامر</div></div>
    </div>
  </div>

  <!-- Logs -->
  <div class="card">
    <div class="card-title"><i class="fas fa-terminal"></i> سجل النظام</div>
    <div class="log-box" id="log-box">
      <div class="ll" style="color:var(--muted)">⏳ انتظار السجلات...</div>
    </div>
  </div>

</div>
<script>
(function(){
  const badge    = document.getElementById('status-badge');
  const dot      = document.getElementById('status-dot');
  const stxt     = document.getElementById('status-txt');
  const btnR     = document.getElementById('btn-restart');
  const bico     = document.getElementById('btn-icon');
  const btxt     = document.getElementById('btn-txt');
  const errBnr   = document.getElementById('err-banner');
  const logBox   = document.getElementById('log-box');
  const memFill  = document.getElementById('mem-fill');
  const memLabel = document.getElementById('mem-label');

  const statusMap = {
    running:    ['s-run',  'd-pulse', 'يعمل ✅'],
    starting:   ['s-start','d-pulse', 'يبدأ...'],
    restarting: ['s-start','d-pulse', 'يُعاد تشغيله...'],
    error:      ['s-stop', '',        'خطأ ❌'],
    stopped:    ['s-stop', '',        'متوقف'],
  };

  function doAction(act) {
    btnR.disabled = true;
    fetch('/api/' + act, { method:'POST' })
      .then(() => setTimeout(refresh, 1500))
      .catch(() => {})
      .finally(() => setTimeout(() => btnR.disabled = false, 3000));
  }
  window.doAction = doAction;

  let lastTs = 0;
  function updateLogs(logs) {
    if (!logBox || !logs.length) return;
    const nl = logs.filter(l => l.time > lastTs);
    if (!nl.length) return;
    if (logBox.children.length === 1 && logBox.children[0].textContent.includes('انتظار'))
      logBox.innerHTML = '';
    nl.forEach(l => {
      const d = document.createElement('div');
      const isErr = /ERR|خطأ|Error|فشل/.test(l.msg);
      const isOk  = /✅|نجاح|يعمل|مستقر/.test(l.msg);
      d.className = 'll' + (isErr?' le':isOk?' lg':'');
      d.textContent = l.msg;
      logBox.appendChild(d);
      lastTs = l.time;
    });
    logBox.scrollTop = logBox.scrollHeight;
    while (logBox.children.length > 100) logBox.removeChild(logBox.firstChild);
  }

  function refresh() {
    fetch('/uptime').then(r => r.json()).then(d => {
      // stats
      const up = d.uptime||0, h = Math.floor(up/3600), m = Math.floor((up%3600)/60);
      document.getElementById('s-up').textContent = h>0 ? h+'س '+m+'د' : m+'د';
      document.getElementById('s-t').textContent  = d.threads  || 0;
      document.getElementById('s-u').textContent  = d.users    || 0;
      document.getElementById('s-c').textContent  = d.commands || 0;

      // memory
      const mem = d.memory || 0;
      memFill.style.width  = Math.min(mem/512*100, 100) + '%';
      memLabel.textContent = mem + ' MB / 512 MB';

      // status
      const st = d.botStatus || 'stopped';
      const [bc, dc, tx] = statusMap[st] || statusMap.stopped;
      badge.className = 'status-pill ' + bc;
      dot.className   = 'dot ' + dc;
      stxt.textContent = tx;

      // error
      if (errBnr) {
        errBnr.textContent = d.errorMsg ? '⚠️ ' + d.errorMsg : '';
        errBnr.style.display = d.errorMsg ? 'block' : 'none';
      }

      // button
      if (btnR && !btnR.disabled) {
        bico.className = (st==='running') ? 'fas fa-sync-alt' : 'fas fa-play';
        btxt.textContent = (st==='running') ? 'إعادة تشغيل' : 'تشغيل البوت';
      }

      updateLogs(d.logs || []);
    }).catch(() => {
      badge.className = 'status-pill s-stop';
      stxt.textContent = 'انقطع الاتصال ⚠️';
    });
  }

  setInterval(refresh, 7000);
  setTimeout(refresh, 1500);
  window.addEventListener('online', refresh);
})();
</script>
</body>
</html>`);
});

/* ── Start server ── */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\x1b[35m[ميكو 🌸]\x1b[0m الموقع يعمل على المنفذ ${PORT} ✅`);
  if (EXTERNAL_URL) console.log(`\x1b[35m[ميكو 🌸]\x1b[0m الرابط: ${EXTERNAL_URL} 🌐`);
});

/* ══════════════════════════════════════════════════════════════
   KEEP-ALIVE ENGINE
   Prevents Render free tier from sleeping (sleeps after 15 min)
   Strategy:
     1. Self-ping every 10 min (safe margin before 15-min timeout)
     2. Backup ping every 13 min (insurance)
     3. Health endpoint ping every 5 min
   ══════════════════════════════════════════════════════════════ */
let _pingCount = 0;
let _pingFails  = 0;

function doPing(urlStr, label) {
  if (!urlStr) return;
  try {
    const u = new URL(urlStr);
    const mod = u.protocol === "https:" ? https : http;
    const req = mod.request({
      hostname: u.hostname,
      port:     u.port || (u.protocol === "https:" ? 443 : 80),
      path:     u.pathname + (u.search || ""),
      method:   "GET",
      timeout:  12000,
      headers:  { "User-Agent": "Miko-KeepAlive/4.0", "Accept": "*/*" }
    }, res => {
      _pingCount++;
      _pingFails = 0;
      if (process.env.DEBUG_PING)
        console.log(`\x1b[35m[ميكو 💓]\x1b[0m ${label} → ${res.statusCode} (#${_pingCount})`);
    });
    req.on("error",   () => { _pingFails++; });
    req.on("timeout", () => { _pingFails++; req.destroy(); });
    req.end();
  } catch(e) {}
}

function keepAlive() {
  if (!EXTERNAL_URL) {
    console.log("\x1b[33m[ميكو ⚠️]\x1b[0m RENDER_EXTERNAL_URL غير محدد — Keep-alive معطل");
    return;
  }

  // Primary ping: /ping every 10 minutes
  setTimeout(() => {
    doPing(EXTERNAL_URL + "/ping", "primary");
    setInterval(() => doPing(EXTERNAL_URL + "/ping", "primary"), 10 * 60 * 1000);
  }, 60 * 1000);  // first ping after 1 min

  // Backup ping: /health every 13 minutes (offset to avoid simultaneous)
  setTimeout(() => {
    doPing(EXTERNAL_URL + "/health", "backup");
    setInterval(() => doPing(EXTERNAL_URL + "/health", "backup"), 13 * 60 * 1000);
  }, 3 * 60 * 1000);  // first after 3 min

  // Log heartbeat every 30 min
  setInterval(() => {
    const mgr = global.botManager || {};
    console.log(
      `\x1b[35m[ميكو 💓]\x1b[0m` +
      ` نبضات: ${_pingCount}` +
      ` | فشل: ${_pingFails}` +
      ` | البوت: ${mgr.status || "?"}` +
      ` | ذاكرة: ${Math.round(process.memoryUsage().rss/1024/1024)}MB`
    );
  }, 30 * 60 * 1000);

  console.log(`\x1b[35m[ميكو 💓]\x1b[0m Keep-alive مُفعَّل ✅ (كل 10 دقائق)`);
}

keepAlive();

module.exports = app;
