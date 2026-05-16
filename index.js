/**
 * @author NTKhang
 * ! The source code is written by NTKhang, please don't change the author's name everywhere. Thank you for using
 * ! Official source code: https://github.com/ntkhang03/Goat-Bot-V2
 * ! If you do not change the below code, it is very important for the project.
 * It is my motivation to maintain and develop the project for free.
 * ! If you change it, you will be banned forever
 * Thank you for using
 */

const { spawn } = require("child_process");
const log = require("./logger/log.js");

// ─── Prevent the PARENT process from ever dying ──────────────────────────────
process.on("uncaughtException",  err => { log.error("PARENT", "uncaughtException: " + err.message); });
process.on("unhandledRejection", err => { log.warn("PARENT",  "unhandledRejection: " + (err?.message || err)); });

// ─── Keep the event-loop alive on Render ─────────────────────────────────────
setInterval(() => {}, 30000);

// ─── State ────────────────────────────────────────────────────────────────────
let _child        = null;
let _token        = 0;
let _pendingTmr   = null;
let _manualStop   = false;
let _crashCount   = 0;
let _lastCrash    = 0;
let _statusGuard  = null;
let _stableTmr    = null;   // reset crashCount after 120 s of stable run
let _memWatcher   = null;

function ts()  { return new Date().toLocaleTimeString("ar"); }

function addLog(msg) {
  const mgr = global.botManager;
  mgr.logs.push({ time: Date.now(), msg });
  if (mgr.logs.length > 100) mgr.logs.shift();
}

function setStatus(s, err) {
  global.botManager.status = s;
  if (err !== undefined) global.botManager.errorMsg = err;
}

// ─── global.botManager ───────────────────────────────────────────────────────
global.botManager = {
  status:    "stopped",
  pid:       null,
  startTime: null,
  errorMsg:  "",
  logs:      [],

  restart() {
    if (_pendingTmr)  { clearTimeout(_pendingTmr);  _pendingTmr  = null; }
    if (_statusGuard) { clearTimeout(_statusGuard); _statusGuard = null; }
    if (_stableTmr)   { clearTimeout(_stableTmr);   _stableTmr   = null; }
    _manualStop = false;
    _crashCount = 0;
    setStatus("restarting", "");
    addLog(`[${ts()}] 🔄 جاري إعادة التشغيل...`);
    log.info("BOT", "إعادة التشغيل من لوحة التحكم...");

    // Failsafe: force start if still stuck after 25s
    _statusGuard = setTimeout(() => {
      _statusGuard = null;
      if (global.botManager.status === "restarting") {
        log.warn("BOT", "Failsafe: إعادة محاولة التشغيل...");
        _child = null;
        startBot();
      }
    }, 25000);

    if (_child) {
      try { _child.kill("SIGTERM"); }
      catch (_) { _child = null; startBot(); }
    } else {
      startBot();
    }
    return true;
  },

  stop() {
    if (_pendingTmr)  { clearTimeout(_pendingTmr);  _pendingTmr  = null; }
    if (_statusGuard) { clearTimeout(_statusGuard); _statusGuard = null; }
    if (_stableTmr)   { clearTimeout(_stableTmr);   _stableTmr   = null; }
    if (_memWatcher)  { clearInterval(_memWatcher); _memWatcher  = null; }
    _manualStop = true;
    setStatus("stopped", "");
    addLog(`[${ts()}] ⏹️ تم إيقاف البوت.`);
    if (_child) { try { _child.kill("SIGTERM"); } catch (_) {} }
    return true;
  },

  start() {
    const s = global.botManager.status;
    if (s === "running" || s === "starting") return false;
    if (_pendingTmr)  { clearTimeout(_pendingTmr);  _pendingTmr  = null; }
    if (_statusGuard) { clearTimeout(_statusGuard); _statusGuard = null; }
    if (_stableTmr)   { clearTimeout(_stableTmr);   _stableTmr   = null; }
    _manualStop = false;
    _crashCount = 0;
    setStatus("stopped", "");
    startBot();
    return true;
  }
};

// ─── Web server ───────────────────────────────────────────────────────────────
try { require("./hosting/server.js"); }
catch (e) { console.error("[host]", e.message); }

