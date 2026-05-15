const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "adduser",
    aliases: ["إضافة", "addmember"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 3,
    role: 1,
    shortDescription: { ar: "إضافة مستخدم للمجموعة" },
    longDescription: { ar: "يضيف مستخدماً للمجموعة عن طريق الآيدي" },
    category: "مجموعة",
    guide: { ar: "{pn} [آيدي المستخدم]" }
  },

  onStart: async function ({ api, message, event, args }) {
    if (!args[0]) return message.reply("⚠️ يرجى إدخال آيدي المستخدم");
    try {
      await api.addUserToGroup(args[0], event.threadID);
      return message.reply("✅ تمت الإضافة بنجاح!");
    } catch (e) {
      return message.reply("❌ فشل إضافة المستخدم. تأكد من الآيدي وأن البوت مشرف.");
    }
  }
};
