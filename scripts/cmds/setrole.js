const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "setrole",
    aliases: ["تعيين-دور"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 3,
    role: 2,
    shortDescription: { ar: "تعديل صلاحية أمر" },
    longDescription: { ar: "تعديل صلاحية استخدام أمر معين في المجموعة" },
    category: "نظام",
    guide: {
      ar: "   {pn} [اسم الأمر] [الدور]: تعيين الدور\n   الأدوار: 0 (الجميع), 1 (المشرف), default (الافتراضي)"
    }
  },

  onStart: async function ({ message, args }) {
    if (args.length < 2) return message.reply("⚠️ الاستخدام: -setrole [اسم الأمر] [الدور]");
    const cmdName = args[0].toLowerCase();
    const role = args[1];
    const cmd = global.GoatBot?.commands?.get(cmdName);
    if (!cmd) return message.reply("❌ الأمر \"" + cmdName + "\" غير موجود");
    if (role === "default") {
      delete cmd.config.roleCustom;
      return message.reply("✅ تمت إعادة تعيين صلاحية الأمر \"" + cmdName + "\" للافتراضي");
    }
    const roleNum = parseInt(role);
    if (isNaN(roleNum) || roleNum < 0 || roleNum > 2) return message.reply("⚠️ الدور يجب أن يكون 0 أو 1 أو default");
    cmd.config.roleCustom = roleNum;
    return message.reply("✅ تم تعيين صلاحية الأمر \"" + cmdName + "\" إلى: " + roleNum);
  }
};
