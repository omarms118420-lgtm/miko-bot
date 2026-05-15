const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "setwelcome",
    aliases: ["ترحيب", "welcome"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 3,
    role: 1,
    shortDescription: { ar: "تخصيص رسالة الترحيب" },
    longDescription: { ar: "تعديل رسالة الترحيب عند انضمام أعضاء جدد" },
    category: "مجموعة",
    guide: {
      ar: "   {pn} text [النص]: تعيين رسالة الترحيب\n   {pn} reset: إعادة تعيين الرسالة الافتراضية\n   الاختصارات:\n   {userName}: اسم العضو الجديد\n   {boxName}: اسم المجموعة"
    }
  },

  onStart: async function ({ message, event, args, threadsData }) {
    const type = (args[0] || "").toLowerCase();

    if (type === "text" || type === "نص") {
      const content = args.slice(1).join(" ");
      if (!content) return message.reply("⚠️ يرجى إدخال نص رسالة الترحيب");
      await threadsData.set(event.threadID, { welcomeMessage: content });
      return message.reply("✅ تم تعيين رسالة الترحيب:\n" + content);
    }

    if (type === "reset" || type === "إعادة") {
      await threadsData.set(event.threadID, { welcomeMessage: "" });
      return message.reply("✅ تمت إعادة تعيين رسالة الترحيب الافتراضية");
    }

    const data = await threadsData.get(event.threadID);
    const current = data?.welcomeMessage || "لم تُعيَّن رسالة ترحيب مخصصة";
    return message.reply(
      "╔═══════════════════╗\n" +
      "║  👋 رسالة الترحيب  ║\n" +
      "╠═══════════════════╣\n" +
      "║  " + current + "\n" +
      "╚═══════════════════╝"
    );
  }
};
