const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "guessnumber",
    aliases: ["تخمين-رقم", "gn"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 3,
    role: 0,
    shortDescription: { ar: "لعبة تخمين الأرقام مع نقاط" },
    longDescription: { ar: "العب لعبة تخمين الأرقام واكسب العملات!" },
    category: "ألعاب",
    guide: { ar: "{pn}: بدء لعبة جديدة" }
  },

  onStart: async function ({ message, event, usersData }) {
    const number = Math.floor(Math.random() * 50) + 1;
    global.guessGames = global.guessGames || {};
    global.guessGames[event.threadID] = { number, senderID: event.senderID };

    const body =
      "╔═══════════════════╗\n" +
      "║  🎲 تخمين الأرقام  ║\n" +
      "╠═══════════════════╣\n" +
      "║  فكّرت برقم من 1 إلى 50\n" +
      "║  🏆 جائزة الفوز: 200 $\n" +
      "║  رد برقمك للتخمين!\n" +
      "╚═══════════════════╝";

    return message.reply({ body }, (err, info) => {
      if (!err) {
        global.GoatBot?.onReply?.set(info.messageID, {
          commandName: "guessnumber",
          messageID: info.messageID,
          number,
          senderID: event.senderID,
          threadID: event.threadID
        });
      }
    });
  },

  onReply: async function ({ message, event, Reply, usersData }) {
    const guess = parseInt(event.body);
    if (isNaN(guess)) return message.reply("⚠️ يرجى إدخال رقم");
    const { number } = Reply;

    if (guess === number) {
      const data = await usersData.get(event.senderID);
      await usersData.set(event.senderID, { money: (data?.money || 0) + 200 });
      return message.reply(
        "╔═══════════════════╗\n" +
        "║  🎉 إجابة صحيحة!  ║\n" +
        "╠═══════════════════╣\n" +
        "║  ✅ الرقم هو: " + number + "\n" +
        "║  💰 ربحت: 200 $\n" +
        "╚═══════════════════╝"
      );
    }
    return message.reply(guess < number ? "📈 الرقم أكبر! حاول مجدداً" : "📉 الرقم أصغر! حاول مجدداً");
  }
};
