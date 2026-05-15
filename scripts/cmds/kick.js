const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "kick",
    aliases: ["طرد", "kck"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 3,
    role: 1,
    shortDescription: { ar: "طرد عضو من المجموعة" },
    longDescription: { ar: "يقوم بطرد العضو المذكور من المجموعة" },
    category: "إدارة",
    guide: { ar: "{pn} @ذكر" }
  },

  onStart: async function ({ api, message, event }) {
    const mentioned = Object.keys(event.mentions || {});
    if (!mentioned.length) return message.reply("⚠️ يرجى ذكر الشخص الذي تريد طرده");
    for (const uid of mentioned) {
      try {
        await api.removeUserFromGroup(uid, event.threadID);
      } catch (e) {
        return message.reply("❌ فشل الطرد. تأكد من أن البوت مشرف في المجموعة.");
      }
    }
    return message.reply("✅ تم طرد العضو بنجاح!");
  }
};
