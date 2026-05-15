const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "count",
    aliases: ["عد", "رسائل"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 5,
    role: 0,
    shortDescription: { ar: "عرض عدد الرسائل" },
    longDescription: { ar: "يعرض عدد رسائل الأعضاء في المجموعة منذ انضمام البوت" },
    category: "معلومات",
    guide: {
      ar: "   {pn}: عدد رسائلك\n   {pn} @ذكر: عدد رسائل الشخص المذكور\n   {pn} all: عدد رسائل جميع الأعضاء"
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    const mentioned = Object.keys(event.mentions || {});
    const type = (args[0] || "").toLowerCase();

    if (type === "all" || type === "الكل") {
      const allUsers = await usersData.getAll();
      const threadUsers = allUsers.filter(u => u.threadID === event.threadID || true);
      const sorted = threadUsers.sort((a, b) => (b.data?.messageCount || 0) - (a.data?.messageCount || 0)).slice(0, 15);
      let body = "╔═══════════════════╗\n║  📊 إحصائيات الرسائل  ║\n╠═══════════════════╣\n";
      sorted.forEach((u, i) => {
        body += "║  " + (i + 1) + ". " + (u.name || "مجهول") + " : " + (u.data?.messageCount || 0) + " رسالة\n";
      });
      body += "╚═══════════════════╝";
      return message.reply(body);
    }

    if (mentioned.length > 0) {
      const uid = mentioned[0];
      const data = await usersData.get(uid);
      const count = data?.messageCount || 0;
      return message.reply(
        "╔═══════════════════╗\n" +
        "║  📊 عدد الرسائل  ║\n" +
        "╠═══════════════════╣\n" +
        "║  ╰➤ " + event.mentions[uid] + " : " + count + " رسالة\n" +
        "╚═══════════════════╝"
      );
    }

    const data = await usersData.get(event.senderID);
    const count = data?.messageCount || 0;
    return message.reply(
      "╔═══════════════════╗\n" +
      "║  📊 عدد رسائلك  ║\n" +
      "╠═══════════════════╣\n" +
      "║  ╰➤ عدد رسائلك : " + count + " رسالة\n" +
      "╚═══════════════════╝"
    );
  }
};
