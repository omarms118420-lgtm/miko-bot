const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "admin",
    aliases: ["مشرف"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 3,
    role: 1,
    shortDescription: { ar: "إدارة مشرفي المجموعة" },
    longDescription: { ar: "إضافة أو إزالة مشرف في المجموعة" },
    category: "إدارة",
    guide: {
      ar: "   {pn} add @ذكر: إضافة مشرف\n   {pn} remove @ذكر: إزالة مشرف\n   {pn} list: عرض قائمة المشرفين"
    }
  },

  onStart: async function ({ api, message, event, args }) {
    const type = (args[0] || "").toLowerCase();
    const mentioned = Object.keys(event.mentions || {});

    if (type === "add" || type === "إضافة") {
      if (!mentioned.length) return message.reply("⚠️ يرجى ذكر الشخص الذي تريد تعيينه مشرفاً");
      for (const uid of mentioned) {
        await api.changeAdminStatus(event.threadID, uid, true);
      }
      return message.reply("✅ تم تعيين المشرف بنجاح!");
    }

    if (type === "remove" || type === "إزالة") {
      if (!mentioned.length) return message.reply("⚠️ يرجى ذكر الشخص الذي تريد إزالته من المشرفين");
      for (const uid of mentioned) {
        await api.changeAdminStatus(event.threadID, uid, false);
      }
      return message.reply("✅ تمت إزالة المشرف بنجاح!");
    }

    if (type === "list" || type === "قائمة") {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const admins = threadInfo.adminIDs?.map(a => "║  ╰➤ " + a.id).join("\n") || "║  لا يوجد مشرفون";
      return message.reply(
        "╔═══════════════════╗\n" +
        "║  🛡️ قائمة المشرفين  ║\n" +
        "╠═══════════════════╣\n" +
        admins + "\n" +
        "╚═══════════════════╝"
      );
    }

    return message.reply("⚠️ الاستخدام: -admin add/remove @ذكر | -admin list");
  }
};
