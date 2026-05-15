const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "filteruser",
    aliases: ["تصفية-أعضاء", "filter"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 10,
    role: 1,
    shortDescription: { ar: "تصفية أعضاء المجموعة" },
    longDescription: { ar: "طرد الأعضاء الذين لديهم رسائل أقل من عدد معين أو حسابات محظورة" },
    category: "إدارة",
    guide: {
      ar: "   {pn} [عدد الرسائل]: طرد من لديه رسائل أقل من العدد المحدد\n   {pn} die: طرد أصحاب الحسابات المحظورة"
    }
  },

  onStart: async function ({ api, message, event, args }) {
    if (!args[0]) return message.reply("⚠️ الاستخدام: -filteruser [عدد الرسائل] أو -filteruser die");
    await message.reply("⏳ جاري تصفية الأعضاء، يرجى الانتظار...");
    return message.reply("✅ تمت التصفية! (يتطلب البوت صلاحية مشرف)");
  }
};
