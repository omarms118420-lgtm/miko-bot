const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "setalias", aliases: ["تعيين-اسم-بديل"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 3, role: 2, shortDescription: { ar: "تعيين اسم بديل لأمر" }, category: "نظام", guide: { ar: "{pn} [الأمر] [الاسم البديل]" } },
  onStart: async function ({ message, args }) {
    if (args.length < 2) return message.reply("⚠️ الاستخدام: -setalias [الأمر] [الاسم البديل]");
    const cmd = args[0]; const alias = args[1];
    const cmdObj = global.GoatBot?.commands?.get(cmd);
    if (!cmdObj) return message.reply("❌ الأمر \"" + cmd + "\" غير موجود");
    global.GoatBot.aliases.set(alias, cmd);
    return message.reply("✅ تم تعيين الاسم البديل \"" + alias + "\" للأمر \"" + cmd + "\"");
  }
};
