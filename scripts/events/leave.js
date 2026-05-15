const { getTime, drive } = global.utils;

const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "leave",
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    category: "events"
  },

  langs: {
    ar: {
      session1: "الصباح",
      session2: "الظهر",
      session3: "المساء",
      session4: "الليل",
      leaveType1: "غادر",
      leaveType2: "تم طرده من",
      defaultLeaveMessage: "╔═══════════════════╗\n║  👋 وداعاً  ║\n╠═══════════════════╣\n║  {userName} {type} المجموعة\n╚═══════════════════╝"
    },
    en: {
      session1: "morning",
      session2: "noon",
      session3: "afternoon",
      session4: "evening",
      leaveType1: "left",
      leaveType2: "was kicked from",
      defaultLeaveMessage: "{userName} {type} the group"
    }
  },

  onStart: async ({ threadsData, message, event, api, usersData, getLang }) => {
    if (event.logMessageType == "log:unsubscribe")
      return async function () {
        const { threadID } = event;
        const threadData = await threadsData.get(threadID);
        if (!threadData.settings.sendLeaveMessage) return;

        const { leftParticipantFbId } = event.logMessageData;
        if (leftParticipantFbId == api.getCurrentUserID()) return;

        const hours = getTime("HH");
        const threadName = threadData.threadName;
        const userName = await usersData.getName(leftParticipantFbId);

        let { leaveMessage = getLang("defaultLeaveMessage") } = threadData.data;
        const form = {
          mentions: leaveMessage.match(/\{userNameTag\}/g) ? [{ tag: userName, id: leftParticipantFbId }] : null
        };

        leaveMessage = leaveMessage
          .replace(/\{userName\}|\{userNameTag\}/g, userName)
          .replace(/\{type\}/g, leftParticipantFbId == event.author ? getLang("leaveType1") : getLang("leaveType2"))
          .replace(/\{threadName\}|\{boxName\}/g, threadName)
          .replace(/\{time\}/g, hours)
          .replace(/\{session\}/g,
            hours <= 10 ? getLang("session1") :
            hours <= 12 ? getLang("session2") :
            hours <= 18 ? getLang("session3") : getLang("session4")
          );

        form.body = leaveMessage;

        if (threadData.data.leaveAttachment) {
          const files = threadData.data.leaveAttachment;
          const attachments = files.reduce((acc, file) => { acc.push(drive.getFile(file, "stream")); return acc; }, []);
          form.attachment = (await Promise.allSettled(attachments)).filter(({ status }) => status == "fulfilled").map(({ value }) => value);
        }
        message.send(form);
      };
  }
};
