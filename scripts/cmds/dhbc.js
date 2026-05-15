const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "dhbc", aliases: ["تخمين-كلمة", "wordgame"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 5, role: 0, shortDescription: { ar: "لعبة التخمين" }, category: "ألعاب", guide: { ar: "{pn}: بدء لعبة" } },
  onStart: async function ({ message }) {
    const words = ["برتقال", "تفاحة", "موز", "مانجو", "فراولة", "بطيخ", "عنب", "رمان", "خوخ", "كمثرى"];
    const word = words[Math.floor(Math.random() * words.length)];
    const hint = word[0] + "_".repeat(word.length - 2) + word[word.length - 1];
    global.dhbcGames = global.dhbcGames || {};
    const body = "╔═══════════════════╗\n║  🎯 لعبة التخمين  ║\n╠═══════════════════╣\n║  الكلمة المخفية: " + hint + "\n║  🏆 جائزة الفوز: 300 $\n║  رد بتخمينك!\n╚═══════════════════╝";
    return message.reply({ body }, (err, info) => {
      if (!err) { global.GoatBot?.onReply?.set(info.messageID, { commandName: "dhbc", word }); }
    });
  },
  onReply: async function ({ message, event, Reply, usersData }) {
    const guess = (event.body || "").trim();
    if (guess.toLowerCase() === Reply.word.toLowerCase()) {
      const data = await usersData.get(event.senderID);
      await usersData.set(event.senderID, { money: (data?.money || 0) + 300 });
      return message.reply("🎉 إجابة صحيحة! الكلمة هي: " + Reply.word + "\n💰 ربحت 300 $!");
    }
    return message.reply("❌ إجابة خاطئة! حاول مجدداً");
  }
};
