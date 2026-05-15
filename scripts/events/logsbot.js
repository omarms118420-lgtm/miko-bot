const { getTime } = global.utils;

const DEV_ID = "61576232405796";
const BOT_NAME = "ميكو";

module.exports = {
  config: {
    name: "logsbot",
    isBot: true,
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    envConfig: { allow: true },
    category: "events"
  },

  langs: {
    ar: {
      title: "╔═══════════════════╗\n║  📋 سجل بوت " + BOT_NAME + "  ║\n╠═══════════════════╣",
      added: "\n║  ✅ الحدث: تمت إضافة البوت لمجموعة جديدة\n║  أضافه: %1",
      kicked: "\n║  ❌ الحدث: تم طرد البوت\n║  طرده: %1",
      footer: "\n║  الآيدي: %1\n║  المجموعة: %2\n║  آيدي المجموعة: %3\n║  الوقت: %4\n╚═══════════════════╝"
    },
    en: {
      title: "╔═══════════════════╗\n║  📋 Bot Logs  ║\n╠═══════════════════╣",
      added: "\n║  ✅ Event: bot added to new group\n║  Added by: %1",
      kicked: "\n║  ❌ Event: bot was kicked\n║  Kicked by: %1",
      footer: "\n║  User ID: %1\n║  Group: %2\n║  Group ID: %3\n║  Time: %4\n╚═══════════════════╝"
    }
  },

  onStart: async ({ usersData, threadsData, event, api, getLang }) => {
    if (
      (event.logMessageType == "log:subscribe" && event.logMessageData.addedParticipants.some(item => item.userFbId == api.getCurrentUserID()))
      || (event.logMessageType == "log:unsubscribe" && event.logMessageData.leftParticipantFbId == api.getCurrentUserID())
    ) return async function () {
      let msg = getLang("title");
      const { author, threadID } = event;
      if (author == api.getCurrentUserID()) return;

      let threadName;
      const { config } = global.GoatBot;

      if (event.logMessageType == "log:subscribe") {
        if (!event.logMessageData.addedParticipants.some(item => item.userFbId == api.getCurrentUserID())) return;
        threadName = (await api.getThreadInfo(threadID)).threadName;
        const authorName = await usersData.getName(author);
        msg += getLang("added", authorName);
      } else if (event.logMessageType == "log:unsubscribe") {
        if (event.logMessageData.leftParticipantFbId != api.getCurrentUserID()) return;
        const authorName = await usersData.getName(author);
        const threadData = await threadsData.get(threadID);
        threadName = threadData.threadName;
        msg += getLang("kicked", authorName);
      }

      const time = getTime("DD/MM/YYYY HH:mm:ss");
      msg += getLang("footer", author, threadName, threadID, time);

      for (const adminID of config.adminBot)
        api.sendMessage(msg, adminID);
    };
  }
};
