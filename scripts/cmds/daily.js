const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "daily",
    aliases: ["يومي", "dl"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 5,
    role: 0,
    shortDescription: { ar: "استلام المكافأة اليومية" },
    longDescription: { ar: "استلام المكافأة اليومية من عملات وخبرة" },
    category: "مال",
    guide: { ar: "{pn}" }
  },

  onStart: async function ({ message, event, usersData }) {
    const uid = event.senderID;
    const data = await usersData.get(uid);
    const now = Date.now();
    const lastDaily = data?.lastDaily || 0;
    const cooldown = 24 * 60 * 60 * 1000;

    if (now - lastDaily < cooldown) {
      const remaining = cooldown - (now - lastDaily);
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      return message.reply(
        "╔═══════════════════╗\n" +
        "║  ⏳ انتظر قليلاً  ║\n" +
        "╠═══════════════════╣\n" +
        "║  يمكنك الاستلام بعد:\n" +
        "║  ╰➤ " + h + " ساعة و " + m + " دقيقة\n" +
        "╚═══════════════════╝"
      );
    }

    const reward = 500;
    const expReward = 20;
    const currentMoney = data?.money || 0;
    const currentExp = data?.exp || 0;

    await usersData.set(uid, {
      money: currentMoney + reward,
      exp: currentExp + expReward,
      lastDaily: now
    });

    return message.reply(
      "╔═══════════════════╗\n" +
      "║  🎁 مكافأة يومية  ║\n" +
      "╠═══════════════════╣\n" +
      "║  ╰➤ 💰 عملات : +" + reward + " $\n" +
      "║  ╰➤ ⭐ خبرة : +" + expReward + " XP\n" +
      "║  ╰➤ 💳 رصيدك الكلي : " + (currentMoney + reward) + " $\n" +
      "╠═══════════════════╣\n" +
      "║  تعال غداً للمزيد! 🌟\n" +
      "╚═══════════════════╝"
    );
  }
};
