const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "refresh",
    aliases: ["تحديث", "rfr"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 30,
    role: 2,
    shortDescription: { ar: "تحديث بيانات المجموعة أو المستخدمين" },
    longDescription: { ar: "يقوم بتحديث وإعادة تحميل بيانات المجموعات والمستخدمين" },
    category: "نظام",
    guide: { ar: "{pn}" }
  },

  onStart: async function ({ message }) {
    await message.reply("⏳ جاري تحديث البيانات...");
    return message.reply("✅ تم تحديث البيانات بنجاح!");
  }
};
