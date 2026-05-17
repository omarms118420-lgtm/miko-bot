/**
 * ميكو Dashboard Server — Full web control panel + keep-alive
 */

const http  = require("http");
const https = require("https");
const fs    = require("fs");
const path  = require("path");

const PORT       = process.env.PORT || 5000;
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || "https://miko-bot-y7o5.onrender.com";
const ROOT       = path.join(__dirname, "..");
const ACCOUNT    = path.join(ROOT, "account.txt");

// ══════════════════════════════════════════════════════════════
//  COMMANDS LOADER  (reads both command directories)
// ══════════════════════════════════════════════════════════════
function loadCommands() {
  const dirs = [
    { dir: path.join(ROOT, "scripts", "cmds"),   src: "goat"  },
    { dir: path.join(ROOT, "script", "commands"), src: "haki"  }
  ];
  const seen = new Set();
  const list = [];

  for (const { dir, src } of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".js")) continue;
      const name = file.replace(".js", "");
      if (seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      let description = "أمر متاح", category = "عام", usage = name;
      try {
        delete require.cache[require.resolve(path.join(dir, file))];
        const mod = require(path.join(dir, file));
        const cfg = mod?.config || mod?.Config || {};
        description = cfg.shortDescription || cfg.description || cfg.ShortDescription || "أمر متاح";
        category    = cfg.category  || cfg.Category  || inferCategory(name);
        usage       = cfg.usages    || cfg.usage      || name;
      } catch(_) {
        category = inferCategory(name);
      }
      list.push({ name, description, category: translateCategory(category), usage: String(usage), src });
    }
  }
  return list.sort((a,b) => a.name.localeCompare(b.name, "ar"));
}

function inferCategory(name) {
  name = name.toLowerCase();
  if (/song|ytb|aghnia|music|audio/.test(name))       return "موسيقى";
  if (/ai|flux|gemini|imagine|art|prompt/.test(name)) return "ذكاء اصطناعي";
  if (/admin|ban|kick|warn|restrict/.test(name))      return "إدارة";
  if (/balance|daily|rank|bank|economy|money/.test(name)) return "اقتصاد";
  if (/img|image|hd|avatar|photo|pic/.test(name))     return "صور";
  if (/hug|kiss|slap|pair|love/.test(name))           return "اجتماعي";
  if (/download|tiktok|album/.test(name))             return "تنزيل";
  if (/dungeon|game|guess|farm|pubg|freefire/.test(name)) return "ألعاب";
  if (/info|uid|tid|uptime|weather|stat/.test(name))  return "معلومات";
  if (/set|prefix|welcome|leave|config/.test(name))   return "إعدادات";
  return "عام";
}

function translateCategory(cat) {
  const map = {
    "Admin":"إدارة","admin":"إدارة","info":"معلومات","Info":"معلومات",
    "Game":"ألعاب","game":"ألعاب","Fun":"ترفيه","fun":"ترفيه",
    "Music":"موسيقى","music":"موسيقى","Economy":"اقتصاد","economy":"اقتصاد",
    "Image":"صور","image":"صور","Social":"اجتماعي","social":"اجتماعي",
    "Download":"تنزيل","download":"تنزيل","Settings":"إعدادات","settings":"إعدادات",
    "AI":"ذكاء اصطناعي","Ai":"ذكاء اصطناعي"
  };
  return map[cat] || cat || "عام";
}

