const express = require("express");
const https   = require("https");
const http    = require("http");
const path    = require("path");
const fs      = require("fs");

const app  = express();
const PORT = process.env.PORT || 5000;
const BOT_START_TIME = Date.now();
const EXTERNAL_URL   = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dashDir = path.join(__dirname, "..", "dashboard");
app.use("/css",    express.static(path.join(dashDir, "css")));
app.use("/js",     express.static(path.join(dashDir, "js")));
app.use("/images", express.static(path.join(dashDir, "images")));

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
const CACHE='miko-v3';
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
  if(u.pathname.startsWith('/api/')||u.pathname==='/uptime')return;
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
body{background:#0d0d1a;color:#f1f5f9;font-family:'Tajawal',sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:2rem;direction:rtl}
.icon{font-size:5rem;margin-bottom:1.5rem}
h1{font-size:2rem;font-weight:800;color:#c084fc;margin-bottom:1rem}
p{color:#94a3b8;max-width:380px;line-height:1.7;margin-bottom:2rem}
button{background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;border:none;border-radius:999px;padding:.9rem 2.2rem;font-size:1rem;font-weight:700;cursor:pointer}
</style>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@700;800&display=swap">
</head>
<body>
<div class="icon">📡</div>
<h1>أنت غير متصل بالإنترنت</h1>
<p>لا يمكن الوصول للخادم الآن. تأكد من اتصالك وأعد المحاولة.</p>
<button onclick="location.reload()">🔄 إعادة المحاولة</button>
<script>window.addEventListener('online',()=>location.reload())</script>
</body></html>`);
});

/* ── API: Status ── */
app.get("/ping",(_,res)=>res.json({status:"ok",time:new Date().toISOString(),uptime:Math.floor((Date.now()-BOT_START_TIME)/1000)}));

app.get("/uptime",(_,res)=>{
  const mgr=global.botManager||{};
  res.json({
    status:"ok", bot:global.botID||null,
    botStatus:mgr.status||"stopped",
    errorMsg:mgr.errorMsg||"",
    uptime:Math.floor(process.uptime()),
    commands:global.GoatBot?.commands?.size||0,
    threads:global.db?.allThreadData?.length||0,
    users:global.db?.allUserData?.length||0,
    logs:mgr.logs?mgr.logs.slice(-25):[]
  });
});

/* ── API: Bot Control (no password required) ── */
app.post("/api/bot/start",(req,res)=>{
  const mgr=global.botManager;
  if(!mgr)return res.json({status:"error",message:"نظام التحكم غير جاهز"});
  const ok=mgr.start();
  res.json({status:ok?"success":"info",message:ok?"جاري تشغيل البوت... ⏳":"البوت يعمل بالفعل"});
});

app.post("/api/bot/restart",(req,res)=>{
  const mgr=global.botManager;
  if(!mgr)return res.json({status:"error",message:"نظام التحكم غير جاهز"});
  mgr.restart();
  res.json({status:"success",message:"جاري إعادة التشغيل... 🔄"});
});

app.post("/api/bot/stop",(req,res)=>{
  const mgr=global.botManager;
  if(!mgr)return res.json({status:"error",message:"نظام التحكم غير جاهز"});
  mgr.stop();
  res.json({status:"success",message:"تم إيقاف البوت ⏹️"});
});

app.post("/api/cookies",(req,res)=>{
  const{fbstate}=req.body;
  if(!fbstate||!fbstate.trim())return res.json({status:"error",message:"الرجاء إدخال الكوكيز"});
  try{
    fs.writeFileSync(path.join(__dirname,"..","account.txt"),fbstate.trim());
    res.json({status:"success",message:"✅ تم حفظ الكوكيز — جاري إعادة التشغيل..."});
    // Give response time to reach client before restarting
    setTimeout(()=>{
      const mgr=global.botManager;
      if(mgr) mgr.restart();
    },800);
  }catch(e){res.json({status:"error",message:"فشل الحفظ: "+e.message});}
});

/* ════════════════════════════════════════════════
   MAIN PAGE — بوت ميكو 🌸 (Arabic, no goat)
   ════════════════════════════════════════════════ */
app.get(["/","/home"],(_,res)=>{
  const mgr    = global.botManager||{};
  const status = mgr.status||"stopped";
  const online = status==="running";
  const loading= status==="starting"||status==="restarting";
  const threads= global.db?.allThreadData?.length||0;
  const users  = global.db?.allUserData?.length||0;
  const cmds   = global.GoatBot?.commands?.size||0;
  const up     = Math.floor(process.uptime());
  const h=Math.floor(up/3600), m=Math.floor((up%3600)/60);

  const badgeCls = online?"s-run":loading?"s-load":"s-stop";
  const dotCls   = online?"d-g":loading?"d-y":"d-r";
  const statusAr = online?"البوت يعمل ✓":loading?"جاري التشغيل...":"البوت متوقف";
  const uptimeTxt= h>0?h+"س "+m+"د":m+" دقيقة";

  res.setHeader("Content-Type","text/html;charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover">
<meta name="theme-color" content="#c084fc">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="بوت ميكو 🌸">
<link rel="manifest" href="/manifest.json">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌸</text></svg>">
<title>بوت ميكو 🌸</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" crossorigin="anonymous">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --p:#c084fc; --p2:#a855f7; --p3:#7c3aed;
  --pink:#f0abfc;
  --bg:#0d0d1a; --bg2:#12112b; --bg3:#1a183a;
  --text:#f1f5f9; --muted:#94a3b8;
  --card:rgba(255,255,255,.05); --bdr:rgba(255,255,255,.09);
  --green:#22c55e; --red:#ef4444; --yellow:#fbbf24;
}
html{scroll-behavior:smooth}
body{
  font-family:'Tajawal',sans-serif;
  background:var(--bg); color:var(--text);
  direction:rtl; min-height:100vh; overflow-x:hidden;
}
body::before{
  content:'';position:fixed;inset:0;pointer-events:none;
  background:
    radial-gradient(ellipse 90% 55% at 15% -5%, rgba(192,132,252,.2) 0%,transparent 55%),
    radial-gradient(ellipse 70% 50% at 85% 105%,rgba(168,85,247,.14) 0%,transparent 55%);
}

/* NAV */
nav{
  position:fixed;top:0;left:0;right:0;z-index:200;
  background:rgba(13,13,26,.88);backdrop-filter:blur(18px);
  border-bottom:1px solid rgba(192,132,252,.18);
  padding:.75rem 1.2rem;
  display:flex;align-items:center;justify-content:space-between;
}
.brand{display:flex;align-items:center;gap:.7rem;text-decoration:none}
.brand-icon{
  width:42px;height:42px;border-radius:50%;
  background:linear-gradient(135deg,var(--p3),var(--p2));
  display:flex;align-items:center;justify-content:center;
  font-size:1.4rem;
  box-shadow:0 0 18px rgba(192,132,252,.45);
  flex-shrink:0;
}
.brand-text{display:flex;flex-direction:column;line-height:1.15}
.brand-name{font-size:1.05rem;font-weight:900;color:var(--p)}
.brand-sub{font-size:.65rem;color:var(--muted)}
.nav-links{display:flex;gap:.3rem;align-items:center}
.nav-links a{
  color:var(--muted);text-decoration:none;font-size:.84rem;font-weight:700;
  padding:.38rem .75rem;border-radius:.5rem;transition:all .2s;
}
.nav-links a:hover{color:var(--p);background:rgba(192,132,252,.1)}
.nav-cta{
  background:linear-gradient(135deg,var(--p2),var(--p3)) !important;
  color:#fff !important; border-radius:.55rem;
}
.nav-cta:hover{opacity:.9}

/* HERO */
.hero{
  min-height:100vh;display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  text-align:center;padding:7rem 1.2rem 4rem;
  position:relative;z-index:1;
}

/* AVATAR — emoji only, no image */
.avatar-wrap{position:relative;margin-bottom:2rem;display:inline-block}
.avatar-emoji{
  width:120px;height:120px;border-radius:50%;
  background:linear-gradient(135deg,var(--bg3) 0%,#1f1b45 100%);
  border:2.5px solid var(--p);
  box-shadow:0 0 0 10px rgba(192,132,252,.1), 0 0 60px rgba(192,132,252,.4);
  display:flex;align-items:center;justify-content:center;
  font-size:3.8rem;
  animation:float 4s ease-in-out infinite;
  position:relative;z-index:2;
}
@keyframes float{
  0%,100%{transform:translateY(0);box-shadow:0 0 0 10px rgba(192,132,252,.1),0 0 55px rgba(192,132,252,.35)}
  50%{transform:translateY(-12px);box-shadow:0 0 0 14px rgba(192,132,252,.07),0 0 80px rgba(192,132,252,.65)}
}
/* rotating ring with petals */
.ring{
  position:absolute;inset:-14px;border-radius:50%;
  border:1.5px dashed rgba(192,132,252,.35);
  animation:spin 9s linear infinite;z-index:1;
}
.ring::before,.ring::after{
  content:'🌸';position:absolute;font-size:1rem;
  animation:spin-r 9s linear infinite;
}
.ring::before{top:-12px;left:50%;transform:translateX(-50%)}
.ring::after{bottom:-12px;left:50%;transform:translateX(-50%)}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes spin-r{to{transform:rotate(-360deg)}}

/* TITLE */
.hero-title{
  font-size:clamp(2.4rem,6vw,3.6rem);font-weight:900;
  background:linear-gradient(135deg,#c084fc 0%,#f0abfc 45%,#a855f7 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  letter-spacing:-.02em;margin-bottom:.5rem;line-height:1.1;
}
.hero-sub{color:var(--muted);font-size:1rem;max-width:420px;line-height:1.75;margin-bottom:2.2rem}

/* STATUS */
.status-pill{
  display:inline-flex;align-items:center;gap:.55rem;
  padding:.42rem 1.2rem;border-radius:999px;
  font-size:.84rem;font-weight:700;margin-bottom:2rem;
  backdrop-filter:blur(8px);transition:all .4s;
}
.s-run{background:rgba(34,197,94,.11);color:var(--green);border:1px solid rgba(34,197,94,.35)}
.s-stop{background:rgba(239,68,68,.11);color:var(--red);border:1px solid rgba(239,68,68,.35)}
.s-load{background:rgba(251,191,36,.11);color:var(--yellow);border:1px solid rgba(251,191,36,.35)}
.dot{width:9px;height:9px;border-radius:50%;flex-shrink:0}
.d-g{background:var(--green);animation:blink 1.3s infinite}
.d-r{background:var(--red)}
.d-y{background:var(--yellow);animation:blink .7s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.15}}

/* BUTTONS */
.btn-start{
  display:inline-flex;align-items:center;gap:.8rem;
  background:linear-gradient(135deg,#22c55e,#16a34a);
  color:#fff;border:none;border-radius:999px;
  padding:1rem 3.2rem;font-size:1.2rem;font-weight:800;
  cursor:pointer;font-family:'Tajawal',sans-serif;
  box-shadow:0 0 32px rgba(34,197,94,.45),inset 0 1px 0 rgba(255,255,255,.12);
  transition:all .25s;margin-bottom:1rem;
}
.btn-start:hover{transform:translateY(-3px) scale(1.04);box-shadow:0 0 55px rgba(34,197,94,.65)}
.btn-start:active{transform:scale(.97)}
.btn-start:disabled{opacity:.5;cursor:not-allowed;transform:none;box-shadow:none}
.btn-row{display:flex;gap:.65rem;flex-wrap:wrap;justify-content:center}
.btn-o{
  display:inline-flex;align-items:center;gap:.5rem;
  background:transparent;color:var(--p);
  border:1.5px solid rgba(192,132,252,.45);border-radius:999px;
  padding:.6rem 1.5rem;font-size:.88rem;font-weight:700;
  cursor:pointer;text-decoration:none;font-family:'Tajawal',sans-serif;
  transition:all .22s;
}
.btn-o:hover{background:rgba(192,132,252,.1);border-color:var(--p);color:var(--p)}
.btn-o.red{color:var(--red);border-color:rgba(239,68,68,.4)}
.btn-o.red:hover{background:rgba(239,68,68,.1);border-color:var(--red)}

/* STATS */
.stats-box{
  display:flex;gap:1.8rem;flex-wrap:wrap;justify-content:center;
  margin-top:2.5rem;padding:1.4rem 2rem;
  background:var(--card);border:1px solid var(--bdr);
  border-radius:1.5rem;backdrop-filter:blur(10px);
}
.stat{text-align:center}
.stat-n{font-size:1.85rem;font-weight:900;color:var(--p);line-height:1}
.stat-l{font-size:.72rem;color:var(--muted);margin-top:.25rem;letter-spacing:.05em}

/* TOAST */
#toast{
  position:fixed;top:5.2rem;left:50%;transform:translateX(-50%);
  background:var(--bg3);border:1px solid rgba(192,132,252,.3);
  border-radius:.9rem;padding:.72rem 1.4rem;
  font-size:.87rem;font-weight:700;
  box-shadow:0 8px 32px rgba(0,0,0,.5);z-index:9999;
  opacity:0;transition:opacity .3s;pointer-events:none;
  max-width:300px;text-align:center;white-space:pre-line;
}
#toast.show{opacity:1}
#toast.ok{color:var(--green);border-color:rgba(34,197,94,.3)}
#toast.err{color:var(--red);border-color:rgba(239,68,68,.3)}
#toast.warn{color:var(--yellow);border-color:rgba(251,191,36,.3)}

/* SECTIONS */
.sec{padding:4rem 1rem;position:relative;z-index:1}
.sec-dark{background:rgba(18,17,43,.65)}
.wrap{max-width:940px;margin:0 auto}
.sec-h{text-align:center;font-size:1.75rem;font-weight:900;margin-bottom:.5rem}
.sec-s{text-align:center;color:var(--muted);margin-bottom:2.5rem;font-size:.95rem}
.pur{color:var(--p)}

/* GRID CARDS */
.grid{display:grid;gap:1.1rem}
.g4{grid-template-columns:repeat(auto-fit,minmax(170px,1fr))}
.g2{grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
.card{
  background:var(--card);border:1px solid var(--bdr);
  border-radius:1.2rem;padding:1.5rem;text-align:center;
  transition:transform .25s,border-color .25s;
}
.card:hover{transform:translateY(-5px);border-color:rgba(192,132,252,.35)}
.card i{font-size:2rem;color:var(--p);display:block;margin-bottom:.85rem}
.card h4{font-size:.95rem;font-weight:800;margin-bottom:.35rem}
.card p{color:var(--muted);font-size:.83rem;line-height:1.55}

/* FORM */
.form-box{
  background:rgba(192,132,252,.05);
  border:1.5px solid rgba(192,132,252,.2);
  border-radius:1.5rem;padding:2rem;max-width:620px;margin:0 auto;
}
.form-box h3{text-align:center;color:var(--p);font-size:1.3rem;font-weight:900;margin-bottom:.4rem}
.form-desc{text-align:center;color:var(--muted);font-size:.87rem;margin-bottom:1.5rem}
.inp{
  width:100%;background:var(--bg);
  border:1.5px solid var(--bdr);border-radius:.8rem;
  color:var(--text);padding:.75rem 1rem;font-size:.92rem;
  font-family:'Tajawal',sans-serif;transition:border-color .25s;
  display:block;margin-bottom:.9rem;
}
.inp:focus{outline:none;border-color:var(--p)}
textarea.inp{height:130px;resize:vertical;font-family:monospace;font-size:.82rem}
.btn-save{
  width:100%;background:linear-gradient(135deg,var(--p2),var(--p3));
  color:#fff;border:none;border-radius:.8rem;
  padding:.88rem;font-size:1rem;font-weight:800;
  cursor:pointer;font-family:'Tajawal',sans-serif;
  transition:opacity .25s,transform .2s;
}
.btn-save:hover{opacity:.9;transform:translateY(-2px)}
.btn-save:disabled{opacity:.5;cursor:not-allowed;transform:none}
.alert-row{
  border-radius:.65rem;padding:.65rem .9rem;
  margin-bottom:.8rem;font-weight:700;font-size:.87rem;
  display:none;
}
.ok-row{background:rgba(34,197,94,.1);color:var(--green);border:1px solid rgba(34,197,94,.3)}
.err-row{background:rgba(239,68,68,.1);color:var(--red);border:1px solid rgba(239,68,68,.3)}

/* LOGS */
#log-box{
  background:#060613;border:1px solid rgba(192,132,252,.18);
  border-radius:1rem;padding:.9rem;height:210px;overflow-y:auto;
  font-family:monospace;font-size:.77rem;color:#a0aec0;
  text-align:left;direction:ltr;
}
#log-box .ll{padding:.15rem 0;border-bottom:1px solid rgba(255,255,255,.03);line-height:1.5}
#log-box .le{color:#fc8181} #log-box .lg{color:#68d391}

/* INSTALL */
.inst-card{
  background:var(--card);border:1px solid var(--bdr);
  border-radius:1.4rem;padding:1.8rem;text-align:center;
}
.inst-card h4{font-size:.98rem;font-weight:800;margin-bottom:.5rem}
.inst-card p{color:var(--muted);font-size:.84rem;margin-bottom:.9rem;line-height:1.6}

/* no modal needed */

/* PWA BANNER */
#pwa-banner{
  position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);
  background:var(--bg3);border:1px solid rgba(192,132,252,.4);
  border-radius:1rem;padding:.85rem 1.1rem;
  display:none;align-items:center;gap:.8rem;
  box-shadow:0 8px 32px rgba(0,0,0,.5);
  max-width:370px;width:90%;z-index:9997;
}
#pwa-banner.show{display:flex}
#pwa-banner p{color:var(--text);font-size:.85rem;font-weight:700;flex:1}
#pwa-install{background:var(--p2);color:#fff;border:none;border-radius:.5rem;padding:.42rem .95rem;font-weight:700;cursor:pointer;white-space:nowrap;font-family:'Tajawal',sans-serif}
#pwa-x{background:transparent;color:var(--muted);border:none;font-size:1.1rem;cursor:pointer;padding:.3rem}

footer{
  text-align:center;padding:2rem 1rem;
  border-top:1px solid var(--bdr);
  color:var(--muted);font-size:.82rem;position:relative;z-index:1;
}
footer a{color:var(--p);text-decoration:none}

@media(max-width:580px){
  .nav-links .hs{display:none}
  .stats-box{gap:1.2rem;padding:1.2rem 1rem}
  .btn-start{padding:.9rem 2.2rem;font-size:1.1rem}
}
</style>
</head>
<body>

<!-- NAV -->
<nav>
  <a class="brand" href="/">
    <div class="brand-icon">🌸</div>
    <div class="brand-text">
      <span class="brand-name">بوت ميكو</span>
      <span class="brand-sub">لوحة التحكم</span>
    </div>
  </a>
  <div class="nav-links">
    <a href="#features" class="hs">المميزات</a>
    <a href="#cookies"  class="hs">الكوكيز</a>
    <a href="#logs"     class="hs">السجل</a>
    <a href="#install"  class="hs">تحميل</a>
    <a href="/dashboard" class="nav-cta">لوحة التحكم</a>
  </div>
</nav>

<!-- HERO -->
<section class="hero">
  <!-- Emoji avatar — no goat image -->
  <div class="avatar-wrap">
    <div class="avatar-emoji">🤖</div>
    <div class="ring"></div>
  </div>

  <h1 class="hero-title">بوت ميكو 🌸</h1>
  <p class="hero-sub">بوت فيسبوك ماسنجر الذكي — تحكم به من أي مكان بدون الدخول إلى Replit</p>

  <div id="sbadge" class="status-pill ${badgeCls}">
    <span class="dot ${dotCls}"></span>
    <span id="stxt">${statusAr}</span>
  </div>

  <div id="err-banner" style="display:${mgr.errorMsg?'block':'none'};background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.35);color:#fca5a5;border-radius:.75rem;padding:.6rem 1.2rem;font-size:.85rem;font-weight:700;margin-bottom:1rem;max-width:420px;text-align:center">${mgr.errorMsg||''}</div>

  <div>
    <button class="btn-start" id="btn-run" onclick="runBot()">
      <i class="fas fa-play" id="bico"></i>
      <span id="btxt">${online?"إعادة تشغيل":"تشغيل البوت"}</span>
    </button>
  </div>
  <div class="btn-row">
    <button class="btn-o red" onclick="stopBot()"><i class="fas fa-stop"></i> إيقاف</button>
    <a href="#cookies" class="btn-o"><i class="fas fa-cookie-bite"></i> الكوكيز</a>
    <a href="#logs"    class="btn-o"><i class="fas fa-terminal"></i> السجل</a>
    <a href="#install" class="btn-o"><i class="fas fa-download"></i> تحميل</a>
  </div>

  <div class="stats-box">
    <div class="stat"><div class="stat-n" id="s-t">${threads}</div><div class="stat-l">مجموعة</div></div>
    <div class="stat"><div class="stat-n" id="s-u">${users}</div><div class="stat-l">مستخدم</div></div>
    <div class="stat"><div class="stat-n" id="s-c">${cmds}</div><div class="stat-l">أمر</div></div>
    <div class="stat"><div class="stat-n" id="s-up">${uptimeTxt}</div><div class="stat-l">وقت التشغيل</div></div>
  </div>
</section>

<!-- FEATURES -->
<section class="sec sec-dark" id="features">
  <div class="wrap">
    <h2 class="sec-h">مميزات <span class="pur">البوت</span> 🌸</h2>
    <p class="sec-s">كل ما تحتاجه في مكان واحد</p>
    <div class="grid g4">
      <div class="card"><i class="fas fa-robot"></i><h4>ذكاء اصطناعي</h4><p>ردود ذكية وتفاعلية</p></div>
      <div class="card"><i class="fas fa-shield-alt"></i><h4>حماية المجموعات</h4><p>إدارة وتقييد الأعضاء</p></div>
      <div class="card"><i class="fas fa-bolt"></i><h4>+100 أمر</h4><p>أوامر جاهزة للاستخدام</p></div>
      <div class="card"><i class="fas fa-wifi"></i><h4>يعمل Offline</h4><p>التطبيق يعمل بدون نت</p></div>
      <div class="card"><i class="fas fa-sync-alt"></i><h4>زر تشغيل</h4><p>ابدأ البوت بنقرة واحدة</p></div>
      <div class="card"><i class="fas fa-cookie-bite"></i><h4>تغيير الكوكيز</h4><p>تحديث بيانات الدخول</p></div>
      <div class="card"><i class="fas fa-chart-line"></i><h4>إحصائيات حية</h4><p>متابعة البوت لحظة بلحظة</p></div>
      <div class="card"><i class="fas fa-mobile-alt"></i><h4>تطبيق موبايل</h4><p>ثبّته على هاتفك مجاناً</p></div>
    </div>
  </div>
</section>

<!-- COOKIES -->
<section class="sec" id="cookies">
  <div class="wrap">
    <h2 class="sec-h">تغيير <span class="pur">الكوكيز</span> 🍪</h2>
    <p class="sec-s">الصق AppState الجديدة لحساب البوت على فيسبوك</p>
    <div class="form-box">
      <h3><i class="fas fa-cookie-bite"></i> AppState / Cookies</h3>
      <p class="form-desc">الصق الكوكيز واضغط حفظ — سيُعاد تشغيل البوت تلقائياً</p>
      <textarea class="inp" id="cf" placeholder="الصق AppState / Cookies هنا..."></textarea>
      <div class="alert-row" id="ca"></div>
      <button class="btn-save" id="cb" onclick="saveCookies()">
        <i class="fas fa-save"></i> حفظ وإعادة التشغيل
      </button>
    </div>
  </div>
</section>

<!-- LOGS -->
<section class="sec sec-dark" id="logs">
  <div class="wrap">
    <h2 class="sec-h">سجل <span class="pur">مباشر</span> 📟</h2>
    <p class="sec-s">آخر رسائل البوت في الوقت الفعلي</p>
    <div id="log-box"><div class="ll" style="color:#64748b">في انتظار البيانات...</div></div>
  </div>
</section>

<!-- INSTALL -->
<section class="sec" id="install">
  <div class="wrap">
    <h2 class="sec-h">تحميل <span class="pur">التطبيق</span> 📲</h2>
    <p class="sec-s">ثبّت بوت ميكو على هاتفك — يعمل بدون إنترنت بعد التثبيت</p>
    <div class="grid g2" style="max-width:540px;margin:0 auto">
      <div class="inst-card">
        <div style="font-size:2.5rem;margin-bottom:.8rem">🤖</div>
        <h4>Android</h4>
        <p>افتح الموقع في Chrome ثم اضغط <strong>إضافة إلى الشاشة الرئيسية</strong></p>
        <button class="btn-o" id="btn-inst" onclick="doPWA()" style="width:100%;justify-content:center;margin-top:.2rem">
          <i class="fas fa-download"></i> تثبيت الآن
        </button>
      </div>
      <div class="inst-card">
        <div style="font-size:2.5rem;margin-bottom:.8rem">🍎</div>
        <h4>iPhone / iPad</h4>
        <p>افتح في Safari ← اضغط <i class="fas fa-share-from-square"></i> ← <strong>إضافة إلى الشاشة الرئيسية</strong></p>
      </div>
    </div>
  </div>
</section>

<footer>
  <p>© ${new Date().getFullYear()} <a href="/">بوت ميكو 🌸</a> — GoatBot V2 by NTKhang</p>
</footer>

<!-- TOAST -->
<div id="toast"></div>

<!-- PWA BANNER -->
<div id="pwa-banner">
  <p>🌸 ثبّت بوت ميكو كتطبيق!</p>
  <button id="pwa-install" onclick="doPWA()">تثبيت</button>
  <button id="pwa-x" onclick="this.closest('#pwa-banner').classList.remove('show')">✕</button>
</div>

<script>
(function(){
  /* PWA */
  let dp;
  window.addEventListener('beforeinstallprompt',e=>{
    e.preventDefault();dp=e;
    document.getElementById('pwa-banner').classList.add('show');
  });
  window.doPWA=function(){
    if(!dp)return;
    dp.prompt();
    dp.userChoice.then(r=>{
      if(r.outcome==='accepted') document.getElementById('pwa-banner').classList.remove('show');
      dp=null;
    });
  };
  if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{});

  /* Toast */
  let tt;
  window.toast=function(msg,t='ok'){
    const el=document.getElementById('toast');
    el.textContent=msg;el.className='show '+t;
    clearTimeout(tt);tt=setTimeout(()=>el.className='',3500);
  };

  /* Bot controls — no password needed */
  const btnR=document.getElementById('btn-run');
  const bico=document.getElementById('bico');
  const btxt=document.getElementById('btxt');

  function setLoading(on){
    if(!btnR)return;
    btnR.disabled=on;
    bico.className=on?'fas fa-spinner fa-spin':'fas fa-play';
    btxt.textContent=on?'جاري التنفيذ...':'تشغيل البوت';
  }

  function post(url){
    return fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}).then(r=>r.json());
  }

  window.runBot=function(){
    setLoading(true);
    post('/api/bot/restart')
    .then(d=>{
      toast(d.message,'ok');
      startFastPoll(30);
    }).catch(()=>{toast('خطأ في الاتصال ❌','err');setLoading(false);});
  };

  window.stopBot=function(){
    post('/api/bot/stop')
    .then(d=>toast(d.message,'warn'))
    .catch(()=>toast('خطأ في الاتصال ❌','err'));
    setTimeout(refreshStatus,1200);
  };

  /* Cookies */
  window.saveCookies=function(){
    const f=document.getElementById('cf')?.value?.trim();
    const btn=document.getElementById('cb');
    if(!f)return showAl('err','الرجاء إدخال الكوكيز أولاً');
    btn.disabled=true;
    btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
    fetch('/api/cookies',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fbstate:f})})
    .then(r=>r.json()).then(d=>{
      if(d.status==='success'){
        showAl('ok',d.message);
        document.getElementById('cf').value='';
        // Fast polling for 40 seconds to detect restart
        startFastPoll(40);
      } else {
        showAl('err',d.message||'حدث خطأ');
        btn.disabled=false;
        btn.innerHTML='<i class="fas fa-save"></i> حفظ وإعادة التشغيل';
      }
    }).catch(()=>{
      showAl('err','خطأ في الاتصال');
      btn.disabled=false;
      btn.innerHTML='<i class="fas fa-save"></i> حفظ وإعادة التشغيل';
    });
  };
  function showAl(t,m){
    const el=document.getElementById('ca');
    el.className='alert-row '+(t==='ok'?'ok-row':'err-row');
    el.textContent=m;el.style.display='block';
    setTimeout(()=>{el.style.display='none';},8000);
  }

  /* Fast polling after restart — checks every 2s for N seconds */
  let fastPollTimer=null;
  function startFastPoll(seconds){
    let elapsed=0;
    if(fastPollTimer) clearInterval(fastPollTimer);
    fastPollTimer=setInterval(()=>{
      refreshStatus();
      elapsed+=2;
      if(elapsed>=seconds){
        clearInterval(fastPollTimer);
        fastPollTimer=null;
        // Re-enable cookie save button once done
        const btn=document.getElementById('cb');
        if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-save"></i> حفظ وإعادة التشغيل';}
      }
    },2000);
  }

  /* Live status */
  const badge=document.getElementById('sbadge');
  const stxt=document.getElementById('stxt');
  const errBanner=document.getElementById('err-banner');
  const statusMap={
    running:   ['s-run', 'd-g','البوت يعمل ✓'],
    starting:  ['s-load','d-y','جاري التشغيل... ⏳'],
    restarting:['s-load','d-y','جاري الإعادة... 🔄'],
    stopped:   ['s-stop','d-r','البوت متوقف'],
    error:     ['s-stop','d-r','فشل تشغيل البوت ❌'],
  };
  function refreshStatus(){
    fetch('/uptime').then(r=>r.json()).then(d=>{
      document.getElementById('s-t').textContent=d.threads||0;
      document.getElementById('s-u').textContent=d.users||0;
      document.getElementById('s-c').textContent=d.commands||0;
      const up=d.uptime||0,h=Math.floor(up/3600),m=Math.floor((up%3600)/60);
      document.getElementById('s-up').textContent=h>0?h+'س '+m+'د':m+' د';
      const st=d.botStatus||'stopped';
      const [bc,dc,tx]=statusMap[st]||statusMap.stopped;
      badge.className='status-pill '+bc;
      badge.querySelector('.dot').className='dot '+dc;
      stxt.textContent=tx;
      // Show/hide error banner
      if(errBanner){
        if(d.errorMsg){
          errBanner.textContent='⚠️ '+d.errorMsg;
          errBanner.style.display='block';
        } else {
          errBanner.style.display='none';
        }
      }
      if(btnR&&!btnR.disabled){
        bico.className=(st==='running')?'fas fa-sync-alt':'fas fa-play';
        btxt.textContent=(st==='running')?'إعادة تشغيل':'تشغيل البوت';
      }
      updateLogs(d.logs||[]);
    }).catch(()=>{
      badge.className='status-pill s-stop';
      stxt.textContent='انقطع الاتصال ⚠️';
    });
  }
  setInterval(refreshStatus,8000);
  setTimeout(refreshStatus,2000);
  window.addEventListener('online',refreshStatus);

  /* Logs */
  const logBox=document.getElementById('log-box');
  let lastTs=0;
  function updateLogs(logs){
    if(!logBox||!logs.length)return;
    const nl=logs.filter(l=>l.time>lastTs);
    if(!nl.length)return;
    if(logBox.children.length===1&&logBox.children[0].textContent.includes('انتظار'))
      logBox.innerHTML='';
    nl.forEach(l=>{
      const d=document.createElement('div');
      const isErr=l.msg.includes('[ERR]')||l.msg.includes('خطأ')||l.msg.includes('Error');
      const isOk =l.msg.includes('✓')||l.msg.includes('نجاح')||l.msg.includes('يعمل');
      d.className='ll'+(isErr?' le':isOk?' lg':'');
      d.textContent=l.msg;logBox.appendChild(d);lastTs=l.time;
    });
    logBox.scrollTop=logBox.scrollHeight;
    while(logBox.children.length>80) logBox.removeChild(logBox.firstChild);
  }
})();
</script>
</body>
</html>`);
});

/* ── Server ── */
app.listen(PORT,"0.0.0.0",()=>{
  console.log(`\x1b[35m[ميكو 🌸]\x1b[0m الموقع يعمل على المنفذ ${PORT} ✅`);
  if(EXTERNAL_URL) console.log(`\x1b[35m[ميكو 🌸]\x1b[0m الرابط: ${EXTERNAL_URL} 🌐`);
});

/* ── Keep-alive ── */
function ping(){
  if(!EXTERNAL_URL)return;
  try{
    const u=new URL(EXTERNAL_URL+"/ping");
    const m=u.protocol==="https:"?https:http;
    const r=m.request({hostname:u.hostname,path:u.pathname,method:"GET",timeout:10000,headers:{"User-Agent":"Miko/3.0"}},()=>{});
    r.on("error",()=>{});r.on("timeout",()=>r.destroy());r.end();
  }catch(e){}
}
setTimeout(()=>{ping();setInterval(ping,2*60*1000);console.log(`\x1b[35m[ميكو 🌸]\x1b[0m Keep-alive فعّال 💓`);},45000);

module.exports=app;
