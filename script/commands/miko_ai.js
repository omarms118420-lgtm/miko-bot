const axios  = require('axios');
const fs     = require('fs-extra');
const path   = require('path');

module.exports.config = {
    title:     "ميكو",
    release:   "2.0.0",
    clearance: 2,
    author:    "Miko AI v2",
    summary:   "ذكاء اصطناعي متطور يولد أوامر احترافية ويحفظها في النظام",
    section:   "الــمـطـور",
    syntax:    "ميكو [وصف] | ميكو قائمة | ميكو حذف [اسم] | ميكو مفتاح [api key]",
    delay:     30,
};

/* ══════════════════════════════════════════════
   Config & Helpers
   ══════════════════════════════════════════════ */
const CFG_FILE  = path.join(__dirname, "cache", "miko_cfg.json");
const LOG_FILE  = path.join(__dirname, "cache", "miko_created.json");

function loadCfg()  { try { return JSON.parse(fs.readFileSync(CFG_FILE, "utf-8")); } catch { return {}; } }
function saveCfg(o) { fs.ensureDirSync(path.dirname(CFG_FILE)); fs.writeFileSync(CFG_FILE, JSON.stringify(o, null, 2)); }
function loadLog()  { try { return JSON.parse(fs.readFileSync(LOG_FILE, "utf-8")); } catch { return []; } }
function saveLog(a) { fs.ensureDirSync(path.dirname(LOG_FILE)); fs.writeFileSync(LOG_FILE, JSON.stringify(a, null, 2)); }

/* ══════════════════════════════════════════════
   Gemini Direct API (powerful, accurate)
   ══════════════════════════════════════════════ */
async function callGemini(apiKey, prompt) {
    const models = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash"
    ];
    for (const model of models) {
        try {
            const res = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
                {
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.2,
                        topP: 0.8,
                        maxOutputTokens: 8192
                    }
                },
                {
                    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
                    timeout: 60000
                }
            );
            const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (text) return { text, model };
        } catch(e) {
            if (e.response?.status === 429 || e.response?.status === 503) continue;
            throw e;
        }
    }
    throw new Error("فشلت جميع نماذج Gemini");
}

/* Fallback: proxy API */
async function callProxy(prompt) {
    const r = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json", { timeout: 8000 });
    const base = r.data.mahmud;
    const res  = await axios.post(`${base}/api/gemini`, { prompt }, { timeout: 45000 });
    const text = res.data?.reply || res.data?.response || res.data?.text || res.data?.message || "";
    return { text, model: "proxy" };
}

/* ══════════════════════════════════════════════
   System Prompt (very detailed for high quality)
   ══════════════════════════════════════════════ */
