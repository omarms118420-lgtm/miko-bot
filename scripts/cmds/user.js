const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "user",
    aliases: ["مستخدم", "usr"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 3,
    role: 2,
    shortDescription: { ar: "إدارة المستخدمين في نظام البوت" },
    longDescription: { ar: "بحث أو حظر أو رفع حظر مستخدمين في نظام البوت" },
    category: "نظام",
    guide: {
      ar: "   {pn} find [الاسم]: البحث عن مستخدم\n   {pn} ban [آيدي] [السبب]: حظر مستخدم\n   {pn} unban [آيدي]: رفع الحظر"
    }
  },

  onStart: async function ({ message, args, usersData }) {
    const type = (args[0] || "").toLowerCase();
    if (!type) return message.reply("⚠️ الاستخدام: -user [بحث/حظر/رفع] [آيدي/اسم]");

    if (type === "find" || type === "بحث") {
      const keyword = args.slice(1).join(" ");
      if (!keyword) return message.reply("⚠️ يرجى إدخال الاسم للبحث");
      const all = await usersData.getAll();
      const found = all.filter(u => u.name?.toLowerCase().includes(keyword.toLowerCase()));
      if (!found.length) return message.reply("❌ لم يتم العثور على مستخدم باسم: " + keyword);
      let body = "╔═══════════════════╗\n║  🔎 نتائج البحث  ║\n╠═══════════════════╣\n";
      found.slice(0, 10).forEach(u => { body += "║  ╰➤ " + u.name + " : " + u.userID + "\n"; });
      body += "╚═══════════════════╝";
      return message.reply(body);
    }

    if (type === "ban" || type === "حظر") {
      const uid = args[1];
      if (!uid) return message.reply("⚠️ يرجى إدخال الآيدي");
      const reason = args.slice(2).join(" ") || "لم يُذكر سبب";
      const now = new Date().toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" });
      await usersData.set(uid, { banned: { status: true, reason, date: now } });
      return message.reply("✅ تم حظر المستخدم " + uid + "\nالسبب: " + reason);
    }

    if (type === "unban" || type === "رفع") {
      const uid = args[1];
      if (!uid) return message.reply("⚠️ يرجى إدخال الآيدي");
      await usersData.set(uid, { banned: { status: false } });
      return message.reply("✅ تم رفع الحظر عن المستخدم " + uid);
    }

    return message.reply("⚠️ نوع غير صحيح. استخدم: بحث، حظر، رفع");
  }
};
