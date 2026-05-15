const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "setleave",
    aliases: ["رسالة-مغادرة", "sleave"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 3,
    role: 1,
    shortDescription: { ar: "تخصيص رسالة مغادرة الأعضاء" },
    longDescription: { ar: "تعديل رسالة وداع الأعضاء عند مغادرة المجموعة" },
    category: "مجموعة",
    guide: {
      ar: "   {pn} text [النص]: تعيين رسالة المغادرة\n   {pn} reset: إعادة تعيين الافتراضي\n   الاختصارات:\n   {userName}: اسم العضو"
    }
  },

  onStart: async function ({ message, event, args, threadsData }) {
    const type = (args[0] || "").toLowerCase();
    if (type === "text" || type === "نص") {
      const content = args.slice(1).join(" ");
      if (!content) return message.reply("⚠️ يرجى إدخال نص رسالة المغادرة");
      await threadsData.set(event.threadID, { leaveMessage: content });
      return message.reply("✅ تم تعيين رسالة المغادرة:\n" + content);
    }
    if (type === "reset" || type === "إعادة") {
      await threadsData.set(event.threadID, { leaveMessage: "" });
      return message.reply("✅ تمت إعادة تعيين رسالة المغادرة الافتراضية");
    }
    const data = await threadsData.get(event.threadID);
    const current = data?.leaveMessage || "لم تُعيَّن رسالة مغادرة مخصصة";
    return message.reply(
      "╔═══════════════════╗\n" +
      "║  👋 رسالة المغادرة  ║\n" +
      "╠═══════════════════╣\n" +
      "║  " + current + "\n" +
      "╚═══════════════════╝"
    );
  }
};