const SYSTEM_PROMPT = `You are Miko AI v2, an elite command generator for a Facebook Messenger bot (GoatBot V2 modified).
Your task: generate complete, production-ready JavaScript bot commands.

## BOT API Reference:
- \`api.sendMessage(body, threadID, callback?, messageID?)\` — send text/attachment
- \`api.sendMessage({ body: "text", attachment: stream }, threadID)\` — send with image
- \`api.setMessageReaction("emoji", messageID, cb, true)\` — react to message
- \`event.threadID\` — group/chat ID
- \`event.messageID\` — message ID
- \`event.senderID\` — sender's Facebook ID
- \`event.body\` — full message text
- \`args\` — array of words after command name
- \`Mirror.client.commands\` — all loaded commands Map

## EXACT Required Structure:
\`\`\`javascript
const axios = require('axios');
const fs    = require('fs-extra');
const path  = require('path');

module.exports.config = {
    title:     "اسم الأمر",         // Arabic name used to trigger command
    release:   "1.0.0",
    clearance: 0,                    // 0=all, 1=group admin, 2=bot dev
    author:    "Miko AI",
    summary:   "وصف الأمر",
    section:   "عـــامـة",
    syntax:    "الاسم [مدخل]",
    delay:     5,                    // cooldown seconds
};

module.exports.HakimRun = async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    try {
        // === command logic here ===
        return api.sendMessage("النتيجة", threadID, messageID);
    } catch(e) {
        return api.sendMessage("❌ خطأ: " + e.message, threadID, messageID);
    }
};
\`\`\`

## Available packages (ONLY these):
- axios (HTTP requests)
- fs-extra, path (file system)
- moment-timezone (dates)
- canvas (image generation - use sparingly)

## EXAMPLE commands for reference:

### Simple: Random joke
\`\`\`javascript
const axios = require('axios');
module.exports.config = { title: "نكتة", release: "1.0.0", clearance: 0, author: "Miko AI", summary: "نكتة عشوائية", section: "عـــامـة", syntax: "نكتة", delay: 5 };
module.exports.HakimRun = async function({ api, event }) {
    const { threadID, messageID } = event;
    try {
        const res = await axios.get("https://v2.jokeapi.dev/joke/Any?lang=ar&type=single", { timeout: 10000 });
        const joke = res.data?.joke || "لا توجد نكتة الآن 😅";
        return api.sendMessage("😂 نكتة اليوم:\n\n" + joke, threadID, messageID);
    } catch(e) {
        return api.sendMessage("❌ خطأ: " + e.message, threadID, messageID);
    }
};
\`\`\`

### Medium: Age calculator
\`\`\`javascript
const moment = require('moment-timezone');
module.exports.config = { title: "عمري", release: "1.0.0", clearance: 0, author: "Miko AI", summary: "حساب العمر", section: "عـــامـة", syntax: "عمري [YYYY-MM-DD]", delay: 5 };
module.exports.HakimRun = async function({ api, event, args }) {
    const { threadID, messageID } = event;
    if (!args[0]) return api.sendMessage("📅 أدخل تاريخ الميلاد\nمثال: عمري 2000-05-15", threadID, messageID);
    const birth = moment(args[0], "YYYY-MM-DD");
    if (!birth.isValid()) return api.sendMessage("❌ تاريخ غير صحيح. استخدم: YYYY-MM-DD", threadID, messageID);
    const now = moment();
    const years = now.diff(birth, "years"); birth.add(years, "years");
    const months = now.diff(birth, "months"); birth.add(months, "months");
    const days = now.diff(birth, "days");
    return api.sendMessage(\`🎂 عمرك:\n\n📆 \${years} سنة و \${months} شهر و \${days} يوم\`, threadID, messageID);
};
\`\`\`

## STRICT Rules:
1. Return ONLY the JavaScript code block — zero extra text
2. The code must be complete and runnable immediately
3. Always wrap in try/catch
4. Always use async/await for HTTP requests
5. Command title MUST be in Arabic
6. Add loading reaction with: \`api.setMessageReaction("⏳", messageID, () => {}, true);\`
7. Add success reaction: \`api.setMessageReaction("✅", messageID, () => {}, true);\`
8. Handle edge cases (empty args, invalid input, API errors)
9. Use free public APIs when possible
10. Code must be production-ready, not a skeleton

Now generate the command. Return ONLY the \`\`\`javascript block:`;

/* ══════════════════════════════════════════════
   Code Validator & Extractor
   ══════════════════════════════════════════════ */
function extractCode(raw) {
    /* try fenced block first */
    let m = raw.match(/```(?:javascript|js|node)?\n?([\s\S]*?)```/);
    if (m) return m[1].trim();
    /* fallback: find module.exports */
    const idx = raw.indexOf("module.exports.config");
    if (idx !== -1) return raw.slice(idx).trim();
    return null;
}

function validateCode(code) {
    const errors = [];
    if (!code.includes("module.exports.config"))  errors.push("missing module.exports.config");
    if (!code.includes("module.exports.HakimRun")) errors.push("missing module.exports.HakimRun");
    if (!code.includes("title"))                   errors.push("missing title");
    if (!code.includes("async function"))          errors.push("HakimRun must be async");
    return errors;
}

