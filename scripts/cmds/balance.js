const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "balance",
    aliases: ["bal", "رصيد", "money"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 3,
    role: 0,
    shortDescription: { ar: "عرض رصيدك أو رصيد شخص آخر" },
    longDescription: { ar: "يعرض الرصيد الخاص بك أو بالشخص المذكور" },
    category: "مال",
    guide: {
      ar: "   {pn}: لعرض رصيدك\n   {pn} @ذكر: لعرض رصيد الشخص المذكور"
    }
  },

  onStart: async function ({ message, event, usersData }) {
    const mentioned = Object.keys(event.mentions || {});
    if (mentioned.length > 0) {
      const uid = mentioned[0];
      const data = await usersData.get(uid);
      const money = data?.money ?? 0;
      return message.reply(
        "╔═══════════════════╗\n" +
        "║  💰 معلومات الرصيد  ║\n" +
        "╠═══════════════════╣\n" +
        "║  ╰➤ رصيد " + event.mentions[uid] + " : " + money.toLocaleString("ar") + " $\n" +
        "╚═══════════════════╝"
      );
    }
    const data = await usersData.get(event.senderID);
    const money = data?.money ?? 0;
    return message.reply(
      "╔═══════════════════╗\n" +
      "║  💰 رصيدك الحالي  ║\n" +
      "╠═══════════════════╣\n" +
      "║  ╰➤ الرصيد : " + money.toLocaleString("ar") + " $\n" +
      "╚═══════════════════╝"
    );
  }
};
