const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "setlang",
    aliases: ["لغة", "lang"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 3,
    role: 2,
    shortDescription: { ar: "تغيير لغة البوت" },
    longDescription: { ar: "يغير لغة واجهة البوت" },
    category: "نظام",
    guide: { ar: "{pn} ar: عربي\n{pn} en: إنجليزي" }
  },

  onStart: async function ({ message, args }) {
    const lang = args[0];
    if (!lang) return message.reply(
      "╔═══════════════════╗\n" +
      "║  🌐 لغة البوت الحالية  ║\n" +
      "╠═══════════════════╣\n" +
      "║  اللغة الحالية : " + (global.GoatBot?.config?.language || "en") + "\n" +
      "║  اللغات المتاحة : ar, en\n" +
      "╚═══════════════════╝"
    );
    const validLangs = ["ar", "en", "vi"];
    if (!validLangs.includes(lang)) return message.reply("❌ اللغة غير متاحة. الخيارات: ar, en");
    global.GoatBot.config.language = lang;
    return message.reply("✅ تم تغيير لغة البوت إلى: " + lang);
  }
};
