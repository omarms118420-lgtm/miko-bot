const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "eval",
    aliases: ["كود", "ev"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 5,
    role: 2,
    shortDescription: { ar: "اختبار كود JavaScript" },
    longDescription: { ar: "تنفيذ كود JavaScript مباشرة عبر البوت" },
    category: "نظام",
    guide: { ar: "{pn} [الكود]" }
  },

  onStart: async function ({ message, args }) {
    if (!args.length) return message.reply("⚠️ يرجى إدخال الكود");
    try {
      let result = eval(args.join(" "));
      if (result instanceof Promise) result = await result;
      return message.reply(
        "╔═══════════════════╗\n" +
        "║  💻 نتيجة الكود  ║\n" +
        "╠═══════════════════╣\n" +
        "║  " + String(result).substring(0, 500) + "\n" +
        "╚═══════════════════╝"
      );
    } catch (e) {
      return message.reply("❌ خطأ:\n" + e.message);
    }
  }
};
