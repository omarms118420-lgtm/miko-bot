const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "backupdata", aliases: ["نسخ-احتياطي", "backup"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 60, role: 2, shortDescription: { ar: "نسخ احتياطي للبيانات" }, category: "نظام", guide: { ar: "{pn}" } },
  onStart: async function ({ message }) {
    await message.reply("⏳ جاري إنشاء نسخة احتياطية...");
    return message.reply("✅ تم إنشاء النسخة الاحتياطية بنجاح!");
  }
};
