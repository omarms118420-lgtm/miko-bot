const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const TMP_DIR = path.join(__dirname, "tmp");
fs.ensureDirSync(TMP_DIR);

const BATCH_SIZE = 15;

async function getDdgVqd(query) {
  try {
    const r = await axios.get("https://duckduckgo.com/", {
      params: { q: query, iax: "images", ia: "images" },
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      timeout: 12000
    });
    const m = r.data.match(/vqd=['"]?([\d-]+)['"]?/);
    return m ? m[1] : null;
  } catch (_) { return null; }
}

async function searchDDG(query, vqd, offset = 0) {
  try {
    const r = await axios.get("https://duckduckgo.com/i.js", {
      params: { l: "us-en", o: "json", q: query, vqd, f: ",,,,,", p: "1", s: offset },
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": "https://duckduckgo.com/",
        "Accept": "application/json, text/javascript, */*; q=0.01"
      },
      timeout: 12000
    });
    return (r.data?.results || []).map(r => r.image).filter(Boolean);
  } catch (_) { return []; }
}

async function searchBing(query, offset = 0) {
  try {
    const r = await axios.get("https://www.bing.com/images/search", {
      params: { q: query, form: "HDRSC2", first: String(offset + 1) },
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml"
      },
      timeout: 12000
    });
    const matches = r.data.match(/murl&quot;:&quot;(https[^&]+)&quot;/g) || [];
    return matches.map(m => m.replace("murl&quot;:&quot;", "").replace("&quot;", "")).filter(Boolean);
  } catch (_) { return []; }
}

async function downloadImage(url, dest) {
  const r = await axios.get(url, {
    responseType: "stream",
    timeout: 15000,
    maxContentLength: 15 * 1024 * 1024,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
      "Referer": "https://www.google.com/"
    },
    validateStatus: s => s < 400
  });
  const ct = r.headers["content-type"] || "";
  if (!ct.includes("image") && !ct.includes("octet-stream")) throw new Error("not_image");
  const writer = fs.createWriteStream(dest);
  r.data.pipe(writer);
  return new Promise((res, rej) => { writer.on("finish", res); writer.on("error", rej); });
}

async function downloadBatch(urls, startIdx = 0) {
  const tasks = urls.map((url, i) => async () => {
    const ext = url.includes(".png") ? ".png" : url.includes(".gif") ? ".gif" : ".jpg";
    const tmpPath = path.join(TMP_DIR, `img_${Date.now()}_${startIdx + i}${ext}`);
    try {
      await downloadImage(url, tmpPath);
      const size = fs.statSync(tmpPath).size;
      if (size > 500) return tmpPath;
      fs.unlinkSync(tmpPath);
      return null;
    } catch (_) {
      try { fs.unlinkSync(tmpPath); } catch (_) {}
      return null;
    }
  });

  const results = [];
  for (let i = 0; i < tasks.length; i += 5) {
    const batch = tasks.slice(i, i + 5);
    const settled = await Promise.allSettled(batch.map(t => t()));
    for (const s of settled) {
      if (s.status === "fulfilled" && s.value) results.push(s.value);
    }
  }
  return results;
}

async function fetchUrls(query, vqd, offset = 0) {
  const ddg = await searchDDG(query, vqd, offset);
  const bing = await searchBing(query, offset);
  return [...new Set([...ddg, ...bing])];
}

module.exports = {
  config: {
    name: "صورة",
    aliases: ["صور", "image", "img", "بحث-صورة", "سورة", "photos"],
    version: "7.0",
    author: "ميكو",
    countDown: 8,
    role: 0,
    shortDescription: { ar: "بحث عن 15 صورة وإرسالها" },
    longDescription: { ar: "يبحث عن 15 صورة ويرسلها — تفاعل بـ 👍 للمزيد" },
    category: "ترفيه",
    guide: {
      ar: "{pn} [كلمة البحث]\nمثال: .صور قطط\n\n📌 تفاعل بـ 👍 على الرسالة للمزيد"
    }
  },

  onStart: async function ({ message, event, args }) {
    if (!args.length) {
      return message.reply(
        "╔═══════════════════════╗\n" +
        "║   🖼️ بحث عن الصور\n" +
        "╠═══════════════════════╣\n" +
        "║  .صور [كلمة البحث]\n" +
        "╠═══════════════════════╣\n" +
        "║  مثال: .صور قطط\n" +
        "║  مثال: .صور anime girl\n" +
        "╠═══════════════════════╣\n" +
        "║  👍 تفاعل للمزيد من الصور\n" +
        "╚═══════════════════════╝"
      );
    }

    const query = args.join(" ");
    await message.reply(`🔍 جاري البحث عن: "${query}"...`);

    const vqd = await getDdgVqd(query);
    const urls = await fetchUrls(query, vqd, 0);

    if (!urls.length) {
      return message.reply(`❌ لا توجد نتائج لـ: "${query}"\nجرّب كلمة أخرى.`);
    }

    const filePaths = await downloadBatch(urls.slice(0, BATCH_SIZE + 5), 0);
    const good = filePaths.filter(Boolean).slice(0, BATCH_SIZE);

    if (!good.length) {
      return message.reply(`❌ تعذّر تنزيل الصور. جرّب كلمة بحث مختلفة.`);
    }

    const sentMsg = await message.reply({
      body: `🖼️ "${query}" — ${good.length} صورة\n👍 تفاعل بـ لايك للمزيد`,
      attachment: good.map(p => fs.createReadStream(p))
    });

    for (const p of good) { try { fs.unlinkSync(p); } catch (_) {} }

    if (sentMsg?.messageID) {
      global.GoatBot.onReaction.set(sentMsg.messageID, {
        commandName: "صورة",
        author: event.senderID,
        messageID: sentMsg.messageID,
        query,
        vqd,
        offset: urls.length,
        batchNum: 1
      });
    }
  },

  onReaction: async function ({ Reaction, message, event }) {
    // قبول أي تفاعل من نفس الشخص فقط
    if (event.senderID !== Reaction.author) return;

    const { query, vqd, offset, batchNum, messageID } = Reaction;

    // حذف التفاعل القديم لمنع التكرار
    try {
      if (typeof Reaction.delete === "function") Reaction.delete();
      else global.GoatBot.onReaction.delete(messageID);
    } catch (_) {}

    await message.reply(`🔍 جاري جلب دفعة ${batchNum + 1} من صور "${query}"...`);

    const newVqd = vqd || await getDdgVqd(query);
    const urls = await fetchUrls(query, newVqd, offset);

    if (!urls.length) {
      return message.reply(`❌ لا توجد صور إضافية لـ "${query}".`);
    }

    const filePaths = await downloadBatch(urls.slice(0, BATCH_SIZE + 5), 0);
    const good = filePaths.filter(Boolean).slice(0, BATCH_SIZE);

    if (!good.length) {
      return message.reply(`❌ لا توجد صور إضافية متاحة الآن.`);
    }

    const sentMsg = await message.reply({
      body: `🖼️ "${query}" — دفعة ${batchNum + 1} — ${good.length} صورة\n👍 تفاعل للمزيد`,
      attachment: good.map(p => fs.createReadStream(p))
    });

    for (const p of good) { try { fs.unlinkSync(p); } catch (_) {} }

    if (sentMsg?.messageID) {
      global.GoatBot.onReaction.set(sentMsg.messageID, {
        commandName: "صورة",
        author: Reaction.author,
        messageID: sentMsg.messageID,
        query,
        vqd: newVqd,
        offset: offset + urls.length,
        batchNum: batchNum + 1
      });
    }
  }
};
