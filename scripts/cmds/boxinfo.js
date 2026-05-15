const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "boxinfo",
    aliases: ["معلومات-مجموعة", "ginfo", "threadinfo"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 5,
    role: 0,
    shortDescription: { ar: "معلومات المجموعة" },
    longDescription: { ar: "يعرض معلومات تفصيلية عن المجموعة الحالية" },
    category: "معلومات",
    guide: { ar: "{pn}" }
  },

  onStart: async function ({ api, message, event }) {
    const info = await api.getThreadInfo(event.threadID);
    const admins = info.adminIDs?.length || 0;
    const members = info.participantIDs?.length || 0;
    const name = info.name || "بدون اسم";
    const now = new Date().toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" });

    return message.reply(
      "╔═══════════════════╗\n" +
      "║  💬 معلومات المجموعة  ║\n" +
      "╠═══════════════════╣\n" +
      "║  ╰➤ الاسم : " + name + "\n" +
      "║  ╰➤ الآيدي : " + event.threadID + "\n" +
      "║  ╰➤ عدد الأعضاء : " + members + "\n" +
      "║  ╰➤ عدد المشرفين : " + admins + "\n" +
      "║  ╰➤ الوقت : " + now + "\n" +
      "╠═══════════════════╣\n" +
      "╚═══════════════════╝"
    );
  }
};
