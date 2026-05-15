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

// ─── state (module-level, not on the global object) ───────────────────────────
let _child       = null;   // current child process
let _token       = 0;      // incremented every startBot(); close handlers ignore stale tokens
let _pendingTmr  = null;   // auto-restart timer
let _manualStop  = false;
let _crashCount  = 0;
let _lastCrash   = 0;
let _statusGuard = null;   // failsafe timer: clears "restarting" if stuck

function ts() { return new Date().toLocaleTimeString("ar"); }

function addLog(msg) {
  const mgr = global.botManager;
  mgr.logs.push({ time: Date.now(), msg });
  if (mgr.logs.length > 80) mgr.logs.shift();
}

function setStatus(s, err) {
  global.botManager.status   = s;
  if (err !== undefined) global.botManager.errorMsg = err;
}

// ─── global.botManager (exposed to server.js) ─────────────────────────────────
global.botManager = {
  status:   "stopped",
  pid:      null,
  startTime: null,
  errorMsg: "",
  logs:     [],

  restart() {
    // cancel any pending timers
    if (_pendingTmr)  { clearTimeout(_pendingTmr);  _pendingTmr  = null; }
    if (_statusGuard) { clearTimeout(_statusGuard); _statusGuard = null; }

    _manualStop  = false;
    _crashCount  = 0;
    setStatus("restarting", "");
    addLog(`[${ts()}] 🔄 جاري إعادة التشغيل...`);
    log.info("BOT", "إعادة التشغيل من لوحة التحكم...");

    // Failsafe: if still "restarting" after 20s → force start
    _statusGuard = setTimeout(() => {
      _statusGuard = null;
      if (global.botManager.status === "restarting") {
        log.warn("BOT", "Failsafe: لم تكتمل إعادة التشغيل — إعادة محاولة...");
        _child = null;
        startBot();
      }
    }, 20000);

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
    _manualStop = false;
    _crashCount = 0;
    setStatus("stopped", "");
    startBot();
    return true;
  }
};

// ─── Start web server ──────────────────────────────────────────────────────────
try { require("./hosting/server.js"); }
catch (e) { console.error("[host]", e.message); }

// ─── Bot launcher ──────────────────────────────────────────────────────────────
function startBot() {
  const mgr   = global.botManager;
  const token = ++_token;           // unique ID for this launch

  setStatus("starting", "");
  mgr.startTime = Date.now();
  mgr.pid = null;
  addLog(`[${ts()}] ▶️ تشغيل البوت...`);

  const child = spawn("node", ["Mahi.js"], {
    cwd: __dirname, stdio: "pipe", shell: true
  });

  _child   = child;
  mgr.pid  = child.pid;

  // Mark "running" after 8 s if still alive and this is still the active token
  const aliveTmr = setTimeout(() => {
    if (_token === token && (mgr.status === "starting" || mgr.status === "restarting")) {
      setStatus("running");
      addLog(`[${ts()}] ✅ البوت يعمل!`);
    }
  }, 8000);

  if (child.stdout) {
    child.stdout.on("data", data => {
      const line = data.toString().trim();
      if (!line) return;
      process.stdout.write(data);
      addLog(`[${ts()}] ${line.slice(0, 300)}`);
      if (/DONE|listening|Logged in|Connected|تم تشغيل البوت|(LOGIN.*✓)/i.test(line)) {
        if (_token === token) { setStatus("running"); }
      }
      if (/Không tìm thấy cookie|cookie.*không/i.test(line)) {
        mgr.errorMsg = "كوكيز غير صالحة ❌ — غيّر الكوكيز";
      }
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

    // Stale child — a newer process already took over
    if (_token !== token) return;

    _child   = null;
    mgr.pid  = null;

    // Clear the failsafe guard since we're handling the close properly
    if (_statusGuard) { clearTimeout(_statusGuard); _statusGuard = null; }

    // Manual stop — done
    if (_manualStop) { setStatus("stopped"); return; }

    // Crash detection
    const now = Date.now();
    if (now - _lastCrash < 10000) _crashCount++;
    else _crashCount = 0;
    _lastCrash = now;

    if (_crashCount >= 3) {
      if (!mgr.errorMsg) mgr.errorMsg = "البوت يتوقف باستمرار ❌ — تحقق من الكوكيز";
      setStatus("error");
      addLog(`[${ts()}] ❌ فشل متكرر — انتظار 30 ثانية`);
      _pendingTmr = setTimeout(() => {
        _pendingTmr = null;
        _crashCount = 0;
        if (!_manualStop) startBot();
      }, 30000);
      return;
    }

    const delay = Math.min(_crashCount * 4000, 15000) || 2000;
    setStatus("stopped");
    addLog(`[${ts()}] ⚠️ توقف (${code}) — إعادة بعد ${delay/1000}ث`);

    _pendingTmr = setTimeout(() => {
      _pendingTmr = null;
      if (!_manualStop) startBot();
    }, delay);
  });

  child.on("error", err => {
    clearTimeout(aliveTmr);
    if (_token !== token) return;
    _child = null; mgr.pid = null;
    mgr.errorMsg = err.message;
    setStatus("stopped");
    addLog(`[ERR] ${err.message}`);
    _pendingTmr = setTimeout(() => { _pendingTmr = null; if (!_manualStop) startBot(); }, 5000);
  });
}

setInterval(() => {}, 60000);
startBot();
