const T = "╔═══════════════════╗";
const M = "║";
const S = "╠═══════════════════╣";
const B = "╚═══════════════════╝";

module.exports = {
  config: {
    name: "uid",
    aliases: ["id", "آيدي"],
    version: "2.1",
    author: "ميكو",
    countDown: 3,
    role: 0,
    shortDescription: { ar: "عرض آيدي الفيسبوك" },
    longDescription: { ar: "يعرض آيدي الفيسبوك الخاص بك أو بالشخص الذي تذكره" },
    category: "معلومات",
    guide: {
      ar: "   {pn}: لعرض آيدي الفيسبوك الخاص بك\n   {pn} @ذكر: لعرض آيدي الفيسبوك للشخص المذكور"
    }
  },

  onStart: async function ({ message, event }) {
    const mentioned = Object.keys(event.mentions || {});
    if (mentioned.length > 0) {
      const names = mentioned.map(id => `${M}  ╰➤ ${event.mentions[id]} : ${id}`).join("\n");
      return message.reply(T + "\n" + M + "  🪪 آيدي الفيسبوك\n" + S + "\n" + names + "\n" + B);
    }
    return message.reply(
      T + "\n" +
      M + "  🪪 آيدي الفيسبوك الخاص بك\n" + S + "\n" +
      M + "  ╰➤ الآيدي : " + event.senderID + "\n" + B
    );
  }
};
