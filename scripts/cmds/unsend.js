const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "unsend",
    aliases: ["حذف", "del"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 3,
    role: 0,
    shortDescription: { ar: "حذف رسالة البوت" },
    longDescription: { ar: "يحذف رسالة البوت عند الرد عليها" },
    category: "أدوات",
    guide: { ar: "رد على الرسالة التي تريد حذفها واكتب {pn}" }
  },

  onStart: async function ({ api, message, event }) {
    if (!event.messageReply) {
      return message.reply("⚠️ يرجى الرد على الرسالة التي تريد حذفها");
    }
    await api.unsendMessage(event.messageReply.messageID);
  }
};
