const axios = require('axios');
const { config } = global.GoatBot;
const { log, getText } = global.utils;

if (global.timeOutUptime != undefined)
        clearTimeout(global.timeOutUptime);
if (!config.autoUptime.enable)
        return;

const PORT = config.dashBoard?.port || (!isNaN(config.serverUptime?.port) && config.serverUptime?.port) || 5000;

// اكتشاف الرابط الخارجي تلقائياً
let myUrl =
        config.autoUptime.url?.trim() ||
        (process.env.REPLIT_DEV_DOMAIN
                ? `https://${process.env.REPLIT_DEV_DOMAIN}`
                : process.env.REPL_SLUG && process.env.REPL_OWNER
                        ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
                        : process.env.API_SERVER_EXTERNAL == "https://api.glitch.com"
                                ? `https://${process.env.PROJECT_DOMAIN}.glitch.me`
                                : `http://localhost:${PORT}`);

myUrl = myUrl.replace(/\/$/, "");
myUrl += "/uptime";

const interval = (config.autoUptime.timeInterval || 120) * 1000;

let status = "ok";
let failCount = 0;

async function autoUptime() {
        try {
                await axios.get(myUrl, { timeout: 15000 });
                failCount = 0;
                if (status !== "ok") {
                        status = "ok";
                        log.info("AUTO UPTIME", "✅ البوت عاد للعمل");
                }
        } catch (e) {
                failCount++;
                if (status === "ok") {
                        status = "failed";
                        log.err("AUTO UPTIME", `⚠️ فشل البينغ (${failCount}) — ${myUrl}`);
                }
                // إذا فشل 3 مرات متتالية — حاول إعادة الاتصال
                if (failCount >= 3) {
                        failCount = 0;
                        status = "ok";
                }
        }
}

// أول بينغ بعد دقيقة
setTimeout(() => {
        autoUptime();
        global.timeOutUptime = setInterval(autoUptime, interval);
}, 60000);

log.info("AUTO UPTIME", `💓 نظام البقاء نشطاً يعمل كل ${interval / 1000}ث → ${myUrl}`);
