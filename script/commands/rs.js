this.config = {
    name: "رست",
    version: "1.0.0",
    hasPermssion: 2,
    credits: "Rako San",
    description: "اعادة تشغيل بوت",
    commandCategory: "الــمـطـور",
    cooldowns: 0,
    images: [],
 };
this.HakimRun = ({event, api}) => {
  if (event.senderID !== "100003922506337") {
    return api.sendMessage("❌ هذا الأمر مخصص فقط للرجال.", event.threadID);
  }
  api.sendMessage("جاري اعادة تشغيل البوت ⏳", event.threadID, () => process.exit(1), event.messageID);
}