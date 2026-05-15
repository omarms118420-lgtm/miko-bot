const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "setname",
    aliases: ["تغيير-اسم", "sname"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 3,
    role: 1,
    shortDescription: { ar: "تغيير اسم المجموعة أو لقب المستخدم" },
    longDescription: { ar: "تغيير اسم المجموعة أو لقب عضو معين" },
    category: "مجموعة",
    guide: {
      ar: "   {pn} [اسم جديد]: تغيير اسم المجموعة\n   {pn} @ذكر [لقب]: تغيير لقب العضو"
    }
  },

  onStart: async function ({ api, message, event, args }) {
    const mentioned = Object.keys(event.mentions || {});
    if (mentioned.length > 0) {
      const uid = mentioned[0];
      const nickname = args.slice(1).join(" ").replace(/<[^>]+>/g, "").trim();
      if (!nickname) return message.reply("⚠️ يرجى إدخال اللقب الجديد");
      await api.changeNickname(nickname, event.threadID, uid);
      return message.reply("✅ تم تغيير اللقب بنجاح!");
    }
    const name = args.join(" ");
    if (!name) return message.reply("⚠️ يرجى إدخال الاسم الجديد للمجموعة");
    await api.setTitle(name, event.threadID);
    return message.reply("✅ تم تغيير اسم المجموعة إلى: " + name);
  }
};
