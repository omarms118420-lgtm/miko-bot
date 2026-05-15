const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { spawn } = require("child_process");

const DEV_ID = "61576232405796";
const TMP_DIR = path.join(__dirname, "tmp");
fs.ensureDirSync(TMP_DIR);

// ─── تنزيل صوت عبر yt-dlp (بدون ffmpeg) ───
function downloadAudioYtdlp(query, outTemplate) {
  return new Promise((resolve, reject) => {
    const args = [
      "-m", "yt_dlp",
      `ytsearch1:${query}`,
      "--no-playlist",
      "--no-warnings",
      "--format", "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio",
      "--output", outTemplate,
      "--no-part",
      "--socket-timeout", "30",
      "--retries", "3",
      "--extractor-args", "youtube:skip=dash"
    ];
    const proc = spawn("python3", args, { timeout: 180000 });
    let stderr = "";
    let stdout = "";
    proc.stderr.on("data", d => { stderr += d.toString(); });
    proc.stdout.on("data", d => { stdout += d.toString(); });
    proc.on("close", () => {
      // ابحث عن ملف تم تنزيله
      const dir = path.dirname(outTemplate);
      const base = path.basename(outTemplate).replace("%(ext)s", "");
      try {
        const files = fs.readdirSync(dir).filter(f => f.startsWith(base.replace("%(ext)s", "")));
        for (const f of files) {
          const full = path.join(dir, f);
          if (fs.statSync(full).size > 5000) return resolve({ path: full, title: extractTitle(stdout + stderr) });
        }
      } catch (_) {}
      reject(new Error(stderr.slice(-300) || "yt-dlp failed"));
    });
    proc.on("error", reject);
  });
}

function extractTitle(output) {
  const m = output.match(/\[download\] Destination: .+?([^/\\]+)\.(m4a|webm|mp3|opus)/) ||
            output.match(/Title: (.+)/);
  return m ? m[1].trim() : "الأغنية";
}

// ─── بحث Deezer للمعلومات ───
async function searchDeezer(query) {
  try {
    const r = await axios.get("https://api.deezer.com/search", {
      params: { q: query, limit: 1 },
      timeout: 8000
    });
    return r.data?.data?.[0] || null;
  } catch (_) { return null; }
}

module.exports = {
  config: {
    name: "song",
    aliases: ["أغنية", "موسيقى", "music", "اغنية", "صوت", "اغنيه", "mp3", "اغاني"],
    version: "6.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 15,
    role: 0,
    shortDescription: { ar: "البحث عن أغنية وإرسالها كاملة" },
    longDescription: { ar: "يبحث عن الأغنية ويرسلها كاملة من يوتيوب" },
    category: "موسيقى",
    guide: { ar: "{pn} [اسم الأغنية أو الفنان]\nمثال: .موسيقى shape of you\nمثال: .اغنية عمرو دياب" }
  },

  onStart: async function ({ message, args }) {
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
    const statusMsg = await message.reply("🎵 جاري البحث عن: " + query + " ...");

    let title = query;
    let artist = "غير معروف";
    let album = "غير معروف";

    // جلب معلومات من Deezer
    try {
      const deezer = await searchDeezer(query);
      if (deezer) {
        title = deezer.title || query;
        artist = deezer.artist?.name || "غير معروف";
        album = deezer.album?.title || "غير معروف";
      }
    } catch (_) {}

    const ts = Date.now();
    const outTemplate = path.join(TMP_DIR, `song_${ts}.%(ext)s`);

    try {
      const result = await downloadAudioYtdlp(query, outTemplate);
      const filePath = result.path;
      const sizeMB = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(2);

      if (fs.statSync(filePath).size > 50 * 1024 * 1024) {
        try { fs.unlinkSync(filePath); } catch (_) {}
        return message.reply("⚠️ الأغنية كبيرة جداً (أكثر من 50 MB). جرّب أغنية أخرى.");
      }

      const infoMsg =
        "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
        "     🎵  نتيجة البحث\n" +
        "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
        "  ❖ الأغنية  ➜  " + title + "\n" +
        "  ❖ الفنان   ➜  " + artist + "\n" +
        "  ❖ الألبوم  ➜  " + album + "\n" +
        "  ❖ الحجم    ➜  " + sizeMB + " MB\n" +
        "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
        "  🎧 الأغنية كاملة\n" +
        "◈━━━━━━━━━━━━━━━━━━━━◈";

      await message.reply({
        body: infoMsg,
        attachment: fs.createReadStream(filePath)
      });

      try { fs.unlinkSync(filePath); } catch (_) {}

    } catch (err) {
      console.error("[song]", err?.message);
      // تنظيف أي ملفات مؤقتة
      try {
        const files = fs.readdirSync(TMP_DIR).filter(f => f.startsWith(`song_${ts}`));
        files.forEach(f => { try { fs.unlinkSync(path.join(TMP_DIR, f)); } catch (_) {} });
      } catch (_) {}
      return message.reply(
        "❌ لم يتم العثور على الأغنية.\n" +
        "💡 جرّب:\n" +
        "  • كتابة الاسم بالإنجليزية\n" +
        "  • إضافة اسم الفنان\n" +
        "  • مثال: .موسيقى amr diab"
      );
    }
  }
};
