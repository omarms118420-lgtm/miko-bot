/**
 * Minimal keep-alive server for Render hosting.
 * No dashboard, no UI — bot only.
 */

const http = require("http");
const https = require("https");

const PORT         = process.env.PORT || 5000;
const EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || null;

// ── Tiny HTTP server (Render requires a web port to stay alive) ──────────────
const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
        status: "ok",
        bot:    "ميكو 🌸",
        uptime: Math.floor(process.uptime()),
        memory: Math.round(process.memoryUsage().rss / 1024 / 1024) + "MB",
        ts:     Date.now()
    }));
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`\x1b[35m[ميكو 🌸]\x1b[0m السيرفر يعمل على المنفذ ${PORT} ✅`);
});

// ── Keep-alive pings (prevent Render from sleeping after 15 min) ─────────────
let _pingCount = 0;
let _pingFails  = 0;

function ping(path) {
    if (!EXTERNAL_URL) return;
    try {
        const u   = new URL(EXTERNAL_URL + (path || "/"));
        const mod = u.protocol === "https:" ? https : http;
        const req = mod.request({
            hostname: u.hostname,
            port:     u.port || (u.protocol === "https:" ? 443 : 80),
            path:     u.pathname,
            method:   "GET",
            timeout:  12000,
            headers:  { "User-Agent": "Miko-KeepAlive/4.0" }
        }, () => { _pingCount++; _pingFails = 0; });
        req.on("error",   () => _pingFails++);
        req.on("timeout", () => { _pingFails++; req.destroy(); });
        req.end();
    } catch(_) {}
}

if (EXTERNAL_URL) {
    // First ping after 1 min, then every 10 min
    setTimeout(() => {
        ping("/");
        setInterval(() => ping("/"), 10 * 60 * 1000);
    }, 60 * 1000);

    // Backup ping offset at 13 min
    setTimeout(() => {
        ping("/");
        setInterval(() => ping("/"), 13 * 60 * 1000);
    }, 3 * 60 * 1000);

    // Heartbeat log every 30 min
    setInterval(() => {
        console.log(
            `\x1b[35m[ميكو 💓]\x1b[0m` +
            ` نبضات: ${_pingCount}` +
            ` | فشل: ${_pingFails}` +
            ` | ذاكرة: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`
        );
    }, 30 * 60 * 1000);

    console.log(`\x1b[35m[ميكو 💓]\x1b[0m Keep-alive مُفعَّل ✅`);
} else {
    console.log(`\x1b[33m[ميكو ⚠️]\x1b[0m RENDER_EXTERNAL_URL غير محدد — Keep-alive معطل`);
}

module.exports = server;
