const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "loadconfig", aliases: ["تحميل-إعدادات"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 10, role: 2, shortDescription: { ar: "إعادة تحميل ملف الإعدادات" }, category: "نظام", guide: { ar: "{pn}" } },
  onStart: async function ({ message }) { try { global.GoatBot.config = JSON.parse(require("fs").readFileSync(process.cwd() + "/config.json", "utf-8")); return message.reply("✅ تم إعادة تحميل ملف الإعدادات بنجاح!"); } catch(e) { return message.reply("❌ فشل تحميل الإعدادات:\n" + e.message); } }
};
