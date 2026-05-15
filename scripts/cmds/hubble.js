const axios = require("axios");
const DEV_ID = "61576232405796";
module.exports = {
  config: { name: "hubble", aliases: ["فضاء", "nasa"], version: "2.0", author: "ميكو | مطور: " + DEV_ID, countDown: 10, role: 0, shortDescription: { ar: "صور الفضاء من هابل وناسا" }, category: "أدوات", guide: { ar: "{pn}" } },
  onStart: async function ({ message }) {
    try {
      const res = await axios.get("https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY");
      const d = res.data;
      if (d.media_type === "image") {
        const imgRes = await axios.get(d.url, { responseType: "stream" });
        return message.reply({ body: "◈━━━━━━━━━━━━━━━━━━━━◈\n     🌌  صورة الفضاء\n◈━━━━━━━━━━━━━━━━━━━━◈\n  ❖ العنوان  ➜  " + (d.title || "غير محدد") + "\n  ❖ التاريخ  ➜  " + d.date + "\n◈━━━━━━━━━━━━━━━━━━━━◈", attachment: imgRes.data });
      }
      return message.reply("◈━━━━━━━━━━━━━━━━━━━━◈\n     🌌  صورة الفضاء\n◈━━━━━━━━━━━━━━━━━━━━◈\n  ❖ العنوان  ➜  " + (d.title || "غير محدد") + "\n  " + (d.explanation || "").substring(0, 120) + "...\n◈━━━━━━━━━━━━━━━━━━━━◈");
    } catch(e) { return message.reply("❌ فشل جلب صورة الفضاء. حاول لاحقاً."); }
  }
};
