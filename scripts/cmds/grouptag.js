const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "grouptag", aliases: ["فريق", "gtag"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 5, role: 0, shortDescription: { ar: "إدارة مجموعات الذكر" }, category: "مجموعة", guide: { ar: "{pn} add [اسم] @ذكر: إضافة فريق\n{pn} del [اسم] @ذكر: حذف\n{pn} remove [اسم]: إزالة\n{pn} list: القائمة\n{pn} [اسم]: ذكر الفريق" } },
  onStart: async function ({ message, args, event, threadsData }) {
    const type = (args[0] || "").toLowerCase();
    const data = await threadsData.get(event.threadID);
    const tags = data?.groupTags || {};
    const mentioned = Object.keys(event.mentions || {});
    if (type === "list" || type === "قائمة") {
      if (!Object.keys(tags).length) return message.reply("⚠️ لا توجد فرق مضافة");
      let body = "╔═══════════════════╗\n║  👥 قائمة الفرق  ║\n╠═══════════════════╣\n";
      Object.keys(tags).forEach(t => { body += "║  • " + t + " (" + tags[t].length + " عضو)\n"; });
      body += "╚═══════════════════╝";
      return message.reply(body);
    }
    if (type === "add" && args[1]) {
      const teamName = args[1].toUpperCase();
      if (!mentioned.length) return message.reply("⚠️ يرجى ذكر الأعضاء");
      tags[teamName] = [...new Set([...(tags[teamName] || []), ...mentioned])];
      await threadsData.set(event.threadID, { groupTags: tags });
      return message.reply("✅ تم إضافة الفريق \"" + teamName + "\" بـ " + mentioned.length + " عضو");
    }
    if (type === "remove" && args[1]) {
      const teamName = args[1].toUpperCase();
      delete tags[teamName];
      await threadsData.set(event.threadID, { groupTags: tags });
      return message.reply("✅ تم حذف الفريق \"" + teamName + "\"");
    }
    const teamName = type.toUpperCase();
    if (tags[teamName]) {
      const members = { body: tags[teamName].map(id => "@" + id).join(" "), mentions: tags[teamName].map(id => ({ tag: "@" + id, id })) };
      return message.reply(members);
    }
    return message.reply("⚠️ الاستخدام: -grouptag إضافة/حذف/قائمة/[اسم الفريق]");
  }
};
