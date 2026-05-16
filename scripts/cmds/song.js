const axios  = require("axios");
const fs     = require("fs-extra");
const path   = require("path");
const ytdl   = require("@distube/ytdl-core");

const DEV_ID  = "61576232405796";
const TMP_DIR = path.join(__dirname, "..", "assets", "tmp");
fs.ensureDirSync(TMP_DIR);

/* ── YouTube Search (no python, no yt-dlp) ── */
async function searchYouTube(query) {
  const url = "https://www.youtube.com/results?search_query=" + encodeURIComponent(query);
  const res = await axios.get(url, {
    timeout: 12000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9"
    }
  });
  const html  = res.data;
  const match = html.match(/"videoId":"([^"]{11})"/);
  if (!match) throw new Error("لا توجد نتائج");
  return {
    videoId: match[1],
    url:     "https://www.youtube.com/watch?v=" + match[1]
  };
}

/* ── Download audio via ytdl-core ── */
function downloadAudio(videoUrl, outPath) {
  return new Promise((resolve, reject) => {
    let errored = false;
    const stream = ytdl(videoUrl, {
      filter:  "audioonly",
      quality: "highestaudio",
      requestOptions: {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36"
        }
      }
    });

    const file = fs.createWriteStream(outPath);
    stream.pipe(file);

    stream.on("error", err => {
      errored = true;
      file.destroy();
      try { fs.unlinkSync(outPath); } catch(_) {}
      reject(err);
    });

    file.on("finish", () => {
      if (!errored) resolve(outPath);
    });

    file.on("error", err => {
      errored = true;
      reject(err);
    });

    // Timeout: 3 min
    setTimeout(() => {
      if (!errored) {
        stream.destroy();
        file.destroy();
        reject(new Error("انتهت مهلة التنزيل (3 دقائق)"));
      }
    }, 180000);
  });
}

/* ── Get title from ytdl info ── */
async function getInfo(videoUrl) {
  try {
    const info = await ytdl.getBasicInfo(videoUrl, {
      requestOptions: {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      }
    });
    const v = info.videoDetails;
    return {
      title:    v.title      || "غير معروف",
      author:   v.author?.name || "غير معروف",
      duration: v.lengthSeconds || 0
    };
  } catch(_) { return { title: "غير معروف", author: "غير معروف", duration: 0 }; }
}

/* ── Deezer fallback info ── */
async function searchDeezer(query) {
  try {
    const r = await axios.get("https://api.deezer.com/search", {
      params: { q: query, limit: 1 },
      timeout: 8000
    });
    return r.data?.data?.[0] || null;
  } catch(_) { return null; }
}

function fmtDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ════════════════════════════════════════ */
module.exports = {
  config: {
    name:             "song",
    aliases:          ["أغنية","موسيقى","music","اغنية","صوت","اغنيه","mp3","اغاني"],
    version:          "7.0",
    author:           "ميكو | مطور: " + DEV_ID,
    countDown:        15,
    role:             0,
    shortDescription: { ar: "البحث عن أغنية وإرسالها كاملة" },
    longDescription:  { ar: "يبحث عن الأغنية في يوتيوب ويرسلها كملف صوتي كامل" },
    category:         "موسيقى",
    guide:            { ar: "{pn} [اسم الأغنية]\nمثال: .موسيقى shape of you\nمثال: .اغنية عمرو دياب" }
  },

  onStart: async function({ message, args }) {
    if (!args.length) return message.reply(
      "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
      "     🎵  بحث موسيقى\n" +
      "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
      "  .موسيقى [اسم الأغنية]\n" +
      "  مثال: .موسيقى shape of you\n" +
      "  مثال: .اغنية عمرو دياب\n" +
      "◈━━━━━━━━━━━━━━━━━━━━◈"
    );

    const query = args.join(" ");
    await message.reply("🔍 جاري البحث عن: " + query + " ...");

    const ts      = Date.now();
    const outPath = path.join(TMP_DIR, `song_${ts}.m4a`);

    try {
      /* 1. Search YouTube */
      const yt = await searchYouTube(query);

      /* 2. Get video info + Deezer info in parallel */
      const [ytInfo, deezer] = await Promise.allSettled([
        getInfo(yt.url),
        searchDeezer(query)
      ]);

      const info    = ytInfo.status === "fulfilled"    ? ytInfo.value    : {};
      const dz      = deezer.status === "fulfilled"    ? deezer.value    : null;
      const title   = dz?.title        || info.title   || query;
      const artist  = dz?.artist?.name || info.author  || "غير معروف";
      const album   = dz?.album?.title || "غير معروف";
      const dur     = info.duration    ? fmtDuration(Number(info.duration)) : "--:--";

      /* 3. Download audio */
      await downloadAudio(yt.url, outPath);

      /* 4. Size check */
      const stat = fs.statSync(outPath);
      if (stat.size < 1000) throw new Error("الملف فارغ — يوتيوب رفض الطلب");
      if (stat.size > 50 * 1024 * 1024) {
        fs.unlinkSync(outPath);
        return message.reply("⚠️ الأغنية أكبر من 50 MB. جرّب أغنية أخرى.");
      }

      const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);

      /* 5. Send */
      await message.reply({
        body:
          "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
          "     🎵  تم إيجاد الأغنية\n" +
          "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
          "  ❖ الأغنية  ➜  " + title  + "\n" +
          "  ❖ الفنان   ➜  " + artist + "\n" +
          "  ❖ الألبوم  ➜  " + album  + "\n" +
          "  ❖ المدة    ➜  " + dur    + "\n" +
          "  ❖ الحجم    ➜  " + sizeMB + " MB\n" +
          "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
          "  🎧 الأغنية الكاملة 👇\n" +
          "◈━━━━━━━━━━━━━━━━━━━━◈",
        attachment: fs.createReadStream(outPath)
      });

      /* 6. Cleanup */
      try { fs.unlinkSync(outPath); } catch(_) {}

    } catch(err) {
      console.error("[song]", err?.message);
      try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch(_) {}
      return message.reply(
        "❌ فشل البحث أو التنزيل.\n" +
        "💡 جرّب:\n" +
        "  • كتابة الاسم بالإنجليزية\n" +
        "  • إضافة اسم الفنان\n" +
        "  • مثال: .موسيقى amr diab"
      );
    }
  }
};
