const axios  = require("axios");
const fs     = require("fs-extra");
const path   = require("path");
const ytdl   = require("@distube/ytdl-core");

const DEV_ID  = "61576232405796";
const TMP_DIR = path.join(__dirname, "..", "assets", "tmp");
fs.ensureDirSync(TMP_DIR);

const YTDL_OPTS = {
  requestOptions: {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36"
    }
  }
};

/* ── YouTube search (no yt-dlp) ── */
async function ytSearch(query) {
  const url = "https://www.youtube.com/results?search_query=" + encodeURIComponent(query);
  const res = await axios.get(url, {
    timeout: 12000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9"
    }
  });
  const html = res.data;
  // Extract multiple results
  const matches = [...html.matchAll(/"videoId":"([^"]{11})"/g)];
  const seen    = new Set();
  const ids     = [];
  for (const m of matches) {
    if (!seen.has(m[1])) { seen.add(m[1]); ids.push(m[1]); }
    if (ids.length >= 5) break;
  }
  if (!ids.length) throw new Error("لا توجد نتائج");
  return ids.map(id => ({ id, url: "https://www.youtube.com/watch?v=" + id }));
}

async function getInfo(videoUrl) {
  const info = await ytdl.getBasicInfo(videoUrl, YTDL_OPTS);
  const v    = info.videoDetails;
  return {
    title:     v.title          || "غير معروف",
    author:    v.author?.name   || "غير معروف",
    duration:  Number(v.lengthSeconds) || 0,
    views:     Number(v.viewCount)     || 0,
    url:       v.video_url      || videoUrl,
    thumb:     v.thumbnails?.[v.thumbnails.length - 1]?.url || ""
  };
}

function fmtDuration(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
    : `${m}:${String(s).padStart(2,"0")}`;
}

function fmtViews(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

function downloadStream(videoUrl, outPath, audioOnly) {
  return new Promise((resolve, reject) => {
    let done = false;
    const stream = ytdl(videoUrl, {
      filter:  audioOnly ? "audioonly" : "videoandaudio",
      quality: audioOnly ? "highestaudio" : "highest",
      ...YTDL_OPTS
    });
    const file = fs.createWriteStream(outPath);
    stream.pipe(file);
    stream.on("error", err => { if (!done) { done = true; file.destroy(); reject(err); } });
    file.on("finish", () => { if (!done) { done = true; resolve(outPath); } });
    file.on("error", err => { if (!done) { done = true; reject(err); } });
    setTimeout(() => { if (!done) { done = true; stream.destroy(); file.destroy(); reject(new Error("انتهت المهلة")); } }, 240000);
  });
}

/* ════════════════════════════════════════ */
module.exports = {
  config: {
    name:             "ytb",
    aliases:          ["يوتيوب","youtube","yt"],
    version:          "3.0",
    author:           "ميكو | مطور: " + DEV_ID,
    countDown:        15,
    role:             0,
    shortDescription: { ar: "بحث وتنزيل من يوتيوب (فيديو أو صوت)" },
    longDescription:  { ar: "ابحث في يوتيوب وحمّل الفيديو أو الصوت مباشرة" },
    category:         "موسيقى",
    guide:            {
      ar:
        "  {pn} صوت [اسم/رابط]  ← تنزيل صوت MP3\n" +
        "  {pn} فيديو [اسم/رابط] ← تنزيل فيديو\n" +
        "  {pn} بحث [اسم]        ← نتائج بحث"
    }
  },

  onStart: async function({ message, args }) {
    const sub   = (args[0] || "").trim();
    const query = args.slice(1).join(" ").trim();

    if (!sub || !query) return message.reply(
      "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
      "     🎬  يوتيوب - الاستخدام\n" +
      "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
      "  ❖ .يوتيوب صوت [اسم]\n" +
      "  ❖ .يوتيوب فيديو [اسم]\n" +
      "  ❖ .يوتيوب بحث [اسم]\n" +
      "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
      "  مثال: .يوتيوب صوت shape of you"
    );

    const isAudio = ["صوت","audio","mp3","sound"].includes(sub);
    const isVideo = ["فيديو","video","vid"].includes(sub);
    const isSearch = ["بحث","search","info","معلومات"].includes(sub);

    if (!isAudio && !isVideo && !isSearch) return message.reply(
      "❌ الأمر غير صحيح.\nاستخدم: صوت | فيديو | بحث"
    );

    await message.reply("⏳ جاري البحث عن: " + query + " ...");

    try {
      const results = await ytSearch(query);
      const first   = results[0];
      const info    = await getInfo(first.url);

      if (isSearch) {
        return message.reply(
          "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
          "     📺  نتائج يوتيوب\n" +
          "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
          "  ❖ العنوان    ➜  " + info.title  + "\n" +
          "  ❖ القناة     ➜  " + info.author + "\n" +
          "  ❖ المدة      ➜  " + fmtDuration(info.duration) + "\n" +
          "  ❖ المشاهدات  ➜  " + fmtViews(info.views) + "\n" +
          "  ❖ الرابط     ➜  " + first.url + "\n" +
          "◈━━━━━━━━━━━━━━━━━━━━◈"
        );
      }

      // Check duration limit (15 min for video, 30 min for audio)
      const maxDur = isAudio ? 30 * 60 : 15 * 60;
      if (info.duration > maxDur) {
        return message.reply(
          "⚠️ الملف طويل جداً.\n" +
          "  ❖ الحد الأقصى للصوت: 30 دقيقة\n" +
          "  ❖ الحد الأقصى للفيديو: 15 دقيقة\n" +
          "  ❖ مدة الملف: " + fmtDuration(info.duration)
        );
      }

      const ts      = Date.now();
      const ext     = isAudio ? "m4a" : "mp4";
      const outPath = path.join(TMP_DIR, `ytb_${ts}.${ext}`);

      await message.reply(
        "⬇️ جاري التنزيل...\n" +
        "  ❖ " + info.title + "\n" +
        "  ❖ المدة: " + fmtDuration(info.duration)
      );

      await downloadStream(first.url, outPath, isAudio);

      const stat   = fs.statSync(outPath);
      const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);

      if (stat.size < 1000) {
        fs.unlinkSync(outPath);
        throw new Error("الملف فارغ");
      }
      if (stat.size > 50 * 1024 * 1024) {
        fs.unlinkSync(outPath);
        return message.reply("⚠️ الملف أكبر من 50 MB. جرّب مقطعاً أقصر.");
      }

      await message.reply({
        body:
          "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
          (isAudio ? "     🎵  الصوت جاهز\n" : "     🎬  الفيديو جاهز\n") +
          "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
          "  ❖ العنوان  ➜  " + info.title  + "\n" +
          "  ❖ القناة   ➜  " + info.author + "\n" +
          "  ❖ المدة    ➜  " + fmtDuration(info.duration) + "\n" +
          "  ❖ الحجم    ➜  " + sizeMB + " MB\n" +
          "◈━━━━━━━━━━━━━━━━━━━━◈",
        attachment: fs.createReadStream(outPath)
      });

      try { fs.unlinkSync(outPath); } catch(_) {}

    } catch(err) {
      console.error("[ytb]", err?.message);
      return message.reply(
        "❌ فشلت العملية.\n" +
        "💡 جرّب:\n" +
        "  • كتابة الاسم بالإنجليزية\n" +
        "  • التأكد من الاتصال بالإنترنت\n" +
        "  • اختيار مقطع أقصر"
      );
    }
  }
};