// ─── Bot launcher ─────────────────────────────────────────────────────────────
function startBot() {
  const mgr   = global.botManager;
  const token = ++_token;

  setStatus("starting", "");
  mgr.startTime = Date.now();
  mgr.pid = null;
  addLog(`[${ts()}] ▶️ تشغيل البوت... (محاولة ${_crashCount + 1})`);

  const child = spawn("node", ["--max-old-space-size=512", "Mahi.js"], {
    cwd: __dirname, stdio: "pipe", shell: false
  });

  _child  = child;
  mgr.pid = child.pid;

  // Mark running after 8 s if still alive
  const aliveTmr = setTimeout(() => {
    if (_token === token && (mgr.status === "starting" || mgr.status === "restarting")) {
      setStatus("running");
      addLog(`[${ts()}] ✅ البوت يعمل!`);
      // Start stable-run timer: reset crashCount after 120 s continuous run
      _stableTmr = setTimeout(() => {
        _stableTmr  = null;
        _crashCount = 0;
        addLog(`[${ts()}] 💚 البوت مستقر — تصفير عداد الأعطال`);
      }, 120000);
    }
  }, 8000);

  // Memory watchdog: restart child if RSS > 480 MB
  if (_memWatcher) clearInterval(_memWatcher);
  _memWatcher = setInterval(() => {
    if (_token !== token || !_child) { clearInterval(_memWatcher); return; }
    try {
      const mem = process.memoryUsage().rss / 1024 / 1024;
      if (mem > 480) {
        addLog(`[${ts()}] ⚠️ ذاكرة عالية (${mem.toFixed(0)}MB) — إعادة تشغيل تلقائية`);
        global.botManager.restart();
      }
    } catch(_) {}
  }, 5 * 60 * 1000);

  if (child.stdout) {
    child.stdout.on("data", data => {
      const line = data.toString().trim();
      if (!line) return;
      process.stdout.write(data);
      addLog(`[${ts()}] ${line.slice(0, 300)}`);
      if (/DONE|listening|Logged in|Connected|تم تشغيل البوت|(LOGIN.*✓)/i.test(line)) {
        if (_token === token) setStatus("running");
      }
      if (/Không tìm thấy cookie|cookie.*không/i.test(line))
        mgr.errorMsg = "كوكيز غير صالحة ❌ — غيّر الكوكيز";
    });
  }

  if (child.stderr) {
    child.stderr.on("data", data => {
      const line = data.toString().trim();
      if (!line) return;
      process.stderr.write(data);
      addLog(`[ERR ${ts()}] ${line.slice(0, 300)}`);
      if (/Cannot find module/i.test(line)) {
        const m = line.match(/'([^']+)'/);
        mgr.errorMsg = "وحدة مفقودة: " + (m ? m[1] : "");
      }
    });
  }

  child.on("close", code => {
    clearTimeout(aliveTmr);
    if (_token !== token) return;

    if (_stableTmr)   { clearTimeout(_stableTmr);   _stableTmr   = null; }
    if (_memWatcher)  { clearInterval(_memWatcher);  _memWatcher  = null; }
    if (_statusGuard) { clearTimeout(_statusGuard);  _statusGuard = null; }

    _child  = null;
    mgr.pid = null;

    if (_manualStop) { setStatus("stopped"); return; }

    // Exponential backoff
    const now = Date.now();
    if (now - _lastCrash < 15000) _crashCount++;
    else if (now - _lastCrash > 120000) _crashCount = 0;  // stable reset
    _lastCrash = now;

    // After 5 rapid crashes → long pause
    if (_crashCount >= 5) {
      if (!mgr.errorMsg) mgr.errorMsg = "البوت يتوقف باستمرار ❌ — تحقق من الكوكيز أو الشبكة";
      setStatus("error");
      addLog(`[${ts()}] ❌ ${_crashCount} أعطال متتالية — انتظار 60 ثانية`);
      _pendingTmr = setTimeout(() => {
        _pendingTmr = null;
        _crashCount = 0;
        if (!_manualStop) { setStatus("stopped"); startBot(); }
      }, 60000);
      return;
    }

    // Exponential delay: 3s, 6s, 12s, 20s, 30s
    const delays = [3000, 6000, 12000, 20000, 30000];
    const delay  = delays[Math.min(_crashCount, delays.length - 1)];
    setStatus("stopped");
    addLog(`[${ts()}] ⚠️ توقف (exit:${code ?? "?"}) — إعادة بعد ${delay/1000}ث`);

    _pendingTmr = setTimeout(() => {
      _pendingTmr = null;
      if (!_manualStop) startBot();
    }, delay);
  });

  child.on("error", err => {
    clearTimeout(aliveTmr);
    if (_token !== token) return;
    if (_stableTmr)  { clearTimeout(_stableTmr);  _stableTmr  = null; }
    if (_memWatcher) { clearInterval(_memWatcher); _memWatcher = null; }
    _child = null; mgr.pid = null;
    mgr.errorMsg = err.message;
    setStatus("stopped");
    addLog(`[ERR ${ts()}] ${err.message}`);
    _pendingTmr = setTimeout(() => { _pendingTmr = null; if (!_manualStop) startBot(); }, 5000);
  });
}

// ─── Graceful SIGTERM (Render sends this before shutdown) ────────────────────
process.on("SIGTERM", () => {
  addLog(`[${ts()}] 🛑 SIGTERM — حفظ الحالة...`);
  if (_child) { try { _child.kill("SIGTERM"); } catch(_) {} }
  setTimeout(() => process.exit(0), 3000);
});

process.on("SIGINT", () => {
  if (_child) { try { _child.kill("SIGTERM"); } catch(_) {} }
  process.exit(0);
});

startBot();
