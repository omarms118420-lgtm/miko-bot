/**
 * @author NTKhang
 * ! The source code is written by NTKhang, please don't change the author's name everywhere. Thank you for using
 * ! Official source code: https://github.com/ntkhang03/Goat-Bot-V2
 */

const { spawn } = require("child_process");
const log = require("./logger/log.js");

// ══════════════════════════════════════════════════════════════
//  SMART ERROR CLASSIFIER  (AI-like pattern matching)
// ══════════════════════════════════════════════════════════════
const ERROR_RULES = [
  {
    id:      "cookie_expired",
    test:    /cookie.*invalid|không tìm thấy cookie|cookie.*không|appstate.*invalid|login.*fail|logged.*out|checkpoint/i,
    delay:   45000,
    maxTry:  2,
    msg:     "كوكيز منتهية الصلاحية — يجب تحديثها"
  },
  {
    id:      "network",
    test:    /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ECONNRESET|network.*error|fetch.*failed|socket.*hang/i,
    delay:   8000,
    maxTry:  10,
    msg:     "خطأ شبكة — إعادة المحاولة"
  },
  {
    id:      "module_missing",
    test:    /Cannot find module|MODULE_NOT_FOUND/i,
    delay:   0,
    maxTry:  0,   // لا تعيد التشغيل — لا يمكن إصلاحه تلقائياً
    msg:     "وحدة Node مفقودة — يحتاج تثبيتاً يدوياً"
  },
  {
    id:      "memory",
    test:    /ENOMEM|JavaScript heap out of memory|Allocation failed/i,
    delay:   5000,
    maxTry:  5,
    msg:     "نفاد الذاكرة — إعادة تشغيل فوري"
  },
  {
    id:      "json_invalid",
    test:    /SyntaxError.*JSON|invalid.*json|Unexpected token/i,
    delay:   0,
    maxTry:  0,
    msg:     "ملف JSON تالف — يحتاج إصلاحاً يدوياً"
  },
  {
    id:      "rate_limit",
    test:    /rate.*limit|too many request|429|flood/i,
    delay:   60000,
    maxTry:  5,
    msg:     "حدّ الطلبات — انتظار دقيقة"
  },
  {
    id:      "general",
    test:    /.*/,
    delay:   5000,
    maxTry:  999,
    msg:     "خطأ عام"
  }
];

function classifyError(text) {
  for (const rule of ERROR_RULES) {
    if (rule.test.test(text)) return rule;
  }
  return ERROR_RULES[ERROR_RULES.length - 1];
}

// ══════════════════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════════════════
let _child       = null;
let _token       = 0;
let _retryTmr    = null;
let _stableTmr   = null;
let _memWatch    = null;
let _crashCount  = 0;
let _lastCrash   = 0;
let _lastError   = "";
let _lastRule    = null;

// Exported status for server.js watchdog
global.botState = {
  status:    "stopped",   // stopped | starting | running | error
  pid:       null,
  startedAt: null,
  errorAt:   null,
  errorMsg:  "",
  crashCount: 0,
  logs:      []
};

function setState(s, msg) {
  global.botState.status = s;
  if (msg !== undefined) global.botState.errorMsg = msg;
  if (s === "error") global.botState.errorAt = Date.now();
  if (s === "running") { global.botState.errorAt = null; global.botState.errorMsg = ""; }
}

function addLog(msg) {
  const arr = global.botState.logs;
  arr.push({ t: Date.now(), m: msg });
  if (arr.length > 120) arr.shift();
}

function ts() { return new Date().toLocaleTimeString("ar"); }

// ══════════════════════════════════════════════════════════════
//  PARENT PROTECTION
// ══════════════════════════════════════════════════════════════
process.on("uncaughtException",  e => { log.error("MAIN", e.message); addLog(`[MAIN ERR] ${e.message}`); });
process.on("unhandledRejection", e => { log.warn("MAIN",  String(e?.message || e)); });

// Keep event-loop alive forever
setInterval(() => {}, 30000);

// ══════════════════════════════════════════════════════════════
//  WEB SERVER
// ══════════════════════════════════════════════════════════════
require("./hosting/server.js");

