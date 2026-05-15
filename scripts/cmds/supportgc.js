const DEV_ID = "61576232405796";
const BOT_NAME = "ميكو";

module.exports = {
  config: {
    name: "supportgc",
    aliases: ["دعم", "support"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 5,
    role: 0,
    shortDescription: { ar: "رابط مجموعة الدعم" },
    longDescription: { ar: "يعرض رابط مجموعة دعم البوت" },
    category: "معلومات",
    guide: { ar: "{pn}" }
  },

  onStart: async function ({ message }) {
    return message.reply(
      "╔═══════════════════╗\n" +
      "║  💬 مجموعة الدعم  ║\n" +
      "╠═══════════════════╣\n" +
      "║  🤖 بوت : " + BOT_NAME + "\n" +
      "╠═══════════════════╣\n" +
      "║  استخدم: -callad [رسالتك]\n" +
      "║  للتواصل مباشرة مع المشرف\n" +
      "╚═══════════════════╝"
    );
  }
};
