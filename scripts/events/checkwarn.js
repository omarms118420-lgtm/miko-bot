const DEV_ID = "61576232405796";

module.exports = {
  config: {
    name: "checkwarn",
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    category: "events"
  },

  langs: {
    ar: {
      warn: "⚠️ العضو %1 سبق أن حصل على 3 تحذيرات وتم حظره من المجموعة\n- الاسم: %1\n- الآيدي: %2\n- لرفع الحظر: %3warn unban <آيدي>",
      needPermission: "⚠️ البوت يحتاج صلاحية مشرف لطرد الأعضاء المحظورين"
    },
    en: {
      warn: "Member %1 has been warned 3 times before and banned\n- Name: %1\n- Uid: %2\n- To unban use: %3warn unban <uid>",
      needPermission: "Bot needs admin permission to kick banned members"
    }
  },

  onStart: async ({ threadsData, message, event, api, client, getLang }) => {
    if (event.logMessageType == "log:subscribe")
      return async function () {
        const { threadID } = event;
        const { data } = await threadsData.get(event.threadID);
        const { warn: warnList } = data;
        if (!warnList) return;
        const { addedParticipants } = event.logMessageData;
        for (const user of addedParticipants) {
          const findUser = warnList.find(u => u.userID == user.userFbId);
          if (findUser && findUser.list >= 3) {
            const userName = user.fullName;
            const uid = user.userFbId;
            message.send({ body: getLang("warn", userName, uid, client.getPrefix(threadID)), mentions: [{ tag: userName, id: uid }] }, function () {
              api.removeUserFromGroup(uid, threadID, (err) => { if (err) return message.send(getLang("needPermission")); });
            });
          }
        }
      };
  }
};
