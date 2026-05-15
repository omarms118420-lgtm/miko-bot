const axios = require("axios");
const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "translate",
    aliases: ["ترجمة", "tr"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 3,
    role: 0,
    shortDescription: { ar: "ترجمة النصوص" },
    longDescription: { ar: "يترجم النص إلى اللغة المطلوبة" },
    category: "أدوات",
    guide: { ar: "{pn} [كود اللغة] [النص]\nمثال: {pn} en مرحبا" }
  },

  onStart: async function ({ message, args, event }) {
    if (args.length < 2) return message.reply("⚠️ الاستخدام: -translate [كود اللغة] [النص]\nمثال: -translate en مرحبا");
    const lang = args[0];
    const text = args.slice(1).join(" ");
    try {
      const res = await axios.get(
        "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=" +
        encodeURIComponent(lang) + "&dt=t&q=" + encodeURIComponent(text)
      );
      const translated = res.data[0].map(d => d[0]).join("");
      return message.reply(
        "╔═══════════════════╗\n" +
        "║  🌐 الترجمة  ║\n" +
        "╠═══════════════════╣\n" +
        "║  📝 الأصلي : " + text + "\n" +
        "║  ✅ الترجمة : " + translated + "\n" +
        "╚═══════════════════╝"
      );
    } catch (e) {
      return message.reply("❌ حدث خطأ أثناء الترجمة");
    }
  }
};
