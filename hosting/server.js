/**
 * Smart keep-alive server with internal watchdog for Render hosting.
 */

const http  = require("http");
const https = require("https");

const PORT         = process.env.PORT || 5000;
const RENDER_URL   = process.env.RENDER_EXTERNAL_URL || "https://miko-bot-y7o5.onrender.com";

// ══════════════════════════════════════════════════════════════
//  HTTP SERVER
// ══════════════════════════════════════════════════════════════
const server = http.createServer((req, res) => {
  const state = global.botState || {};
  const url   = req.url || "/";

  // Force restart endpoint (used by external monitors or manually)
  if (url === "/restart" && req.method === "POST") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, msg: "إعادة التشغيل..." }));
    setTimeout(() => { if (typeof global.restartBot === "function") global.restartBot(); }, 500);
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({
    status:     "ok",
    bot:        state.status    || "unknown",
    pid:        state.pid       || null,
    uptime:     Math.floor(process.uptime()),
    memory:     Math.round(process.memoryUsage().rss / 1024 / 1024) + "MB",
    crashes:    state.crashCount || 0,
    errorMsg:   state.errorMsg   || "",
    logs:       (state.logs || []).slice(-20),
    ts:         Date.now()
  }));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\x1b[35m[ميكو 🌸]\x1b[0m السيرفر يعمل على المنفذ ${PORT} ✅`);
  console.log(`\x1b[35m[ميكو 🌸]\x1b[0m الرابط: ${RENDER_URL} 🌐`);
});

// ══════════════════════════════════════════════════════════════
//  KEEP-ALIVE ENGINE  (triple-layer)
// ══════════════════════════════════════════════════════════════
let _pingOk   = 0;
let _pingFail = 0;

function doPing(path, label) {
  try {
    const u   = new URL(RENDER_URL + (path || "/"));
    const mod = u.protocol === "https:" ? https : http;
    const req = mod.request({
      hostname: u.hostname,
      port:     u.port || (u.protocol === "https:" ? 443 : 80),
      path:     u.pathname,
      method:   "GET",
      timeout:  12000,
      headers:  { "User-Agent": "Miko-Watchdog/5.0" }
    }, () => { _pingOk++; _pingFail = 0; });
    req.on("error",   () => _pingFail++);
    req.on("timeout", () => { _pingFail++; req.destroy(); });
    req.end();
  } catch(_) {}
}

// Layer 1: every 8 min (well within 15-min Render sleep threshold)
setTimeout(() => {
  doPing("/", "L1");
  setInterval(() => doPing("/", "L1"), 8 * 60 * 1000);
}, 90 * 1000);

// Layer 2: every 11 min (offset to avoid both hitting at same time)
setTimeout(() => {
  doPing("/", "L2");
  setInterval(() => doPing("/", "L2"), 11 * 60 * 1000);
}, 4 * 60 * 1000);

// Layer 3: every 13 min (last-resort backup)
setTimeout(() => {
  doPing("/", "L3");
  setInterval(() => doPing("/", "L3"), 13 * 60 * 1000);
}, 7 * 60 * 1000);

console.log(`\x1b[35m[ميكو 💓]\x1b[0m Keep-alive ثلاثي الطبقات مُفعَّل ✅ (8/11/13 دقائق)`);

// ══════════════════════════════════════════════════════════════
//  INTERNAL WATCHDOG  (AI self-healing)
//  Checks bot health every 3 min and auto-restarts if stuck
// ══════════════════════════════════════════════════════════════
const WATCHDOG_INTERVAL = 3 * 60 * 1000;   // check every 3 min
const MAX_ERROR_AGE     = 8 * 60 * 1000;   // restart if in error > 8 min
const MAX_STOPPED_AGE   = 5 * 60 * 1000;   // restart if stopped > 5 min

setInterval(() => {
  const state = global.botState;
  if (!state) return;
  if (typeof global.restartBot !== "function") return;

  const now = Date.now();

  // If stuck in "error" state for too long → force restart
  if (state.status === "error" && state.errorAt) {
    const age = now - state.errorAt;
    if (age > MAX_ERROR_AGE) {
      console.log(`\x1b[35m[ميكو 🤖]\x1b[0m Watchdog: خطأ مستمر ${Math.round(age/60000)}د — إعادة تشغيل تلقائية`);
      state.errorAt = now; // reset timer before restarting
      global.restartBot();
      return;
    }
  }

  // If "stopped" (not intentional) for too long → force restart
  if (state.status === "stopped" && state.startedAt) {
    const age = now - (state.startedAt || now);
    if (age > MAX_STOPPED_AGE) {
      console.log(`\x1b[35m[ميكو 🤖]\x1b[0m Watchdog: توقف مطوّل ${Math.round(age/60000)}د — إعادة تشغيل`);
      global.restartBot();
      return;
    }
  }

  // Heartbeat log
  const memMB = Math.round(process.memoryUsage().rss / 1024 / 1024);
  console.log(
    `\x1b[35m[ميكو 💓]\x1b[0m` +
    ` بوت:${state.status}` +
    ` | ذاكرة:${memMB}MB` +
    ` | نبضات:${_pingOk}` +
    ` | أعطال:${state.crashCount || 0}`
  );

}, WATCHDOG_INTERVAL);

module.exports = server;
