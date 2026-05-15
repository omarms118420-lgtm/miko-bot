const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "all",
    aliases: ["الكل", "تاق"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 10,
    role: 0,
    shortDescription: { ar: "ذكر جميع أعضاء المجموعة" },
    longDescription: { ar: "يقوم بذكر جميع أعضاء المجموعة في رسالة واحدة" },
    category: "مجموعة",
    guide: { ar: "{pn} [رسالة اختيارية]" }
  },

  onStart: async function ({ api, message, event, args }) {
    const threadInfo = await api.getThreadInfo(event.threadID);
    const members = threadInfo.participantIDs || [];
    const content = args.join(" ") || "📢 انتبهوا جميعاً!";

    const mentions = members.map(id => ({ tag: "@" + id, id }));
    const body = content + "\n" + members.map(id => "@" + id).join(" ");

    return message.reply({ body, mentions });
  }
};
