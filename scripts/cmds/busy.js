const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "busy",
    aliases: ["مشغول", "bsy"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 3,
    role: 0,
    shortDescription: { ar: "تفعيل وضع عدم الإزعاج" },
    longDescription: { ar: "عند تفعيله، سيُخبر البوت من يذكرك بأنك مشغول" },
    category: "أدوات",
    guide: {
      ar: "   {pn} [سبب اختياري]: تفعيل وضع المشغول\n   {pn} off: إيقاف وضع المشغول"
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    const type = (args[0] || "").toLowerCase();
    const uid = event.senderID;

    if (type === "off" || type === "إيقاف") {
      await usersData.set(uid, { busy: { status: false, reason: "" } });
      return message.reply("✅ تم إيقاف وضع المشغول");
    }

    const reason = args.join(" ") || "";
    await usersData.set(uid, { busy: { status: true, reason } });

    return message.reply(
      "╔═══════════════════╗\n" +
      "║  🔕 وضع المشغول  ║\n" +
      "╠═══════════════════╣\n" +
      "║  ✅ تم تفعيل وضع المشغول\n" +
      (reason ? "║  📝 السبب : " + reason + "\n" : "") +
      "╚═══════════════════╝"
    );
  }
};
