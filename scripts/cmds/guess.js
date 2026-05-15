const DEV_ID = "61576232405796";
const games = {};

module.exports = {
  config: {
    name: "guess",
    aliases: ["تخمين", "gss"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 3,
    role: 0,
    shortDescription: { ar: "لعبة تخمين الرقم" },
    longDescription: { ar: "العب لعبة تخمين الأرقام مع البوت!" },
    category: "ألعاب",
    guide: {
      ar: "   {pn}: بدء لعبة جديدة\n   {pn} [رقم]: تخمين الرقم"
    }
  },

  onStart: async function ({ message, event, args }) {
    const threadID = event.threadID;
    if (!args[0]) {
      const number = Math.floor(Math.random() * 100) + 1;
      games[threadID] = { number, attempts: 0 };
      return message.reply(
        "╔═══════════════════╗\n" +
        "║  🎮 لعبة التخمين  ║\n" +
        "╠═══════════════════╣\n" +
        "║  فكّرت برقم من 1 إلى 100\n" +
        "║  كم هو الرقم؟ 🤔\n" +
        "║  أرسل: -guess [رقم]\n" +
        "╚═══════════════════╝"
      );
    }

    if (!games[threadID]) return message.reply("⚠️ لم تبدأ لعبة بعد! أرسل -guess للبدء");
    const guess = parseInt(args[0]);
    if (isNaN(guess)) return message.reply("⚠️ يرجى إدخال رقم صحيح");

    games[threadID].attempts++;
    const { number, attempts } = games[threadID];

    if (guess === number) {
      delete games[threadID];
      return message.reply(
        "╔═══════════════════╗\n" +
        "║  🎉 مبروك!  ║\n" +
        "╠═══════════════════╣\n" +
        "║  ✅ الرقم الصحيح هو: " + number + "\n" +
        "║  🔢 عدد المحاولات: " + attempts + "\n" +
        "╚═══════════════════╝"
      );
    } else if (guess < number) {
      return message.reply("📈 الرقم أكبر! المحاولة رقم " + attempts);
    } else {
      return message.reply("📉 الرقم أصغر! المحاولة رقم " + attempts);
    }
  }
};
