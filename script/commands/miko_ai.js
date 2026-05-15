const axios  = require('axios');
const fs     = require('fs-extra');
const path   = require('path');

module.exports.config = {
    title:     "ميكو",
    release:   "1.0.0",
    clearance: 2,
    author:    "Miko AI",
    summary:   "ذكاء اصطناعي يولد أوامر جاهزة ويحفظها في النظام تلقائياً",
    section:   "الــمـطـور",
    syntax:    "ميكو [وصف الأمر] | ميكو قائمة | ميكو حذف [اسم]",
    delay:     30,
};

/* ===== helpers ===== */
const MIKO_LOG = path.join(__dirname, "cache", "miko_created.json");

function loadLog() {
    try { return JSON.parse(fs.readFileSync(MIKO_LOG, "utf-8")); }
    catch { return []; }
}
function saveLog(arr) {
    fs.ensureDirSync(path.dirname(MIKO_LOG));
    fs.writeFileSync(MIKO_LOG, JSON.stringify(arr, null, 2), "utf-8");
}

const getBase = async () => {
    const r = await axios.get(
        "https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json",
        { timeout: 10000 }
    );
    return r.data.mahmud;
};

/* ===== system prompt ===== */
const SYS_PROMPT = `You are Miko AI, an expert command generator for a Facebook Messenger GoatBot V2 bot.
Always return ONLY valid JavaScript inside a single \`\`\`javascript block, no extra text.

Required structure:
\`\`\`javascript
const axios = require('axios');
const fs    = require('fs-extra');
const path  = require('path');

module.exports.config = {
    title:     "Arabic command name",
    release:   "1.0.0",
    clearance: 0,
    author:    "Miko AI",
    summary:   "description",
    section:   "general",
    syntax:    "name [input]",
    delay:     5,
};

module.exports.HakimRun = async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    try {
        // logic here
    } catch(e) {
        return api.sendMessage("Error: " + e.message, threadID, messageID);
    }
};
\`\`\`

Rules:
- clearance: 0=all users, 1=group admin, 2=bot developer
- Only use available packages: axios, fs-extra, path, moment-timezone
- Return ONLY the code block, nothing else`;

