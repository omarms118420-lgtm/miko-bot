const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "thread",
    aliases: ["مجموعة-بوت", "thr"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 3,
    role: 2,
    shortDescription: { ar: "إدارة المجموعات في نظام البوت" },
    longDescription: { ar: "بحث أو حظر أو رفع حظر مجموعات في نظام البوت" },
    category: "نظام",
    guide: {
      ar: "   {pn} find [الاسم]: البحث عن مجموعة\n   {pn} ban [آيدي] [السبب]: حظر مجموعة\n   {pn} unban [آيدي]: رفع الحظر\n   {pn} info: معلومات المجموعة الحالية"
    }
  },

  onStart: async function ({ message, event, args, threadsData }) {
    const type = (args[0] || "").toLowerCase();
    if (!type) return message.reply("⚠️ الاستخدام: -thread [بحث/حظر/رفع/معلومات]");

    if (type === "info" || type === "معلومات") {
      const data = await threadsData.get(event.threadID);
      return message.reply(
        "╔═══════════════════╗\n" +
        "║  💬 معلومات المجموعة  ║\n" +
        "╠═══════════════════╣\n" +
        "║  الاسم : " + (data?.threadName || "غير معروف") + "\n" +
        "║  الآيدي : " + event.threadID + "\n" +
        "║  عدد الرسائل : " + (data?.messageCount || 0) + "\n" +
        "╚═══════════════════╝"
      );
    }

    if (type === "ban" || type === "حظر") {
      const tid = args[1] || event.threadID;
      const reason = args.slice(2).join(" ") || "لم يُذكر سبب";
      const now = new Date().toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" });
      await threadsData.set(tid, { banned: { status: true, reason, date: now } });
      return message.reply("✅ تم حظر المجموعة " + tid + "\nالسبب: " + reason);
    }

    if (type === "unban" || type === "رفع") {
      const tid = args[1] || event.threadID;
      await threadsData.set(tid, { banned: { status: false } });
      return message.reply("✅ تم رفع الحظر عن المجموعة " + tid);
    }

    if (type === "find" || type === "بحث") {
      const keyword = args.slice(1).join(" ");
      if (!keyword) return message.reply("⚠️ يرجى إدخال الاسم للبحث");
      const all = await threadsData.getAll();
      const found = all.filter(t => t.threadName?.toLowerCase().includes(keyword.toLowerCase()));
      if (!found.length) return message.reply("❌ لم يتم العثور على مجموعة باسم: " + keyword);
      let body = "╔═══════════════════╗\n║  🔎 نتائج البحث  ║\n╠═══════════════════╣\n";
      found.slice(0, 10).forEach(t => { body += "║  ╰➤ " + (t.threadName || "بدون اسم") + " : " + t.threadID + "\n"; });
      body += "╚═══════════════════╝";
      return message.reply(body);
    }

    return message.reply("⚠️ نوع غير صحيح. استخدم: بحث، حظر، رفع، معلومات");
  }
};