// ══════════════════════════════════════════════════════════════
//  DASHBOARD HTML  (self-contained, RTL Arabic, dark theme)
// ══════════════════════════════════════════════════════════════
function buildHTML() {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>لوحة تحكم ميكو 🌸</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0d0d1a;color:#e0e0ff;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;min-height:100vh}
:root{--p:#a855f7;--p2:#7c3aed;--g:#10b981;--r:#ef4444;--y:#f59e0b;--b:#3b82f6;--c1:#1a1a2e;--c2:#16213e;--c3:#0f3460}
header{background:linear-gradient(135deg,#1a0533,#0d0d2e);padding:18px 30px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #2a2a4a;position:sticky;top:0;z-index:99}
header h1{font-size:1.6rem;font-weight:700;background:linear-gradient(90deg,#c084fc,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.badge{padding:5px 14px;border-radius:20px;font-size:.8rem;font-weight:600}
.badge.ok{background:#065f46;color:#6ee7b7}
.badge.err{background:#7f1d1d;color:#fca5a5}
.badge.wait{background:#78350f;color:#fcd34d}
.container{max-width:1300px;margin:0 auto;padding:24px 20px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
@media(max-width:900px){.grid2,.grid3{grid-template-columns:1fr}}
.card{background:var(--c1);border:1px solid #2a2a4a;border-radius:14px;padding:22px}
.card-title{font-size:1rem;font-weight:600;color:#c084fc;margin-bottom:16px;display:flex;align-items:center;gap:8px}
.stat{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #1e1e3a}
.stat:last-child{border:none}
.stat-label{color:#94a3b8;font-size:.9rem}
.stat-val{font-weight:600;font-size:.95rem}
.s-green{color:#34d399}.s-red{color:#f87171}.s-yellow{color:#fbbf24}.s-blue{color:#60a5fa}.s-purple{color:#c084fc}
textarea{width:100%;background:#111130;border:1px solid #3a3a5c;border-radius:10px;color:#e0e0ff;padding:14px;font-size:.88rem;resize:vertical;outline:none;transition:.2s;font-family:monospace;direction:ltr;line-height:1.5}
textarea:focus{border-color:var(--p)}
textarea::placeholder{color:#4a4a6a}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 22px;border:none;border-radius:10px;font-size:.92rem;font-weight:600;cursor:pointer;transition:all .2s;width:100%}
.btn:active{transform:scale(.97)}
.btn-p{background:var(--p2);color:#fff}.btn-p:hover{background:#6d28d9}
.btn-g{background:#059669;color:#fff}.btn-g:hover{background:#047857}
.btn-r{background:#dc2626;color:#fff}.btn-r:hover{background:#b91c1c}
.btn-y{background:#d97706;color:#fff}.btn-y:hover{background:#b45309}
.btn-b{background:#2563eb;color:#fff}.btn-b:hover{background:#1d4ed8}
.btn-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}
.msg{padding:10px 14px;border-radius:8px;font-size:.88rem;margin-top:10px;display:none}
.msg.ok{background:#064e3b;color:#6ee7b7}
.msg.err{background:#7f1d1d;color:#fca5a5}
.search-box{width:100%;background:#111130;border:1px solid #3a3a5c;border-radius:10px;color:#e0e0ff;padding:10px 16px;font-size:.92rem;outline:none;margin-bottom:16px;transition:.2s}
.search-box:focus{border-color:var(--p)}
.cats{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}
.cat-btn{padding:5px 14px;border-radius:20px;border:1px solid #3a3a5c;background:transparent;color:#94a3b8;font-size:.82rem;cursor:pointer;transition:.2s}
.cat-btn:hover,.cat-btn.active{background:var(--p2);color:#fff;border-color:var(--p2)}
.cmd-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px;max-height:480px;overflow-y:auto;padding-left:4px}
.cmd-grid::-webkit-scrollbar{width:5px}
.cmd-grid::-webkit-scrollbar-thumb{background:#3a3a5c;border-radius:5px}
.cmd-card{background:#111130;border:1px solid #2a2a4a;border-radius:10px;padding:14px;cursor:pointer;transition:all .2s;position:relative}
.cmd-card:hover{border-color:var(--p);transform:translateY(-2px)}
.cmd-name{font-size:.95rem;font-weight:700;color:#c084fc;margin-bottom:5px}
.cmd-desc{font-size:.8rem;color:#94a3b8;line-height:1.4}
.cmd-cat{position:absolute;top:8px;left:8px;font-size:.7rem;padding:2px 8px;border-radius:10px;background:#1e1e3a;color:#818cf8}
.cmd-use{font-size:.75rem;color:#4a4a7a;margin-top:6px;direction:ltr}
.logs-box{background:#080818;border:1px solid #1e1e3a;border-radius:10px;padding:14px;height:220px;overflow-y:auto;font-size:.8rem;font-family:monospace;line-height:1.7;direction:ltr}
.logs-box::-webkit-scrollbar{width:5px}
.logs-box::-webkit-scrollbar-thumb{background:#2a2a4a;border-radius:5px}
.log-err{color:#f87171}.log-ok{color:#34d399}.log-info{color:#60a5fa}.log-warn{color:#fbbf24}
.count-badge{background:#1e1e3a;color:#818cf8;border-radius:20px;padding:3px 12px;font-size:.8rem;margin-right:auto}
.sep{height:1px;background:#1e1e3a;margin:20px 0}
.pulse{width:10px;height:10px;border-radius:50%;display:inline-block;animation:pulse 1.5s infinite}
.pulse.g{background:#34d399;box-shadow:0 0 0 0 #34d39940}
.pulse.r{background:#f87171;animation:none}
.pulse.y{background:#fbbf24}
@keyframes pulse{0%{box-shadow:0 0 0 0 #34d39940}70%{box-shadow:0 0 0 8px transparent}100%{box-shadow:0 0 0 0 transparent}}
</style>
</head>
<body>
<header>
  <h1>🌸 لوحة تحكم ميكو</h1>
  <div style="display:flex;gap:12px;align-items:center">
    <span class="badge wait" id="hdr-badge">جاري التحميل...</span>
    <span id="hdr-mem" style="font-size:.82rem;color:#818cf8"></span>
  </div>
</header>

<div class="container">

  <!-- ROW 1: Status + Cookies + Controls -->
  <div class="grid2" style="margin-bottom:20px">

    <!-- Status Card -->
    <div class="card">
      <div class="card-title">📊 حالة البوت الآن</div>
      <div class="stat"><span class="stat-label">الحالة</span><span class="stat-val" id="st-status">—</span></div>
      <div class="stat"><span class="stat-label">وقت التشغيل</span><span class="stat-val s-blue" id="st-uptime">—</span></div>
      <div class="stat"><span class="stat-label">الذاكرة</span><span class="stat-val s-yellow" id="st-mem">—</span></div>
      <div class="stat"><span class="stat-label">عدد الأعطال</span><span class="stat-val s-red" id="st-crash">—</span></div>
      <div class="stat"><span class="stat-label">معرف العملية</span><span class="stat-val s-purple" id="st-pid">—</span></div>
      <div class="stat"><span class="stat-label">آخر خطأ</span><span class="stat-val s-red" id="st-err" style="font-size:.8rem;max-width:55%;text-align:left;direction:ltr">—</span></div>
      <div style="margin-top:14px;font-size:.82rem;color:#4a4a7a;text-align:center" id="st-refresh">يتحدث تلقائياً كل 3 ثوانٍ</div>
    </div>

    <!-- Cookie Card -->
    <div class="card">
      <div class="card-title">🍪 إدارة الكوكيز</div>
      <p style="font-size:.83rem;color:#64748b;margin-bottom:10px">أدخل كوكيز حساب فيسبوك بصيغة Netscape أو JSON. سيتم حفظها فوراً وإعادة تشغيل البوت.</p>
      <textarea id="cookie-txt" rows="7" placeholder="الصق هنا كوكيز فيسبوك..."></textarea>
      <div class="msg" id="cookie-msg"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">
        <button class="btn btn-p" onclick="saveCookies()">💾 حفظ وتطبيق</button>
        <button class="btn btn-b" onclick="loadCookies()">📂 عرض الحالي</button>
      </div>
    </div>
  </div>

  <!-- Controls -->
  <div class="card" style="margin-bottom:20px">
    <div class="card-title">⚙️ التحكم في البوت</div>
    <div class="btn-row">
      <button class="btn btn-g" onclick="botAction('start')">▶️ تشغيل</button>
      <button class="btn btn-r" onclick="botAction('stop')">⏹️ إيقاف</button>
      <button class="btn btn-y" onclick="botAction('restart')">🔄 إعادة تشغيل</button>
    </div>
    <div class="msg" id="ctrl-msg"></div>
  </div>

  <!-- Commands -->
  <div class="card" style="margin-bottom:20px">
    <div class="card-title">
      📋 قائمة الأوامر
      <span class="count-badge" id="cmd-count">0 أمر</span>
    </div>
    <input class="search-box" type="text" id="cmd-search" placeholder="🔍 ابحث عن أمر..." oninput="filterCmds()">
    <div class="cats" id="cat-btns"></div>
    <div class="cmd-grid" id="cmd-grid">
      <div style="color:#4a4a7a;text-align:center;padding:30px;grid-column:1/-1">جاري تحميل الأوامر...</div>
    </div>
  </div>

  <!-- Logs -->
  <div class="card">
    <div class="card-title">📜 سجل الأحداث <span style="font-size:.75rem;color:#4a4a7a;margin-right:8px">(آخر 20 حدث)</span></div>
    <div class="logs-box" id="logs-box">جاري التحميل...</div>
  </div>

</div><!-- /container -->

<script>
let _all = [], _cat = "الكل", _timer;

async function apiGet(path){
  const r=await fetch(path);return r.ok?r.json():null;
}
async function apiPost(path,body){
  const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  return r.ok?r.json():null;
}

// ── Status polling ────────────────────────────────────────────────────────────
async function refreshStatus(){
  const d=await apiGet('/api/status');
  if(!d) return;
  const statusMap={running:'🟢 يعمل',starting:'🟡 يبدأ',stopped:'🔴 متوقف',error:'❌ خطأ',unknown:'⚪ غير معروف'};
  const colMap={running:'s-green',starting:'s-yellow',stopped:'s-red',error:'s-red',unknown:''};
  document.getElementById('st-status').textContent=statusMap[d.bot]||d.bot;
  document.getElementById('st-status').className='stat-val '+(colMap[d.bot]||'');
  document.getElementById('st-uptime').textContent=fmtTime(d.uptime);
  document.getElementById('st-mem').textContent=d.memory;
  document.getElementById('st-crash').textContent=d.crashes;
  document.getElementById('st-pid').textContent=d.pid||'—';
  document.getElementById('st-err').textContent=d.errorMsg||'—';
  document.getElementById('hdr-mem').textContent=d.memory;

  const hb=document.getElementById('hdr-badge');
  if(d.bot==='running'){hb.textContent='يعمل ✅';hb.className='badge ok';}
  else if(d.bot==='error'){hb.textContent='خطأ ❌';hb.className='badge err';}
  else if(d.bot==='starting'){hb.textContent='يبدأ...';hb.className='badge wait';}
  else{hb.textContent='متوقف ⏹️';hb.className='badge err';}

  const logs=d.logs||[];
  const box=document.getElementById('logs-box');
  if(logs.length){
    box.innerHTML=logs.slice().reverse().map(l=>{
      const t=l.m||'';
      let cls='log-info';
      if(/ERR|Error|خطأ|FATAL/i.test(t))cls='log-err';
      else if(/✅|Connected|يعمل|مستقر|DONE/i.test(t))cls='log-ok';
      else if(/⚠️|warn|Warn|توقف|إعادة/i.test(t))cls='log-warn';
      return '<div class="'+cls+'">'+esc(t)+'</div>';
    }).join('');
  }
}

function fmtTime(s){
  if(!s||isNaN(s))return '—';
  const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;
  return h>0?h+'س '+m+'د':m>0?m+'د '+sec+'ث':sec+'ث';
}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

// ── Commands ──────────────────────────────────────────────────────────────────
async function loadCmdsData(){
  const d=await apiGet('/api/commands');
  if(!d||!d.commands) return;
  _all=d.commands;
  buildCatBtns();
  renderCmds();
}

function buildCatBtns(){
  const cats=['الكل',...new Set(_all.map(c=>c.category))].sort((a,b)=>a==='الكل'?-1:1);
  const el=document.getElementById('cat-btns');
  el.innerHTML=cats.map(c=>`<button class="cat-btn${c===_cat?' active':''}" onclick="setCat('${c}')">${c}</button>`).join('');
}

function setCat(c){
  _cat=c;
  document.querySelectorAll('.cat-btn').forEach(b=>{b.classList.toggle('active',b.textContent===c);});
  renderCmds();
}

function filterCmds(){renderCmds();}

function renderCmds(){
  const q=(document.getElementById('cmd-search').value||'').toLowerCase().trim();
  let list=_all;
  if(_cat!=='الكل') list=list.filter(c=>c.category===_cat);
  if(q) list=list.filter(c=>c.name.toLowerCase().includes(q)||c.description.toLowerCase().includes(q));
  document.getElementById('cmd-count').textContent=list.length+' أمر';
  const grid=document.getElementById('cmd-grid');
  if(!list.length){grid.innerHTML='<div style="color:#4a4a7a;text-align:center;padding:30px;grid-column:1/-1">لا توجد نتائج</div>';return;}
  grid.innerHTML=list.map(c=>`
    <div class="cmd-card" onclick="copyCmd('${esc(c.name)}')">
      <span class="cmd-cat">${esc(c.category)}</span>
      <div class="cmd-name">${esc(c.name)}</div>
      <div class="cmd-desc">${esc(c.description)}</div>
      <div class="cmd-use">${esc(c.usage)}</div>
    </div>`).join('');
}

function copyCmd(name){
  navigator.clipboard.writeText(name).catch(()=>{});
  showMsg('ctrl-msg','تم نسخ الأمر: '+name,'ok',1500);
}

// ── Cookie management ─────────────────────────────────────────────────────────
async function saveCookies(){
  const txt=document.getElementById('cookie-txt').value.trim();
  if(!txt){showMsg('cookie-msg','الرجاء إدخال الكوكيز','err');return;}
  const d=await apiPost('/api/cookies',{cookies:txt});
  if(d&&d.ok) showMsg('cookie-msg','✅ تم حفظ الكوكيز وإعادة تشغيل البوت','ok');
  else showMsg('cookie-msg','❌ فشل الحفظ: '+(d&&d.err||'خطأ'),'err');
}

async function loadCookies(){
  const d=await apiGet('/api/cookies');
  if(d&&d.cookies) document.getElementById('cookie-txt').value=d.cookies;
  else showMsg('cookie-msg','❌ تعذر تحميل الكوكيز','err');
}

// ── Bot controls ──────────────────────────────────────────────────────────────
async function botAction(action){
  const labels={start:'تشغيل',stop:'إيقاف',restart:'إعادة تشغيل'};
  const d=await apiPost('/api/'+action,{});
  if(d&&d.ok) showMsg('ctrl-msg','✅ تم '+labels[action],'ok');
  else showMsg('ctrl-msg','❌ فشل: '+(d&&d.err||'خطأ'),'err');
}

function showMsg(id,text,type,ms){
  const el=document.getElementById(id);
  el.textContent=text;el.className='msg '+(type||'ok');el.style.display='block';
  if(ms) setTimeout(()=>{el.style.display='none';},ms);
}

// ── Init ───────────────────────────────────────────────────────────────────
(async function init(){
  await Promise.all([refreshStatus(), loadCmdsData()]);
  clearInterval(_timer);
  _timer=setInterval(refreshStatus, 3000);
})();
</script>
</body>
</html>`;
}

// ══════════════════════════════════════════════════════════════
//  HTTP SERVER + API ROUTER
// ══════════════════════════════════════════════════════════════
function readBody(req) {
  return new Promise(resolve => {
    let buf = "";
    req.on("data", c => buf += c.toString());
    req.on("end", () => { try { resolve(JSON.parse(buf)); } catch(_) { resolve({}); } });
  });
}

const server = http.createServer(async (req, res) => {
  const url    = req.url || "/";
  const method = req.method || "GET";

  function json(obj, code) {
    res.writeHead(code || 200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
    res.end(JSON.stringify(obj));
  }

  // Dashboard HTML
  if (method === "GET" && (url === "/" || url === "/dashboard")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(buildHTML());
  }

  // GET /api/status
  if (method === "GET" && url === "/api/status") {
    const state = global.botState || {};
    return json({
      status: "ok",
      bot:    state.status   || "unknown",
      pid:    state.pid      || null,
      uptime: Math.floor(process.uptime()),
      memory: Math.round(process.memoryUsage().rss / 1024 / 1024) + "MB",
      crashes: state.crashCount || 0,
      errorMsg: state.errorMsg  || "",
      logs: (state.logs || []).slice(-20),
      ts: Date.now()
    });
  }

  // GET /api/commands
  if (method === "GET" && url === "/api/commands") {
    try {
      return json({ commands: loadCommands() });
    } catch(e) {
      return json({ commands: [], error: e.message });
    }
  }

  // GET /api/cookies
  if (method === "GET" && url === "/api/cookies") {
    try {
      const c = fs.existsSync(ACCOUNT) ? fs.readFileSync(ACCOUNT, "utf-8") : "";
      return json({ ok: true, cookies: c });
    } catch(e) { return json({ ok: false, err: e.message }); }
  }

  // POST /api/cookies
  if (method === "POST" && url === "/api/cookies") {
    const body = await readBody(req);
    if (!body.cookies || !body.cookies.trim()) return json({ ok: false, err: "الكوكيز فارغة" }, 400);
    try {
      fs.writeFileSync(ACCOUNT, body.cookies.trim(), "utf-8");
      setTimeout(() => { if (typeof global.restartBot === "function") global.restartBot(); }, 800);
      return json({ ok: true });
    } catch(e) { return json({ ok: false, err: e.message }); }
  }

  // POST /api/start
  if (method === "POST" && url === "/api/start") {
    if (typeof global.restartBot === "function") {
      global.restartBot();
      return json({ ok: true });
    }
    return json({ ok: false, err: "restartBot غير متاح" });
  }

  // POST /api/stop
  if (method === "POST" && url === "/api/stop") {
    if (global.botState) global.botState.status = "stopped";
    if (global._botChild) { try { global._botChild.kill("SIGTERM"); } catch(_) {} }
    return json({ ok: true });
  }

  // POST /api/restart
  if (method === "POST" && url === "/api/restart") {
    setTimeout(() => { if (typeof global.restartBot === "function") global.restartBot(); }, 400);
    return json({ ok: true });
  }

  // 404
  res.writeHead(404); res.end("Not found");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\x1b[35m[ميكو 🌸]\x1b[0m لوحة التحكم تعمل: http://0.0.0.0:${PORT}`);
  console.log(`\x1b[35m[ميكو 🌸]\x1b[0m الرابط العام: ${RENDER_URL}`);
});

// ══════════════════════════════════════════════════════════════
//  KEEP-ALIVE  (triple layer)
// ══════════════════════════════════════════════════════════════
let _pingOk = 0, _pingFail = 0;

function doPing() {
  if (!RENDER_URL) return;
  try {
    const u   = new URL(RENDER_URL + "/api/status");
    const mod = u.protocol === "https:" ? https : http;
    const r   = mod.request({ hostname: u.hostname, port: u.port || 443, path: u.pathname,
      method: "GET", timeout: 12000, headers: { "User-Agent": "Miko-KeepAlive/5" }
    }, () => { _pingOk++; _pingFail = 0; });
    r.on("error", () => _pingFail++);
    r.on("timeout", () => { _pingFail++; r.destroy(); });
    r.end();
  } catch(_) {}
}

setTimeout(() => { doPing(); setInterval(doPing, 8  * 60 * 1000); }, 90000);
setTimeout(() => { doPing(); setInterval(doPing, 11 * 60 * 1000); }, 4 * 60 * 1000);
setTimeout(() => { doPing(); setInterval(doPing, 13 * 60 * 1000); }, 7 * 60 * 1000);
console.log(`\x1b[35m[ميكو 💓]\x1b[0m Keep-alive ثلاثي الطبقات مُفعَّل (8/11/13 دقيقة)`);

// ══════════════════════════════════════════════════════════════
//  WATCHDOG  (auto-restart if stuck)
// ══════════════════════════════════════════════════════════════
setInterval(() => {
  const state = global.botState;
  if (!state || typeof global.restartBot !== "function") return;
  const now = Date.now();
  if (state.status === "error"   && state.errorAt   && now - state.errorAt   > 8 * 60 * 1000) {
    console.log(`\x1b[35m[ميكو 🤖]\x1b[0m Watchdog → خطأ مستمر — إعادة تشغيل تلقائية`);
    state.errorAt = now;
    global.restartBot();
  }
  const memMB = Math.round(process.memoryUsage().rss / 1024 / 1024);
  console.log(`\x1b[35m[ميكو 💓]\x1b[0m بوت:${state.status} | ذاكرة:${memMB}MB | نبضات:${_pingOk} | أعطال:${state.crashCount || 0}`);
}, 3 * 60 * 1000);

module.exports = server;
