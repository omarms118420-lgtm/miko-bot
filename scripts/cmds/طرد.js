module.exports = {
  config: {
    name: "طرد",
    aliases: ["kick"],
    version: "1.0",
    author: "ميكو AI",
    countDown: 5,
    role: 1, // 0=الجميع, 1=مشرف المجموعة, 2=مشرف البوت
    shortDescription: { ar: "طرد عضو من المجموعة" },
    longDescription: { ar: "يتم طرد العضو المذكور من المجموعة. يحتاج الأمر للانضمام كمدير أو مشرف." },
    category: "الادارة",
    guide: { ar: "{pn} @العضو أو {pn} معرف_العضو" }
  },

  onStart: async function ({ message, args, event, usersData, threadsData, api }) {
    // التأكد من أن المرسل هو مشرف أو مدير
    const senderID = event.senderID;
    const threadID = event.threadID;
    const threadInfo = await api.getThreadInformation(threadID);

    // التحقق من صلاحية المرسل
    if (!threadInfo.adminIDs.includes(senderID) && !threadInfo.ownerID.includes(senderID)) {
      return api.sendMessage("❌ لا تملك صلاحية استخدام هذا الأمر.", threadID, event.messageID);
    }

    // استخراج الـ ID للعضو المستهدف
    let targetID = null;

    // 1. إذا تم ذكر شخص في الرسالة
    if (event.mentions && Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    } else {
      // 2. إذا أدخل المستخدم معرفًا في المعاملات
      if (args.length > 0) {
        targetID = args[0];
      }
    }

    // إذا لم يتم العثور على أي معرف
    if (!targetID) {
      return api.sendMessage("❌ يرجى ذكر العضو الذي تريد طرده أو إدخال معرفه.", threadID, event.messageID);
    }

    // لا يُسمح بطرد المشرف نفسه
    if (targetID === senderID) {
      return api.sendMessage("❌ لا يمكنك طرد نفسك!", threadID, event.messageID);
    }

    // تنفيذ الطرد
    try {
      await api.removeUserFromGroup(targetID, threadID);
      return api.sendMessage(`✅ تم طرد العضو ${targetID} بنجاح.`, threadID, event.messageID);
    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ حدث خطأ أثناء الطرد. تأكد من أن البوت لديه صلاحيات الطرد.", threadID, event.messageID);
    }
  }
};