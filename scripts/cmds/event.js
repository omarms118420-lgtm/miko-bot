const DEV_ID = "61576232405796";
const axios = require("axios");
const path = require("path");
const fs = require("fs-extra");
module.exports = {
  config: { name: "event", aliases: ["حدث"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 5, role: 2, shortDescription: { ar: "إدارة ملفات الأحداث" }, category: "نظام", guide: { ar: "{pn} load [اسم]: تحميل\n{pn} loadAll: تحميل الكل\n{pn} install [رابط] [اسم]: تثبيت" } },
  onStart: async function ({ message, args }) {
    const type = (args[0] || "").toLowerCase();
    if (!type) return message.reply("⚠️ الاستخدام: -event load/loadAll/install");
    if (type === "loadall") { await global.GoatBot?.loadScripts("events"); return message.reply("✅ تم تحميل جميع الأحداث!"); }
    if (type === "load" && args[1]) { try { await global.GoatBot?.loadScripts("events", args[1]); return message.reply("✅ تم تحميل الحدث \"" + args[1] + "\""); } catch(e) { return message.reply("❌ فشل تحميل الحدث:\n" + e.message); } }
    if (type === "install" && args[1] && args[2]) {
      const url = args[1]; const fileName = args[2].endsWith(".js") ? args[2] : args[2] + ".js";
      try { const res = await axios.get(url); fs.writeFileSync(path.join(process.cwd(), "scripts", "events", fileName), res.data); return message.reply("✅ تم تثبيت الحدث: " + fileName); } catch(e) { return message.reply("❌ فشل التثبيت:\n" + e.message); }
    }
    return message.reply("⚠️ صياغة خاطئة");
  }
};
