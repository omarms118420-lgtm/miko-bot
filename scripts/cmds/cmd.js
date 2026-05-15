const DEV_ID = "61576232405796";
const path = require("path");
const fs = require("fs-extra");
const axios = require("axios");

module.exports = {
  config: {
    name: "cmd",
    aliases: ["أمر"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 5,
    role: 2,
    shortDescription: { ar: "إدارة ملفات الأوامر" },
    longDescription: { ar: "تحميل أو إزالة أو تثبيت ملفات الأوامر" },
    category: "نظام",
    guide: {
      ar: "   {pn} load [اسم الأمر]: تحميل أمر\n   {pn} loadAll: تحميل جميع الأوامر\n   {pn} install [رابط] [اسم الملف]: تثبيت أمر من رابط"
    }
  },

  onStart: async function ({ message, args }) {
    const type = (args[0] || "").toLowerCase();
    const cmdName = args[1];

    if (!type) return message.reply(
      "╔═══════════════════╗\n" +
      "║  ⚙️ إدارة الأوامر  ║\n" +
      "╠═══════════════════╣\n" +
      "║  -cmd load [اسم]: تحميل أمر\n" +
      "║  -cmd loadAll: تحميل الكل\n" +
      "║  -cmd install [رابط] [اسم]: تثبيت\n" +
      "╚═══════════════════╝"
    );

    if (type === "loadall") {
      await global.GoatBot.loadScripts("cmds");
      return message.reply("✅ تم تحميل جميع الأوامر بنجاح!");
    }

    if (type === "load" && cmdName) {
      try {
        await global.GoatBot.loadScripts("cmds", cmdName);
        return message.reply("✅ تم تحميل الأمر \"" + cmdName + "\" بنجاح!");
      } catch (e) {
        return message.reply("❌ فشل تحميل الأمر \"" + cmdName + "\":\n" + e.message);
      }
    }

    if (type === "install" && args[1] && args[2]) {
      const url = args[1];
      const fileName = args[2].endsWith(".js") ? args[2] : args[2] + ".js";
      try {
        const res = await axios.get(url);
        const filePath = path.join(process.cwd(), "scripts", "cmds", fileName);
        fs.writeFileSync(filePath, res.data);
        return message.reply("✅ تم تثبيت الأمر \"" + fileName + "\" بنجاح!");
      } catch (e) {
        return message.reply("❌ فشل تثبيت الأمر:\n" + e.message);
      }
    }

    return message.reply("⚠️ صياغة خاطئة. أرسل -cmd للمساعدة");
  }
};