/* ===== main command ===== */
module.exports.HakimRun = async function({ api, event, args }) {
    const { threadID, messageID } = event;

    /* ── no args: show help ── */
    if (!args.length) {
        const log = loadLog();
        return api.sendMessage(
            "╔════════════════════╗\n" +
            "║  🤖  ميكو AI - مولّد الأوامر  ║\n" +
            "╚════════════════════╝\n\n" +
            "الاستخدام:\n" +
            "• ميكو [وصف الأمر] — ينشئ أمراً ويحفظه\n" +
            "• ميكو قائمة — الأوامر المنشأة\n" +
            "• ميكو حذف [اسم] — حذف أمر منشأ\n\n" +
            "أمثلة:\n" +
            "🔸 ميكو أمر يعرض نكتة عشوائية\n" +
            "🔸 ميكو أمر يحسب العمر من تاريخ الميلاد\n" +
            "🔸 ميكو أمر يترجم النص للإنجليزية\n" +
            "🔸 ميكو أمر يعرض حظ اليوم\n\n" +
            "📦 الأوامر المنشأة: " + log.length,
            threadID, messageID
        );
    }

    /* ── list ── */
    if (args[0] === "قائمة") {
        const log = loadLog();
        if (!log.length)
            return api.sendMessage("📭 لا توجد أوامر منشأة بعد.\nاستخدم: ميكو [وصف الأمر]", threadID, messageID);
        let msg = "🤖 أوامر ميكو AI (" + log.length + "):\n\n";
        log.forEach((item, i) => {
            msg += (i + 1) + ". " + item.title + "\n";
            msg += "   📁 " + item.file + "\n";
            msg += "   📅 " + new Date(item.date).toLocaleDateString("ar") + "\n";
            msg += "   💬 " + (item.desc || "") + "\n\n";
        });
        return api.sendMessage(msg, threadID, messageID);
    }

    /* ── delete ── */
    if (args[0] === "حذف") {
        const name = args.slice(1).join(" ");
        if (!name)
            return api.sendMessage("❌ أدخل اسم الأمر للحذف.\nمثال: ميكو حذف نكتة", threadID, messageID);
        const log = loadLog();
        const idx = log.findIndex(x => x.title === name || x.file === name + ".js");
        if (idx === -1)
            return api.sendMessage(`❌ لم يوجد أمر باسم "${name}".\nاستخدم: ميكو قائمة`, threadID, messageID);
        const item = log[idx];
        try { fs.removeSync(path.join(__dirname, item.file)); } catch {}
        try { Mirror?.client?.commands?.delete(item.title); } catch {}
        log.splice(idx, 1);
        saveLog(log);
        return api.sendMessage(`✅ تم حذف الأمر "${item.title}" بنجاح.`, threadID, messageID);
    }

    /* ── generate ── */
    const desc = args.join(" ");
    api.setMessageReaction("⏳", messageID, () => {}, true);
    api.sendMessage(
        "🤖 ميكو تعمل على إنشاء:\n\"" + desc + "\"\nيرجى الانتظار 15-30 ثانية...",
        threadID
    );

    try {
        const baseUrl = await getBase();
        const resp    = await axios.post(
            `${baseUrl}/api/gemini`,
            { prompt: SYS_PROMPT + "\n\nUser request (in Arabic): " + desc },
            { timeout: 50000 }
        );

        let code = resp.data?.reply
                || resp.data?.response
                || resp.data?.text
                || resp.data?.message
                || "";

        /* extract from markdown block */
        const m = code.match(/```(?:javascript|js)?\n?([\s\S]*?)```/);
        if (m) code = m[1].trim();

        if (!code || !code.includes("module.exports.HakimRun")) {
            api.setMessageReaction("❌", messageID, () => {}, true);
            return api.sendMessage(
                "❌ فشل توليد الكود.\nحاول مرة أخرى بوصف أوضح، مثل:\nميكو أمر يعرض نكتة عشوائية",
                threadID, messageID
            );
        }

        /* extract title */
        const titleM   = code.match(/title\s*:\s*["'`](.+?)["'`]/);
        const cmdTitle = titleM?.[1] ?? "ميكو_" + Date.now();
        const fileName = cmdTitle.replace(/[\/\\:*?"<>|\s]/g, "_") + ".js";
        const cmdPath  = path.join(__dirname, fileName);

        /* save file */
        fs.writeFileSync(cmdPath, code, "utf-8");

        /* hot-load */
        let loaded = false, loadErr = "";
        try {
            delete require.cache[require.resolve(cmdPath)];
            const nc = require(cmdPath);
            if (nc?.config?.title && typeof nc.HakimRun === "function") {
                Mirror.client.commands.set(nc.config.title, nc);
                loaded = true;
            }
        } catch(e) { loadErr = e.message.slice(0, 120); }

        /* save log */
        const log = loadLog();
        log.push({ title: cmdTitle, file: fileName, date: Date.now(), desc });
        saveLog(log);

        /* reply */
        const preview = code.length > 600 ? code.slice(0, 600) + "\n..." : code;
        api.setMessageReaction("✅", messageID, () => {}, true);
        return api.sendMessage(
            "✅ تم إنشاء الأمر بنجاح!\n\n" +
            "📋 الاسم : " + cmdTitle + "\n" +
            "📁 الملف : " + fileName + "\n" +
            (loaded
                ? "⚡ حُمِّل مباشرةً في النظام! جرّبه الآن."
                : "🔄 سيُفعّل عند إعادة التشغيل." + (loadErr ? "\n⚠️ " + loadErr : "")) + "\n\n" +
            "━━━━━ الكود المولّد ━━━━━\n" + preview,
            threadID, messageID
        );

    } catch(e) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("❌ خطأ: " + e.message, threadID, messageID);
    }
};
