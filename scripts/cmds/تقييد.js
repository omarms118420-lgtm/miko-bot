const OWNER_ID = "61576232405796";

module.exports = {
  config: {
    name: "تقييد",
    aliases: ["lockdown", "قفل"],
    version: "2.0",
    author: "ميكو",
    countDown: 0,
    role: 2,
    shortDescription: { ar: "تقييد البوت للمالك فقط" },
    longDescription: { ar: "يوقف البوت عن الرد على أي شخص ما عدا المالك حتى يتم إلغاء التقييد" },
    category: "نظام",
    guide: { ar: "{pn} — تفعيل التقييد\n{pn} إلغاء — إلغاء التقييد" }
  },

  onStart: async function ({ message, event, args }) {
    const { senderID } = event;

    if (senderID !== OWNER_ID) {
      return; // صمت تام للغير مالك
    }

    const sub = (args[0] || "").trim();
    const isUnlock = ["إلغاء", "الغاء", "فتح", "off", "cancel"].includes(sub);

    if (isUnlock) {
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

    global.botLockdown = true;
    global.botLockdownOwner = OWNER_ID;

    return message.reply(
      "╔═══════════════════╗\n" +
      "║  🔒 تم تفعيل التقييد  ║\n" +
      "╠═══════════════════╣\n" +
      "║  البوت يرد عليك فقط الآن\n" +
      "║  لا يستجيب لأي شخص آخر\n" +
      "╠═══════════════════╣\n" +
      "║  لإلغاء: اكتب «إلغاء تقييد»\n" +
      "║  أو: .تقييد إلغاء\n" +
      "╚═══════════════════╝"
    );
  }
};
