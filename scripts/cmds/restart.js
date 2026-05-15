module.exports = {
  config: {
    name: "restart",
    aliases: ["إعادة-تشغيل", "rst", "رست"],
    version: "2.1",
    author: "ميكو",
    countDown: 5,
    role: 2,
    shortDescription: { ar: "إعادة تشغيل البوت" },
    longDescription: { ar: "يقوم بإعادة تشغيل البوت بشكل كامل" },
    category: "نظام",
    guide: { ar: "{pn}" }
  },

  onStart: async function ({ message }) {
    await message.reply(
      "╔═══════════════════╗\n" +
      "║  🔄 إعادة التشغيل  ║\n" +
      "╠═══════════════════╣\n" +
      "║  ⏳ جاري إعادة تشغيل البوت...\n" +
      "║  ✅ سيعود البوت خلال ثوانٍ!\n" +
      "╚═══════════════════╝"
    );
    setTimeout(() => process.exit(2), 2000);
  }
};
