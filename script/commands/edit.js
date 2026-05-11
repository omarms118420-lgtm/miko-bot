const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const baseApiUrl = async () => {
    const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
    return base.data.mahmud;
};

module.exports.config = {
    title: "edit",
    release: "1.0.0",
    clearance: 0,
    author: "Hakim Tracks",
    summary: "لا يوجد وصف حالياً",
    section: "عام",
    syntax: "",
    delay: 3,
};

module.exports.HakimRun = async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const prompt = args.join(' ');
    const repliedImage = event.messageReply?.attachments?.[0];

    if (!prompt || !repliedImage || repliedImage.type !== 'photo') {
        return api.sendMessage('❌ يرجى الرد على صورة مع كتابة التعليمات (مثال: edit أضف نظارة شمسية)', threadID, messageID);
    }

    const cacheDir = path.join(__dirname, 'cache');
    const imgPath = path.join(cacheDir, `${Date.now()}_edit.jpg`);
    await fs.ensureDir(cacheDir);

    let waitMsgID = null;

    try {
        
        const waitMsg = await api.sendMessage('🔄 | جاري تعديل الصورة، يرجى الانتظار...', threadID);
        waitMsgID = waitMsg.messageID;

        const baseURL = await baseApiUrl();
        const res = await axios.post(
            `${baseURL}/api/edit`,
            { prompt, imageUrl: repliedImage.url },
            { responseType: 'arraybuffer' }
        );

        await fs.writeFile(imgPath, Buffer.from(res.data, 'binary'));

        if (waitMsgID) api.unsendMessage(waitMsgID);

        api.sendMessage({
            body: `✅ | تم تعديل الصورة بنجاح\nالوصف: ${prompt}`,
            attachment: fs.createReadStream(imgPath)
        }, threadID, (err) => {
            if (!err) api.setMessageReaction('✅', messageID, () => {}, true);
            
            setTimeout(() => {
                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            }, 10000);
        }, messageID);

    } catch (err) {
        if (waitMsgID) api.unsendMessage(waitMsgID);
        api.setMessageReaction('❌', messageID, () => {}, true);
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        api.sendMessage('❌ خطأ: ' + err.message, threadID, messageID);
    }
};