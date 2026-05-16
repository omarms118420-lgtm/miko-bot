/**
 * @author NTKhang
 * ! The source code is written by NTKhang, please don't change the author's name everywhere. Thank you for using
 * ! Official source code: https://github.com/ntkhang03/Goat-Bot-V2
 */

const { spawn } = require("child_process");
const log = require("./logger/log.js");

// ── حماية العملية الرئيسية من أي خطأ ─────────────────────────────────────────
process.on("uncaughtException",  e => log.error("MAIN", e.message));
process.on("unhandledRejection", e => log.warn("MAIN",  String(e?.message || e)));

// ── State ─────────────────────────────────────────────────────────────────────
let _child      = null;
let _token      = 0;
let _retryTmr   = null;
let _stableTmr  = null;
let _crashCount = 0;
let _lastCrash  = 0;
let _memWatch   = null;

const DELAYS = [3000, 6000, 12000, 20000, 30000]; // exponential backoff

function ts() { return new Date().toLocaleTimeString("ar"); }

// ── Keep event-loop alive ─────────────────────────────────────────────────────
setInterval(() => {}, 30000);

// ── Minimal HTTP server (required by Render to stay alive) ───────────────────
require("./hosting/server.js");

// ── Bot launcher ──────────────────────────────────────────────────────────────
function startBot() {
    const token = ++_token;
    _crashCount = _crashCount || 0;

    log.info("BOT", `▶️  تشغيل البوت... (محاولة ${_crashCount + 1})`);

    const child = spawn("node", ["--max-old-space-size=512", "Mahi.js"], {
        cwd: __dirname, stdio: "inherit", shell: false
    });

    _child = child;

    // Memory watchdog — restart if RSS > 480 MB
    if (_memWatch) clearInterval(_memWatch);
    _memWatch = setInterval(() => {
        if (_token !== token || !_child) { clearInterval(_memWatch); return; }
        const mb = process.memoryUsage().rss / 1024 / 1024;
        if (mb > 480) {
            log.warn("BOT", `ذاكرة عالية (${mb.toFixed(0)}MB) — إعادة تشغيل تلقائية`);
            restartBot();
        }
    }, 5 * 60 * 1000);

    // Stable timer: reset crash count after 2 min of smooth run
    if (_stableTmr) clearTimeout(_stableTmr);
    _stableTmr = setTimeout(() => {
        if (_token === token) {
            _crashCount = 0;
            log.info("BOT", "💚 البوت مستقر — تصفير عداد الأعطال");
        }
    }, 120000);

    child.on("close", code => {
        if (_token !== token) return;
        if (_stableTmr) { clearTimeout(_stableTmr); _stableTmr = null; }
        if (_memWatch)  { clearInterval(_memWatch);  _memWatch  = null; }
        _child = null;

        const now = Date.now();
        if (now - _lastCrash < 15000) _crashCount++;
        else if (now - _lastCrash > 120000) _crashCount = 0;
        _lastCrash = now;

        if (_crashCount >= 5) {
            log.error("BOT", `❌ ${_crashCount} أعطال — انتظار 60 ثانية`);
            _retryTmr = setTimeout(() => { _crashCount = 0; startBot(); }, 60000);
            return;
        }

        const delay = DELAYS[Math.min(_crashCount, DELAYS.length - 1)];
        log.warn("BOT", `⚠️  توقف (exit:${code ?? "?"}) — إعادة بعد ${delay/1000}ث`);
        _retryTmr = setTimeout(startBot, delay);
    });

    child.on("error", err => {
        if (_token !== token) return;
        if (_stableTmr) { clearTimeout(_stableTmr); _stableTmr = null; }
        if (_memWatch)  { clearInterval(_memWatch);  _memWatch  = null; }
        _child = null;
        log.error("BOT", err.message);
        _retryTmr = setTimeout(startBot, 5000);
    });
}

function restartBot() {
    if (_retryTmr)  { clearTimeout(_retryTmr);  _retryTmr  = null; }
    if (_stableTmr) { clearTimeout(_stableTmr); _stableTmr = null; }
    if (_memWatch)  { clearInterval(_memWatch);  _memWatch  = null; }
    _crashCount = 0;
    if (_child) { try { _child.kill("SIGTERM"); } catch(_) { startBot(); } }
    else startBot();
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────
process.on("SIGTERM", () => {
    log.info("BOT", "🛑 SIGTERM — جاري الإيقاف...");
    if (_child) { try { _child.kill("SIGTERM"); } catch(_) {} }
    setTimeout(() => process.exit(0), 3000);
});
process.on("SIGINT", () => {
    if (_child) { try { _child.kill("SIGTERM"); } catch(_) {} }
    process.exit(0);
});

startBot();