/* Auto-fix common issues */
function fixCode(code) {
    /* ensure try/catch exists */
    if (!code.includes("try {") && !code.includes("try{")) {
        code = code.replace(
            /module\.exports\.HakimRun\s*=\s*async\s*function[^{]*{/,
            (match) => match + "\n    try {"
        );
        /* close the try block before last } */
        const last = code.lastIndexOf("}");
        if (last !== -1) {
            code = code.slice(0, last) + "    } catch(e) {\n        return api.sendMessage('❌ خطأ: ' + e.message, event.threadID, event.messageID);\n    }\n}";
        }
    }
    return code;
}

/* ══════════════════════════════════════════════
   Main Command
   ══════════════════════════════════════════════ */
module.exports.HakimRun = async function({ api, event, args }) {
    const { threadID, messageID } = event;
    const cfg = loadCfg();

    /* ── set API key ── */
    if (args[0] === "مفتاح") {
        const key = args[1];
        if (!key || !key.startsWith("AIza"))
            return api.sendMessage("❌ مفتاح غير صحيح.\nالمفتاح يبدأ بـ AIza\nاحصل عليه من: https://aistudio.google.com/app/apikey", threadID, messageID);
        cfg.geminiKey = key;
        saveCfg(cfg);
        return api.sendMessage("✅ تم حفظ مفتاح Gemini API!\nالآن ميكو ستستخدم Gemini 2.5 Flash المتطور.", threadID, messageID);
    }

    /* ── no args ── */
    if (!args.length) {
        const log   = loadLog();
        const hasKey = !!cfg.geminiKey;
        return api.sendMessage(
            "╔══════════════════════════╗\n" +
            "║  🤖  ميكو AI v2 - مولّد الأوامر  ║\n" +
            "╚══════════════════════════╝\n\n" +
            "الحالة: " + (hasKey ? "⚡ Gemini 2.5 Flash (متطور)" : "🔄 وضع الوكيل") + "\n\n" +
            "الأوامر:\n" +
            "• ميكو [وصف] — إنشاء أمر جديد\n" +
            "• ميكو قائمة — عرض الأوامر المنشأة\n" +
            "• ميكو حذف [اسم] — حذف أمر\n" +
            "• ميكو مفتاح [AIza...] — ربط Gemini API\n\n" +
            "أمثلة:\n" +
            "🔸 ميكو أمر يعرض نكتة عشوائية\n" +
            "🔸 ميكو أمر يحسب العمر\n" +
            "🔸 ميكو أمر يترجم النص للإنجليزية\n" +
            "🔸 ميكو أمر يعرض معلومات عن أي دولة\n" +
            "🔸 ميكو أمر يعرض أسعار العملات\n\n" +
            "📦 الأوامر المنشأة: " + log.length + "\n\n" +
            (hasKey ? "" : "💡 لتفعيل Gemini المتطور:\nميكو مفتاح [AIzaXXXXXXXXXXXXXXXXXXX]\nاحصل على مفتاح مجاني: https://aistudio.google.com/app/apikey"),
            threadID, messageID
        );
    }

    /* ── list ── */
    if (args[0] === "قائمة") {
        const log = loadLog();
        if (!log.length)
            return api.sendMessage("📭 لا توجد أوامر منشأة.\nاستخدم: ميكو [وصف الأمر]", threadID, messageID);
        let msg = "🤖 أوامر ميكو AI (" + log.length + "):\n\n";
        log.forEach((item, i) => {
            msg += `${i + 1}. ${item.title}\n`;
            msg += `   📁 ${item.file}\n`;
            msg += `   🤖 ${item.model || "proxy"}\n`;
            msg += `   📅 ${new Date(item.date).toLocaleDateString("ar")}\n\n`;
        });
        return api.sendMessage(msg, threadID, messageID);
    }

    /* ── delete ── */
    if (args[0] === "حذف") {
        const name = args.slice(1).join(" ");
        if (!name) return api.sendMessage("❌ أدخل اسم الأمر.\nمثال: ميكو حذف نكتة", threadID, messageID);
        const log = loadLog();
        const idx = log.findIndex(x => x.title === name || x.file === name + ".js");
        if (idx === -1) return api.sendMessage(`❌ لم يوجد أمر "${name}".\nاستخدم: ميكو قائمة`, threadID, messageID);
        const item = log[idx];
        try { fs.removeSync(path.join(__dirname, item.file)); } catch {}
        try { Mirror?.client?.commands?.delete(item.title); } catch {}
        log.splice(idx, 1);
        saveLog(log);
        return api.sendMessage(`✅ تم حذف "${item.title}" بنجاح.`, threadID, messageID);
    }

    /* ══════════════════════════════════════════
       GENERATE COMMAND
       ══════════════════════════════════════════ */
    const desc = args.join(" ");
    api.setMessageReaction("⏳", messageID, () => {}, true);
    const cfg2 = loadCfg();

    api.sendMessage(
        "🤖 ميكو AI v2 تعمل...\n" +
        "📝 الطلب: " + desc + "\n" +
        "🧠 النموذج: " + (cfg2.geminiKey ? "Gemini 2.5 Flash" : "وكيل ذكي") + "\n" +
        "⏱️ انتظر 15-40 ثانية...",
        threadID
    );

    let result, usedModel;
    const fullPrompt = SYSTEM_PROMPT + "\n\nGenerate this command: " + desc;

    /* Try Gemini direct first, then fallback */
    try {
        if (cfg2.geminiKey) {
            result = await callGemini(cfg2.geminiKey, fullPrompt);
        } else {
            result = await callProxy(fullPrompt);
        }
        usedModel = result.model;
    } catch(e1) {
        /* fallback to proxy if Gemini fails */
        try {
            result = await callProxy(fullPrompt);
            usedModel = "proxy-fallback";
        } catch(e2) {
            api.setMessageReaction("❌", messageID, () => {}, true);
            return api.sendMessage("❌ فشل الاتصال بالذكاء الاصطناعي.\n" + e2.message, threadID, messageID);
        }
    }

    /* Extract & validate code */
    let code = extractCode(result.text);

    if (!code) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("❌ لم يُولَّد كود صحيح.\nحاول بوصف أوضح.\nمثال: ميكو أمر يعرض نكتة عشوائية", threadID, messageID);
    }

    /* Auto-fix code */
    code = fixCode(code);
    const errors = validateCode(code);

    if (errors.length > 0 && cfg2.geminiKey) {
        /* Ask AI to fix errors */
        try {
            const fixPrompt = SYSTEM_PROMPT + "\n\nThe previous code had these errors: " + errors.join(", ") + "\nFix and regenerate for: " + desc;
            const fixResult = await callGemini(cfg2.geminiKey, fixPrompt);
            const fixedCode = extractCode(fixResult.text);
            if (fixedCode && validateCode(fixedCode).length === 0) {
                code = fixedCode;
            }
        } catch {}
    }

    /* Get command title */
    const titleM   = code.match(/title\s*:\s*["'`](.+?)["'`]/);
    const cmdTitle = titleM?.[1] ?? "ميكو_" + Date.now();
    const fileName = cmdTitle.replace(/[\/\\:*?"<>|\s]/g, "_") + ".js";
    const cmdPath  = path.join(__dirname, fileName);

    /* Save file */
    fs.writeFileSync(cmdPath, code, "utf-8");

    /* Hot-load */
    let loaded = false, loadErr = "";
    try {
        delete require.cache[require.resolve(cmdPath)];
        const nc = require(cmdPath);
        if (nc?.config?.title && typeof nc.HakimRun === "function") {
            Mirror.client.commands.set(nc.config.title, nc);
            loaded = true;
        }
    } catch(e) { loadErr = e.message.slice(0, 150); }

    /* Log */
    const log = loadLog();
    log.push({ title: cmdTitle, file: fileName, date: Date.now(), desc, model: usedModel });
    saveLog(log);

    /* Reply */
    const preview = code.length > 700 ? code.slice(0, 700) + "\n..." : code;
    api.setMessageReaction("✅", messageID, () => {}, true);
    return api.sendMessage(
        "✅ أمر جديد أنشأته ميكو AI!\n\n" +
        "📋 الاسم  : " + cmdTitle + "\n" +
        "📁 الملف  : " + fileName + "\n" +
        "🧠 النموذج: " + usedModel + "\n" +
        (loaded
            ? "⚡ يعمل الآن! جرّبه مباشرةً."
            : "🔄 سيُفعّل عند إعادة التشغيل." + (loadErr ? "\n⚠️ " + loadErr : "")) + "\n\n" +
        "━━━━━ الكود ━━━━━\n" + preview,
        threadID, messageID
    );
};