// ══════════════════════════════════════════════════════════════
//  BOT LAUNCHER
// ══════════════════════════════════════════════════════════════
function startBot() {
  const myToken = ++_token;
  _crashCount = _crashCount || 0;

  setState("starting");
  global.botState.startedAt = Date.now();
  global.botState.crashCount = _crashCount;
  global.botState.pid = null;

  addLog(`[${ts()}] ▶️ تشغيل البوت (محاولة ${_crashCount + 1})`);
  log.info("BOT", `▶️  تشغيل البوت (محاولة ${_crashCount + 1})`);

  const child = spawn("node", ["--max-old-space-size=512", "Mahi.js"], {
    cwd: __dirname,
    stdio: ["inherit", "pipe", "pipe"],   // capture stdout+stderr for analysis
    shell: false
  });

  _child = child;
  global.botState.pid = child.pid;

  // ── stdout: detect "running" signals ──────────────────────────────────────
  if (child.stdout) {
    child.stdout.on("data", data => {
      const line = data.toString().trim();
      if (!line) return;
      process.stdout.write(data);
      addLog(`[${ts()}] ${line.slice(0, 300)}`);
      if (/DONE|listening|Logged in|Connected|تم تشغيل|LOGIN.*✓/i.test(line)) {
        if (_token === myToken) {
          setState("running");
          addLog(`[${ts()}] ✅ البوت متصل بفيسبوك`);
        }
      }
    });
  }

  // ── stderr: classify errors ───────────────────────────────────────────────
  if (child.stderr) {
    child.stderr.on("data", data => {
      const line = data.toString().trim();
      if (!line) return;
      process.stderr.write(data);
      addLog(`[ERR ${ts()}] ${line.slice(0, 300)}`);
      _lastError = line;
      const rule = classifyError(line);
      if (rule.id !== "general") {
        setState("error", rule.msg);
        _lastRule = rule;
      }
    });
  }

  // ── Mark "running" after 10s if still alive (fallback) ───────────────────
  const aliveTmr = setTimeout(() => {
    if (_token === myToken && global.botState.status === "starting") {
      setState("running");
      addLog(`[${ts()}] ✅ البوت يعمل`);
    }
  }, 10000);

  // ── Stable timer: reset crash count after 3 min of smooth run ────────────
  if (_stableTmr) clearTimeout(_stableTmr);
  _stableTmr = setTimeout(() => {
    if (_token === myToken) {
      _crashCount = 0;
      _lastRule   = null;
      global.botState.crashCount = 0;
      addLog(`[${ts()}] 💚 مستقر — تصفير عداد الأعطال`);
    }
  }, 180000);

  // ── Memory watchdog every 5 min ───────────────────────────────────────────
  if (_memWatch) clearInterval(_memWatch);
  _memWatch = setInterval(() => {
    if (_token !== myToken || !_child) { clearInterval(_memWatch); return; }
    const mb = process.memoryUsage().rss / 1024 / 1024;
    if (mb > 460) {
      addLog(`[${ts()}] ⚠️ ذاكرة عالية (${mb.toFixed(0)}MB) — إعادة تشغيل`);
      log.warn("BOT", `ذاكرة عالية (${mb.toFixed(0)}MB)`);
      _cleanup();
      startBot();
    }
  }, 5 * 60 * 1000);

  // ── On exit ────────────────────────────────────────────────────────────────
  child.on("close", code => {
    clearTimeout(aliveTmr);
    if (_token !== myToken) return;
    _cleanup();

    const now = Date.now();
    if (now - _lastCrash < 20000) _crashCount++;
    else if (now - _lastCrash > 180000) _crashCount = 0;
    _lastCrash = now;
    global.botState.crashCount = _crashCount;

    // Use classified rule if available
    const rule = _lastRule || ERROR_RULES[ERROR_RULES.length - 1];

    if (rule.maxTry === 0) {
      setState("error", rule.msg);
      addLog(`[${ts()}] 🛑 توقف نهائي: ${rule.msg}`);
      log.error("BOT", `توقف نهائي: ${rule.msg}`);
      // Even for "fatal" errors, retry after 5 min in case it was transient
      _retryTmr = setTimeout(() => { _lastRule = null; _crashCount = 0; startBot(); }, 5 * 60 * 1000);
      return;
    }

    if (_crashCount >= 6) {
      const longWait = rule.id === "cookie_expired" ? 10 * 60 * 1000 : 90000;
      setState("error", `${rule.msg} (${_crashCount} أعطال)`);
      addLog(`[${ts()}] ❌ ${_crashCount} أعطال متتالية — انتظار ${longWait/1000}ث`);
      _retryTmr = setTimeout(() => { _crashCount = 0; _lastRule = null; startBot(); }, longWait);
      return;
    }

    // Smart delay based on error type
    const baseDelay = rule.delay || 5000;
    const delay     = Math.min(baseDelay * (1 + _crashCount * 0.5), 60000);
    setState("stopped", rule.msg);
    addLog(`[${ts()}] ⚠️ توقف (exit:${code ?? "?"}) [${rule.id}] — إعادة بعد ${(delay/1000).toFixed(0)}ث`);
    log.warn("BOT", `توقف → إعادة بعد ${(delay/1000).toFixed(0)}ث [${rule.id}]`);

    _retryTmr = setTimeout(startBot, delay);
  });

  child.on("error", err => {
    clearTimeout(aliveTmr);
    if (_token !== myToken) return;
    _cleanup();
    setState("error", err.message);
    addLog(`[ERR ${ts()}] ${err.message}`);
    _retryTmr = setTimeout(startBot, 5000);
  });
}

function _cleanup() {
  if (_stableTmr) { clearTimeout(_stableTmr);  _stableTmr = null; }
  if (_memWatch)  { clearInterval(_memWatch);   _memWatch  = null; }
  _child = null;
  global.botState.pid = null;
}

// Public restart used by server.js watchdog
global.restartBot = function() {
  if (_retryTmr)  { clearTimeout(_retryTmr);  _retryTmr  = null; }
  _cleanup();
  _crashCount = 0;
  _lastRule   = null;
  if (_child) { try { _child.kill("SIGTERM"); } catch(_) { startBot(); } }
  else startBot();
};

// ══════════════════════════════════════════════════════════════
//  GRACEFUL SHUTDOWN
// ══════════════════════════════════════════════════════════════
process.on("SIGTERM", () => {
  addLog(`[${ts()}] 🛑 SIGTERM`);
  if (_child) { try { _child.kill("SIGTERM"); } catch(_) {} }
  setTimeout(() => process.exit(0), 4000);
});
process.on("SIGINT", () => {
  if (_child) { try { _child.kill("SIGTERM"); } catch(_) {} }
  process.exit(0);
});

startBot();
