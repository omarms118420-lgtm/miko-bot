const OWNER_ID = "61576232405796";

module.exports = {
  config: {
    name: "إلغاء-تقييد",
    aliases: ["الغاء-تقييد", "فتح-البوت", "unlock"],
    version: "1.0",
    author: "ميكو",
    countDown: 0,
    role: 2,
    shortDescription: { ar: "إلغاء تقييد البوت" },
    longDescription: { ar: "يُعيد البوت للعمل الطبيعي والرد على الجميع" },
    category: "نظام",
    guide: { ar: "{pn}" }
  },

  onStart: async function ({ message, event }) {
    const { senderID } = event;

    if (senderID !== OWNER_ID) {
      return message.reply("❌ هذا الأمر للمالك فقط.");
    }

    global.botLockdown = false;
    global.botLockdownOwner = null;

    return message.reply(
      "╔═══════════════════╗\n" +
      "║  ✅ تم إلغاء التقييد  ║\n" +
      "╠═══════════════════╣\n" +
      "║  البوت يرد على الجميع الآن\n" +
      "╚═══════════════════╝"
    );
  }
};
