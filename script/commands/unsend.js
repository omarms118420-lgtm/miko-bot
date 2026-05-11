module.exports.config = {
    title: "unsend",
    release: "1.0.0",
    clearance: 0,
    author: "Hakim Tracks",
    summary: "لا يوجد وصف حالياً",
    section: "عام",
    syntax: "",
    delay: 3,
};

module.exports.languages = {
    "vi": {
        "returnCant": "Không thể gỡ tin nhắn của người khác.",
        "missingReply": "Hãy reply tin nhắn cần gỡ."
    },
    "en": {
        "returnCant": "اقول تدخل حسابه وتحذفها 🙂🗡️",
        "missingReply": "رد عا رسالتي 🙂"
    }
}

module.exports.HakimRun = function({ api, event, getText }) {
    if (event.messageReply.senderID != api.getCurrentUserID()) return api.sendMessage(getText("returnCant"), event.threadID, event.messageID);
    if (event.type != "message_reply") return api.sendMessage(getText("missingReply"), event.threadID, event.messageID);
    return api.unsendMessage(event.messageReply.messageID);
}
