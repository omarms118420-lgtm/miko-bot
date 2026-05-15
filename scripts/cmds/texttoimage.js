const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "texttoimage", aliases: ["نص-إلى-صورة", "tti"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 5, role: 0, shortDescription: { ar: "تحويل النص إلى صورة" }, category: "أدوات", guide: { ar: "{pn} [النص]" } },
  onStart: async function ({ message, args }) {
    if (!args.length) return message.reply("⚠️ يرجى إدخال النص");
    return message.reply("⏳ جاري تحويل النص إلى صورة...\n(الخدمة قيد الإعداد)");
  }
};
