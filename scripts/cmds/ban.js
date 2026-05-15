const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "ban",
    aliases: ["حظر"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 3,
    role: 2,
    shortDescription: { ar: "حظر مستخدم من استخدام البوت" },
    longDescription: { ar: "حظر مستخدم من استخدام البوت أو رفع الحظر عنه" },
    category: "إدارة",
    guide: {
      ar: "   {pn} @ذكر [السبب]: حظر مستخدم\n   {pn} unban @ذكر: رفع الحظر عن مستخدم"
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    const type = (args[0] || "").toLowerCase();
    const mentioned = Object.keys(event.mentions || {});

    if (type === "unban" || type === "رفع") {
      if (!mentioned.length) return message.reply("⚠️ يرجى ذكر الشخص الذي تريد رفع الحظر عنه");
      for (const uid of mentioned) {
        await usersData.set(uid, { banned: { status: false } });
      }
      return message.reply("✅ تم رفع الحظر بنجاح!");
    }

    if (!mentioned.length) return message.reply("⚠️ يرجى ذكر الشخص الذي تريد حظره");
    const reason = args.slice(1).join(" ").replace(/<[^>]+>/g, "").trim() || "لم يُذكر سبب";
    const now = new Date().toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" });

    for (const uid of mentioned) {
      await usersData.set(uid, { banned: { status: true, reason, date: now } });
    }

    return message.reply(
      "╔═══════════════════╗\n" +
      "║  🚫 تم الحظر  ║\n" +
      "╠═══════════════════╣\n" +
      "║  السبب : " + reason + "\n" +
      "║  الوقت : " + now + "\n" +
      "╚═══════════════════╝"
    );
  }
};
