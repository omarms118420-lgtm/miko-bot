/**
 * ميكو Dashboard Server — Full web control panel + keep-alive + FB login
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
//  COMMANDS LOADER
// ══════════════════════════════════════════════════════════════
function loadCommands() {
  const dirs = [
    { dir: path.join(ROOT, "scripts", "cmds"),   src: "goat" },
    { dir: path.join(ROOT, "script", "commands"), src: "haki" }
  ];
  const seen = new Set();
  const list = [];
  for (const { dir } of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".js")) continue;
      const name = file.replace(".js", "");
      if (seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      let description = "أمر متاح", category = inferCategory(name), usage = name;
      try {
        delete require.cache[require.resolve(path.join(dir, file))];
        const cfg = require(path.join(dir, file))?.config || {};
        description = cfg.shortDescription || cfg.description || cfg.ShortDescription || "أمر متاح";
        category    = translateCat(cfg.category || cfg.Category || inferCategory(name));
        usage       = String(cfg.usages || cfg.usage || name);
      } catch(_) {}
      list.push({ name, description, category, usage });
    }
  }
  return list.sort((a,b) => a.name.localeCompare(b.name, "ar"));
}

function inferCategory(n) {
  n = n.toLowerCase();
  if (/song|ytb|aghnia|music/.test(n))              return "موسيقى";
  if (/ai|flux|gemini|imagine|art|prompt/.test(n))  return "ذكاء اصطناعي";
  if (/admin|ban|kick|warn|restrict/.test(n))       return "إدارة";
  if (/balance|daily|rank|bank|economy/.test(n))    return "اقتصاد";
  if (/img|image|hd|avatar|photo|pic/.test(n))      return "صور";
  if (/hug|kiss|slap|pair|love/.test(n))            return "اجتماعي";
  if (/download|tiktok|album/.test(n))              return "تنزيل";
  if (/dungeon|game|guess|farm|pubg|freefire/.test(n)) return "ألعاب";
  if (/info|uid|tid|uptime|weather/.test(n))        return "معلومات";
  if (/set|prefix|welcome|leave|config/.test(n))    return "إعدادات";
  return "عام";
}
function translateCat(c) {
  return ({"Admin":"إدارة","admin":"إدارة","info":"معلومات","Info":"معلومات","Game":"ألعاب",
    "game":"ألعاب","Fun":"ترفيه","fun":"ترفيه","Music":"موسيقى","music":"موسيقى",
    "Economy":"اقتصاد","economy":"اقتصاد","Image":"صور","image":"صور","Social":"اجتماعي",
    "social":"اجتماعي","Download":"تنزيل","download":"تنزيل","Settings":"إعدادات",
    "settings":"إعدادات","AI":"ذكاء اصطناعي","Ai":"ذكاء اصطناعي"})[c] || c || "عام";
}

// ══════════════════════════════════════════════════════════════
//  FACEBOOK LOGIN  (uses local fb-chat-api)
// ══════════════════════════════════════════════════════════════
let _loginInProgress = false;
let _loginStatus     = { done: false, ok: false, msg: "" };

function doFbLogin(email, password, callback) {
  if (_loginInProgress) return callback(null, "تسجيل دخول آخر قيد التنفيذ...");
  _loginInProgress = true;
  _loginStatus = { done: false, ok: false, msg: "جاري تسجيل الدخول..." };
  try {
    const loginFn = require(path.join(ROOT, "fb-chat-api"));
    loginFn({ email, password, forceLogin: true }, { logLevel: "silent" }, (err, api) => {
      _loginInProgress = false;
      if (err) {
        const msg = err.error || String(err.message || err).slice(0, 200);
        _loginStatus = { done: true, ok: false, msg };
        return callback(msg, null);
      }
      try {
        const appstate    = api.getAppState();
        const appstateStr = JSON.stringify(appstate);
        fs.writeFileSync(ACCOUNT, appstateStr, "utf-8");
        _loginStatus = { done: true, ok: true, msg: "✅ تم تسجيل الدخول وحفظ الكوكيز بنجاح!" };
        // restart bot with new cookies
        setTimeout(() => { if (typeof global.restartBot === "function") global.restartBot(); }, 1000);
        callback(null, appstateStr.length + " بايت محفوظ");
      } catch(e2) {
        _loginStatus = { done: true, ok: false, msg: e2.message };
        callback(e2.message, null);
      }
    });
  } catch(e) {
    _loginInProgress = false;
    _loginStatus = { done: true, ok: false, msg: e.message };
    callback(e.message, null);
  }
}

// ══════════════════════════════════════════════════════════════
//  DASHBOARD HTML
// ══════════════════════════════════════════════════════════════
function buildHTML() { return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>لوحة تحكم ميكو 🌸</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0d0d1a;color:#e0e0ff;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;min-height:100vh}
:root{--p:#a855f7;--p2:#7c3aed;--g:#10b981;--r:#ef4444;--y:#f59e0b;--c1:#1a1a2e;--c2:#16213e}
header{background:linear-gradient(135deg,#1a0533,#0d0d2e);padding:16px 28px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #2a2a4a;position:sticky;top:0;z-index:99}
header h1{font-size:1.5rem;font-weight:700;background:linear-gradient(90deg,#c084fc,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.badge{padding:5px 14px;border-radius:20px;font-size:.8rem;font-weight:600}
.badge.ok{background:#065f46;color:#6ee7b7}.badge.err{background:#7f1d1d;color:#fca5a5}.badge.wait{background:#78350f;color:#fcd34d}
.container{max-width:1280px;margin:0 auto;padding:22px 18px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
@media(max-width:860px){.g2,.g3{grid-template-columns:1fr}}
.card{background:var(--c1);border:1px solid #2a2a4a;border-radius:14px;padding:20px;margin-bottom:18px}
.card-title{font-size:.98rem;font-weight:700;color:#c084fc;margin-bottom:15px;display:flex;align-items:center;gap:8px}
.stat{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #1e1e3a}
.stat:last-child{border:none}
.stat-label{color:#94a3b8;font-size:.88rem}.stat-val{font-weight:600;font-size:.9rem}
.sg{color:#34d399}.sr{color:#f87171}.sy{color:#fbbf24}.sb{color:#60a5fa}.sp{color:#c084fc}
input,textarea{width:100%;background:#111130;border:1px solid #3a3a5c;border-radius:10px;color:#e0e0ff;padding:11px 14px;font-size:.88rem;outline:none;transition:.2s}
input:focus,textarea:focus{border-color:var(--p)}
input[type=password]{direction:ltr;letter-spacing:2px}
textarea{resize:vertical;font-family:monospace;direction:ltr;line-height:1.5}
::placeholder{color:#4a4a6a}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:10px 20px;border:none;border-radius:10px;font-size:.9rem;font-weight:600;cursor:pointer;transition:all .2s;width:100%}
.btn:active{transform:scale(.97)}
.bp{background:var(--p2);color:#fff}.bp:hover{background:#6d28d9}
.bg{background:#059669;color:#fff}.bg:hover{background:#047857}
.br{background:#dc2626;color:#fff}.br:hover{background:#b91c1c}
.by{background:#d97706;color:#fff}.by:hover{background:#b45309}
.bb{background:#2563eb;color:#fff}.bb:hover{background:#1d4ed8}
.btn-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}
.msg{padding:10px 14px;border-radius:8px;font-size:.86rem;margin-top:10px;display:none}
.msg.ok{background:#064e3b;color:#6ee7b7}.msg.err{background:#7f1d1d;color:#fca5a5}.msg.info{background:#1e3a5f;color:#93c5fd}
label{display:block;font-size:.82rem;color:#94a3b8;margin-bottom:6px;margin-top:12px}
label:first-child{margin-top:0}
.search-box{background:#111130;border:1px solid #3a3a5c;border-radius:10px;color:#e0e0ff;padding:10px 16px;font-size:.9rem;outline:none;margin-bottom:14px;width:100%;transition:.2s}
.search-box:focus{border-color:var(--p)}
.cats{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.cat-btn{padding:4px 13px;border-radius:20px;border:1px solid #3a3a5c;background:transparent;color:#94a3b8;font-size:.8rem;cursor:pointer;transition:.2s}
.cat-btn:hover,.cat-btn.active{background:var(--p2);color:#fff;border-color:var(--p2)}
.cmd-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:11px;max-height:460px;overflow-y:auto;padding-left:4px}
.cmd-grid::-webkit-scrollbar{width:4px}
.cmd-grid::-webkit-scrollbar-thumb{background:#3a3a5c;border-radius:4px}
.cmd-card{background:#111130;border:1px solid #2a2a4a;border-radius:10px;padding:13px;cursor:pointer;transition:all .2s;position:relative}
.cmd-card:hover{border-color:var(--p);transform:translateY(-2px)}
.cmd-name{font-size:.93rem;font-weight:700;color:#c084fc;margin-bottom:4px;margin-top:2px}
.cmd-desc{font-size:.78rem;color:#94a3b8;line-height:1.4}
.cmd-cat{font-size:.68rem;padding:2px 7px;border-radius:10px;background:#1e1e3a;color:#818cf8;display:inline-block;margin-bottom:5px}
.cmd-use{font-size:.73rem;color:#4a4a7a;margin-top:5px;direction:ltr}
.logs-box{background:#080818;border:1px solid #1e1e3a;border-radius:10px;padding:13px;height:200px;overflow-y:auto;font-size:.78rem;font-family:monospace;line-height:1.7;direction:ltr}
.logs-box::-webkit-scrollbar{width:4px}
.logs-box::-webkit-scrollbar-thumb{background:#2a2a4a;border-radius:4px}
.le{color:#f87171}.lo{color:#34d399}.li{color:#60a5fa}.lw{color:#fbbf24}
.cnt{background:#1e1e3a;color:#818cf8;border-radius:20px;padding:3px 11px;font-size:.78rem;margin-right:auto}
.login-status{padding:12px 16px;border-radius:10px;font-size:.88rem;margin-top:12px;display:none;text-align:center}
.login-status.ok{background:#064e3b;color:#6ee7b7;display:block}
.login-status.err{background:#7f1d1d;color:#fca5a5;display:block}
.login-status.info{background:#1e3a5f;color:#93c5fd;display:block}
.spinner{display:inline-block;width:14px;height:14px;border:2px solid #ffffff40;border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;margin-left:6px}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<header>
  <h1>🌸 لوحة تحكم ميكو</h1>
  <div style="display:flex;gap:12px;align-items:center">
    <span class="badge wait" id="hdr-badge">جاري التحميل...</span>
    <span id="hdr-mem" style="font-size:.8rem;color:#818cf8"></span>
  </div>
</header>

<div class="container">

  <!-- ROW 1: Status + Login -->
  <div class="g2">
    <!-- Status -->
    <div class="card">
      <div class="card-title">📊 حالة البوت</div>
      <div class="stat"><span class="stat-label">الحالة</span><span class="stat-val" id="st-status">—</span></div>
      <div class="stat"><span class="stat-label">وقت التشغيل</span><span class="stat-val sb" id="st-uptime">—</span></div>
      <div class="stat"><span class="stat-label">الذاكرة</span><span class="stat-val sy" id="st-mem">—</span></div>
      <div class="stat"><span class="stat-label">عدد الأعطال</span><span class="stat-val sr" id="st-crash">—</span></div>
      <div class="stat"><span class="stat-label">معرف العملية</span><span class="stat-val sp" id="st-pid">—</span></div>
      <div class="stat"><span class="stat-label">آخر خطأ</span><span class="stat-val sr" id="st-err" style="font-size:.78rem;max-width:55%;text-align:left;direction:ltr">—</span></div>
    </div>

    <!-- Facebook Login -->
    <div class="card">
      <div class="card-title">🔐 تسجيل دخول فيسبوك</div>
      <p style="font-size:.82rem;color:#64748b;margin-bottom:14px">أدخل بيانات حساب البوت — سيتم تسجيل الدخول من سيرفر Render مباشرةً واستخراج الكوكيز تلقائياً.</p>
      <label>رقم الهاتف أو البريد الإلكتروني</label>
      <input type="text" id="fb-email" placeholder="0118420644 أو email@example.com" dir="ltr">
      <label>كلمة السر</label>
      <input type="password" id="fb-pass" placeholder="••••••••">
      <button class="btn bp" style="margin-top:14px" id="login-btn" onclick="doLogin()">🔐 تسجيل الدخول وربط البوت</button>
      <div class="login-status" id="login-status"></div>
    </div>
  </div>

  <!-- Bot Controls -->
  <div class="card">
    <div class="card-title">⚙️ التحكم في البوت</div>
    <div class="btn-row">
      <button class="btn bg" onclick="botAction('start')">▶️ تشغيل</button>
      <button class="btn br" onclick="botAction('stop')">⏹️ إيقاف</button>
      <button class="btn by" onclick="botAction('restart')">🔄 إعادة تشغيل</button>
    </div>
    <div class="msg" id="ctrl-msg"></div>
  </div>

  <!-- Cookies (manual) -->
  <div class="card">
    <div class="card-title">🍪 إدارة الكوكيز يدوياً</div>
    <p style="font-size:.82rem;color:#64748b;margin-bottom:10px">بديل: الصق كوكيز JSON أو Netscape مباشرة</p>
    <textarea id="cookie-txt" rows="5" placeholder="الصق هنا كوكيز فيسبوك..."></textarea>
    <div class="msg" id="cookie-msg"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:11px">
      <button class="btn bp" onclick="saveCookies()">💾 حفظ وتطبيق</button>
      <button class="btn bb" onclick="loadCookies()">📂 عرض الحالي</button>
    </div>
  </div>

  <!-- Commands -->
  <div class="card">
    <div class="card-title">📋 قائمة الأوامر <span class="cnt" id="cmd-count">0</span></div>
    <input class="search-box" type="text" id="cmd-search" placeholder="🔍 ابحث عن أمر..." oninput="filterCmds()">
    <div class="cats" id="cat-btns"></div>
    <div class="cmd-grid" id="cmd-grid"><div style="color:#4a4a7a;text-align:center;padding:30px;grid-column:1/-1">جاري التحميل...</div></div>
  </div>

  <!-- Logs -->
  <div class="card">
    <div class="card-title">📜 سجل الأحداث <span style="font-size:.73rem;color:#4a4a7a;margin-right:8px">(آخر 20 حدث)</span></div>
    <div class="logs-box" id="logs-box">جاري التحميل...</div>
  </div>

</div>

<script>
let _all=[], _cat='الكل', _timer;
const api = p => fetch(p).then(r=>r.ok?r.json():null);
const post = (p,b) => fetch(p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}).then(r=>r.ok?r.json():null);

async function refreshStatus(){
  const d=await api('/api/status'); if(!d) return;
  const sm={running:'🟢 يعمل',starting:'🟡 يبدأ',stopped:'🔴 متوقف',error:'❌ خطأ',unknown:'⚪ غير معروف'};
  const sc={running:'sg',starting:'sy',stopped:'sr',error:'sr'};
  document.getElementById('st-status').textContent=sm[d.bot]||d.bot;
  document.getElementById('st-status').className='stat-val '+(sc[d.bot]||'');
  document.getElementById('st-uptime').textContent=fmt(d.uptime);
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
  const box=document.getElementById('logs-box');
  const logs=d.logs||[];
  if(logs.length){
    box.innerHTML=logs.slice().reverse().map(l=>{
      const t=l.m||'';
      let c='li';
      if(/ERR|Error|خطأ|FATAL/i.test(t))c='le';
      else if(/✅|Connected|يعمل|مستقر|DONE/i.test(t))c='lo';
      else if(/⚠️|warn|توقف|إعادة/i.test(t))c='lw';
      return '<div class="'+c+'">'+esc(t)+'</div>';
    }).join('');
  }
}

function fmt(s){if(!s||isNaN(s))return'—';const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sc=s%60;return h>0?h+'س '+m+'د':m>0?m+'د '+sc+'ث':sc+'ث';}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

// ── Facebook Login ─────────────────────────────────────────────
let _loginPoll;
async function doLogin(){
  const email=document.getElementById('fb-email').value.trim();
  const pass=document.getElementById('fb-pass').value;
  if(!email||!pass){showLoginMsg('الرجاء إدخال رقم الهاتف وكلمة السر','err');return;}
  const btn=document.getElementById('login-btn');
  btn.disabled=true;btn.innerHTML='جاري تسجيل الدخول... <span class="spinner"></span>';
  showLoginMsg('جاري الاتصال بفيسبوك... قد يستغرق 30-60 ثانية','info');
  const d=await post('/api/login',{email,pass});
  if(d&&d.ok){
    showLoginMsg('✅ تم تسجيل الدخول وحفظ الكوكيز! جاري إعادة تشغيل البوت...','ok');
    btn.disabled=false;btn.innerHTML='🔐 تسجيل الدخول وربط البوت';
    document.getElementById('fb-pass').value='';
  } else if(d&&d.pending){
    showLoginMsg('جاري المعالجة... انتظر قليلاً','info');
    _loginPoll=setInterval(pollLogin,4000);
  } else {
    showLoginMsg('❌ فشل: '+(d&&d.err||'خطأ غير معروف'),'err');
    btn.disabled=false;btn.innerHTML='🔐 تسجيل الدخول وربط البوت';
  }
}

async function pollLogin(){
  const d=await api('/api/login-status');
  if(!d) return;
  if(d.done){
    clearInterval(_loginPoll);
    const btn=document.getElementById('login-btn');
    btn.disabled=false;btn.innerHTML='🔐 تسجيل الدخول وربط البوت';
    if(d.ok) showLoginMsg('✅ '+d.msg,'ok');
    else showLoginMsg('❌ '+d.msg,'err');
  } else {
    showLoginMsg(d.msg||'جاري المعالجة...','info');
  }
}

function showLoginMsg(t,c){const el=document.getElementById('login-status');el.textContent=t;el.className='login-status '+c;}

// ── Commands ───────────────────────────────────────────────────
async function loadCmdsData(){
  const d=await api('/api/commands'); if(!d||!d.commands) return;
  _all=d.commands; buildCats(); renderCmds();
}
function buildCats(){
  const cs=['الكل',...new Set(_all.map(c=>c.category))];
  document.getElementById('cat-btns').innerHTML=cs.map(c=>`<button class="cat-btn${c===_cat?' active':''}" onclick="setCat('${esc(c)}')">${esc(c)}</button>`).join('');
}
function setCat(c){_cat=c;document.querySelectorAll('.cat-btn').forEach(b=>{b.classList.toggle('active',b.textContent===c);});renderCmds();}
function filterCmds(){renderCmds();}
function renderCmds(){
  const q=(document.getElementById('cmd-search').value||'').toLowerCase();
  let l=_all;
  if(_cat!=='الكل') l=l.filter(c=>c.category===_cat);
  if(q) l=l.filter(c=>c.name.toLowerCase().includes(q)||c.description.toLowerCase().includes(q));
  document.getElementById('cmd-count').textContent=l.length+' أمر';
  const g=document.getElementById('cmd-grid');
  if(!l.length){g.innerHTML='<div style="color:#4a4a7a;text-align:center;padding:30px;grid-column:1/-1">لا توجد نتائج</div>';return;}
  g.innerHTML=l.map(c=>`<div class="cmd-card" onclick="copyCmd('${esc(c.name)}')"><span class="cmd-cat">${esc(c.category)}</span><div class="cmd-name">${esc(c.name)}</div><div class="cmd-desc">${esc(c.description)}</div><div class="cmd-use">${esc(c.usage)}</div></div>`).join('');
}
function copyCmd(n){navigator.clipboard.writeText(n).catch(()=>{});showMsg('ctrl-msg','نسخ: '+n,'ok',1500);}

// ── Cookies ────────────────────────────────────────────────────
async function saveCookies(){
  const txt=document.getElementById('cookie-txt').value.trim();
  if(!txt){showMsg('cookie-msg','الرجاء إدخال الكوكيز','err');return;}
  const d=await post('/api/cookies',{cookies:txt});
  if(d&&d.ok) showMsg('cookie-msg','✅ تم الحفظ وإعادة التشغيل','ok');
  else showMsg('cookie-msg','❌ فشل: '+(d&&d.err||''),'err');
}
async function loadCookies(){
  const d=await api('/api/cookies');
  if(d&&d.cookies) document.getElementById('cookie-txt').value=d.cookies;
  else showMsg('cookie-msg','❌ تعذر التحميل','err');
}

// ── Bot controls ───────────────────────────────────────────────
async function botAction(a){
  const lb={start:'تشغيل',stop:'إيقاف',restart:'إعادة تشغيل'};
  const d=await post('/api/'+a,{});
  if(d&&d.ok) showMsg('ctrl-msg','✅ تم '+lb[a],'ok');
  else showMsg('ctrl-msg','❌ فشل','err');
}

function showMsg(id,t,c,ms){
  const el=document.getElementById(id);
  el.textContent=t;el.className='msg '+(c||'ok');el.style.display='block';
  if(ms) setTimeout(()=>{el.style.display='none';},ms);
}

(async function init(){
  await Promise.all([refreshStatus(),loadCmdsData()]);
  _timer=setInterval(refreshStatus,3000);
})();
</script>
</body></html>`; }

// ══════════════════════════════════════════════════════════════
//  HTTP SERVER
// ══════════════════════════════════════════════════════════════
function readBody(req) {
  return new Promise(res => {
    let b=""; req.on("data",c=>b+=c); req.on("end",()=>{try{res(JSON.parse(b));}catch{res({});}});
  });
}

const server = http.createServer(async (req, res) => {
  const url    = req.url || "/";
  const method = req.method || "GET";

  function json(obj, code) {
    res.writeHead(code||200, {"Content-Type":"application/json","Access-Control-Allow-Origin":"*"});
    res.end(JSON.stringify(obj));
  }

  if (method==="GET" && (url==="/"||url==="/dashboard")) {
    res.writeHead(200, {"Content-Type":"text/html; charset=utf-8"});
    return res.end(buildHTML());
  }

  if (method==="GET" && url==="/api/status") {
    const s = global.botState||{};
    return json({status:"ok",bot:s.status||"unknown",pid:s.pid||null,uptime:Math.floor(process.uptime()),
      memory:Math.round(process.memoryUsage().rss/1024/1024)+"MB",crashes:s.crashCount||0,
      errorMsg:s.errorMsg||"",logs:(s.logs||[]).slice(-20),ts:Date.now()});
  }

  if (method==="GET" && url==="/api/commands") {
    try { return json({commands:loadCommands()}); }
    catch(e) { return json({commands:[],error:e.message}); }
  }

  if (method==="GET" && url==="/api/cookies") {
    try { return json({ok:true,cookies:fs.existsSync(ACCOUNT)?fs.readFileSync(ACCOUNT,"utf-8"):""}); }
    catch(e) { return json({ok:false,err:e.message}); }
  }

  if (method==="GET" && url==="/api/login-status") {
    return json({..._loginStatus, pending: _loginInProgress});
  }

  if (method==="POST" && url==="/api/cookies") {
    const body = await readBody(req);
    if (!body.cookies?.trim()) return json({ok:false,err:"فارغة"},400);
    try {
      fs.writeFileSync(ACCOUNT, body.cookies.trim(), "utf-8");
      setTimeout(()=>{if(typeof global.restartBot==="function")global.restartBot();},800);
      return json({ok:true});
    } catch(e) { return json({ok:false,err:e.message}); }
  }

  if (method==="POST" && url==="/api/login") {
    const body = await readBody(req);
    const email = body.email || body.phone || "";
    const pass  = body.pass  || body.password || "";
    if (!email||!pass) return json({ok:false,err:"بيانات ناقصة"},400);
    // Run login in background to avoid HTTP timeout
    _loginStatus = { done:false, ok:false, msg:"جاري الاتصال بفيسبوك..." };
    doFbLogin(email, pass, (err, result) => {
      if (err) console.error("[FB-LOGIN]", err);
      else     console.log("[FB-LOGIN] ✅", result);
    });
    return json({ok:true, pending:true});
  }

  if (method==="POST" && (url==="/api/start"||url==="/api/restart")) {
    setTimeout(()=>{if(typeof global.restartBot==="function")global.restartBot();},400);
    return json({ok:true});
  }

  if (method==="POST" && url==="/api/stop") {
    if(global.botState) global.botState.status="stopped";
    if(global._botChild){try{global._botChild.kill("SIGTERM");}catch(_){}}
    return json({ok:true});
  }

  res.writeHead(404); res.end("Not found");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\x1b[35m[ميكو 🌸]\x1b[0m لوحة التحكم: http://0.0.0.0:${PORT}`);
  console.log(`\x1b[35m[ميكو 🌸]\x1b[0m الرابط: ${RENDER_URL}`);
});

// ══════════════════════════════════════════════════════════════
//  KEEP-ALIVE  (3 layers)
// ══════════════════════════════════════════════════════════════
let _pOk=0, _pFail=0;
function doPing() {
  if(!RENDER_URL) return;
  try {
    const u=new URL(RENDER_URL+"/api/status");
    const mod=u.protocol==="https:"?https:http;
    const r=mod.request({hostname:u.hostname,port:u.port||443,path:u.pathname,method:"GET",timeout:12000,headers:{"User-Agent":"Miko-KeepAlive/5"}},()=>{_pOk++;_pFail=0;});
    r.on("error",()=>_pFail++); r.on("timeout",()=>{_pFail++;r.destroy();}); r.end();
  } catch(_){}
}
setTimeout(()=>{doPing();setInterval(doPing,8*60*1000);},90000);
setTimeout(()=>{doPing();setInterval(doPing,11*60*1000);},4*60*1000);
setTimeout(()=>{doPing();setInterval(doPing,13*60*1000);},7*60*1000);
console.log(`\x1b[35m[ميكو 💓]\x1b[0m Keep-alive 3 طبقات مُفعَّل (8/11/13 دقيقة)`);

// ══════════════════════════════════════════════════════════════
//  WATCHDOG
// ══════════════════════════════════════════════════════════════
setInterval(()=>{
  const s=global.botState; if(!s||typeof global.restartBot!=="function") return;
  const now=Date.now();
  if(s.status==="error"&&s.errorAt&&now-s.errorAt>8*60*1000){
    console.log(`\x1b[35m[ميكو 🤖]\x1b[0m Watchdog → إعادة تشغيل تلقائية`);
    s.errorAt=now; global.restartBot();
  }
  console.log(`\x1b[35m[ميكو 💓]\x1b[0m بوت:${s.status} | ذاكرة:${Math.round(process.memoryUsage().rss/1024/1024)}MB | نبضات:${_pOk}`);
}, 3*60*1000);

module.exports = server;
