const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "xid",
    aliases: ["آيدي-الكل"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 5,
    role: 1,
    shortDescription: { ar: "عرض آيدي جميع الأعضاء" },
    longDescription: { ar: "يعرض قائمة بآيدي جميع أعضاء المجموعة" },
    category: "معلومات",
    guide: { ar: "{pn}" }
  },

  onStart: async function ({ api, message, event }) {
    const info = await api.getThreadInfo(event.threadID);
    const members = info.participantIDs || [];
    let body = "╔═══════════════════╗\n║  🪪 آيدي الأعضاء  ║\n╠═══════════════════╣\n";
    members.forEach((id, i) => {
      body += "║  " + (i + 1) + ". " + id + "\n";
    });
    body += "╠═══════════════════╣\n║  👥 الإجمالي : " + members.length + " عضو\n╚═══════════════════╝";
    return message.reply(body);
  }
};
