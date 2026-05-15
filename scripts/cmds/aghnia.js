const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { spawn, execFileSync } = require("child_process");

const DEV_ID = "61576232405796";
const TMP_DIR = path.join(__dirname, "tmp");
fs.ensureDirSync(TMP_DIR);

// مسار ffmpeg الثابت
let FFMPEG_PATH = null;
try { FFMPEG_PATH = require("ffmpeg-static"); } catch (_) {}

// ─── تحويل نص → MP3 عبر Google TTS ───
async function textToSpeech(text, outPath) {
  const chunks = [];
  // تقسيم النص إذا كان طويلاً
  const words = text.split(/\s+/);
  const parts = [];
  let current = [];
  for (const w of words) {
    current.push(w);
    if (current.join(" ").length >= 180) { parts.push(current.join(" ")); current = []; }
  }
  if (current.length) parts.push(current.join(" "));

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const chunkPath = path.join(TMP_DIR, `tts_chunk_${Date.now()}_${i}.mp3`);
    const encoded = encodeURIComponent(part);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=ar&client=tw-ob&total=${parts.length}&idx=${i}&textlen=${part.length}&prev=input`;
    const r = await axios.get(url, {
      responseType: "stream",
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
        "Referer": "https://translate.google.com/"
      }
    });
    const writer = fs.createWriteStream(chunkPath);
    r.data.pipe(writer);
    await new Promise((res, rej) => { writer.on("finish", res); writer.on("error", rej); });
    if (fs.existsSync(chunkPath) && fs.statSync(chunkPath).size > 100) chunks.push(chunkPath);
  }

  if (!chunks.length) throw new Error("فشل توليد الصوت");

  if (chunks.length === 1) {
    fs.copyFileSync(chunks[0], outPath);
    fs.unlinkSync(chunks[0]);
    return outPath;
  }

  // دمج الأجزاء إذا كانت متعددة
  if (FFMPEG_PATH) {
    const listFile = path.join(TMP_DIR, `list_${Date.now()}.txt`);
    fs.writeFileSync(listFile, chunks.map(c => `file '${c}'`).join("\n"));
    await runFfmpeg(["-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", outPath, "-y"]);
    fs.unlinkSync(listFile);
    chunks.forEach(c => { try { fs.unlinkSync(c); } catch (_) {} });
  } else {
    fs.copyFileSync(chunks[0], outPath);
    chunks.forEach(c => { try { fs.unlinkSync(c); } catch (_) {} });
  }
  return outPath;
}

// ─── تشغيل ffmpeg ───
function runFfmpeg(args) {
  const bin = FFMPEG_PATH || "ffmpeg";
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args, { timeout: 90000 });
    let err = "";
    proc.stderr.on("data", d => { err += d.toString(); });
    proc.on("close", code => {
      if (code === 0) resolve();
      else reject(new Error(err.slice(-200)));
    });
    proc.on("error", reject);
  });
}

// ─── تنزيل موسيقى خلفية مغربية من يوتيوب ───
function downloadBeatYtdlp(query, outTemplate) {
  return new Promise((resolve, reject) => {
    const args = [
      "-m", "yt_dlp",
      `ytsearch1:${query}`,
      "--no-playlist",
      "--no-warnings",
      "--format", "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio",
      "--output", outTemplate,
      "--no-part",
      "--socket-timeout", "20",
      "--retries", "2",
      "--max-downloads", "1",
      "--match-filter", "duration < 400",
      "--extractor-args", "youtube:skip=dash"
    ];
    const proc = spawn("python3", args, { timeout: 90000 });
    let stdout = "";
    proc.stdout.on("data", d => { stdout += d.toString(); });
    proc.stderr.on("data", () => {});
    proc.on("close", () => {
      const dir = path.dirname(outTemplate);
      try {
        const files = fs.readdirSync(dir).filter(f => {
          const full = path.join(dir, f);
          return f.includes("beat_") && fs.statSync(full).size > 5000;
        });
        if (files.length) return resolve(path.join(dir, files[0]));
      } catch (_) {}
      reject(new Error("فشل تنزيل الموسيقى الخلفية"));
    });
    proc.on("error", reject);
  });
}

// ─── دمج صوت + موسيقى خلفية ───
async function mixVoiceWithBeat(voicePath, beatPath, outPath) {
  // خفّض صوت الموسيقى وارفع الصوت الأصلي
  await runFfmpeg([
    "-i", voicePath,
    "-i", beatPath,
    "-filter_complex",
    "[0:a]volume=2.0,aecho=0.5:0.5:40:0.2[voice];[1:a]volume=0.30,atrim=0:300[beat];[voice][beat]amix=inputs=2:duration=first:dropout_transition=2[out]",
    "-map", "[out]",
    "-codec:a", "libmp3lame",
    "-q:a", "3",
    "-t", "300",
    outPath,
    "-y"
  ]);
  return outPath;
}

// ─── تحسين الصوت فقط (بدون موسيقى) ───
async function enhanceVoice(voicePath, outPath) {
  await runFfmpeg([
    "-i", voicePath,
    "-af", "aecho=0.6:0.6:50:0.3,equalizer=f=300:width_type=o:width=2:g=4,volume=1.8",
    "-codec:a", "libmp3lame",
    "-q:a", "3",
    outPath,
    "-y"
  ]);
  return outPath;
}

const BEAT_QUERIES = [
  "moroccan gnawa instrumental beat background music no copyright",
  "arabic music background instrumental loop",
  "chaabi marocain instrumental beat",
  "oriental arabic beat instrumental royalty free"
];

module.exports = {
  config: {
    name: "aghnia",
    aliases: ["انشئ-اغنية", "صنع-اغنية", "اغنية-مغربية", "create-song", "اصنع-اغنية", "اغنيه-مغربيه"],
    version: "2.0",
    author: "ميكو | مطور: " + DEV_ID,
    countDown: 30,
    role: 0,
    shortDescription: { ar: "إنشاء أغنية بصوت مغربي مع موسيقى" },
    longDescription: { ar: "اكتب كلمات الأغنية وسيُنشئ البوت أغنية بصوت عربي مع موسيقى مغربية" },
    category: "موسيقى",
    guide: { ar: "{pn} [كلمات الأغنية]\nمثال: .اغنية-مغربية يا قلبي لا تحزن الدنيا جميلة" }
  },

  onStart: async function ({ message, args }) {
    if (!args.length) {
      return message.reply(
        "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
        "   🎤  إنشاء أغنية مغربية\n" +
        "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
        "  اكتب كلمات أغنيتك وسأنشئ\n" +
        "  أغنية بصوت مغربي مع موسيقى 🎵\n" +
        "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
        "  الاستخدام:\n" +
        "  .اغنية-مغربية [الكلمات]\n" +
        "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
        "  مثال:\n" +
        "  .اغنية-مغربية يا قلبي لا تحزن\n" +
        "◈━━━━━━━━━━━━━━━━━━━━◈"
      );
    }

    const lyrics = args.join(" ");

    if (lyrics.length > 500) {
      return message.reply("⚠️ الكلمات طويلة جداً. الحد الأقصى 500 حرف.");
    }

    await message.reply(
      "🎤 جاري إنشاء أغنيتك المغربية...\n" +
      "⏳ يستغرق ذلك 20-40 ثانية، انتظر..."
    );

    const ts = Date.now();
    const voicePath = path.join(TMP_DIR, `voice_${ts}.mp3`);
    const beatTemplate = path.join(TMP_DIR, `beat_${ts}.%(ext)s`);
    const enhancedPath = path.join(TMP_DIR, `enhanced_${ts}.mp3`);
    const finalPath = path.join(TMP_DIR, `aghnia_${ts}.mp3`);

    const cleanup = () => {
      for (const p of [voicePath, enhancedPath]) {
        try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch (_) {}
      }
      try {
        const files = fs.readdirSync(TMP_DIR).filter(f => f.includes(`_${ts}`));
        files.forEach(f => { try { fs.unlinkSync(path.join(TMP_DIR, f)); } catch (_) {} });
      } catch (_) {}
    };

    try {
      // 1. توليد الصوت
      await textToSpeech(lyrics, voicePath);

      if (!fs.existsSync(voicePath) || fs.statSync(voicePath).size < 500) {
        throw new Error("فشل توليد الصوت");
      }

      let resultPath = voicePath;

      if (FFMPEG_PATH) {
        // 2. محاولة تنزيل موسيقى خلفية مغربية
        let beatPath = null;
        const beatQuery = BEAT_QUERIES[Math.floor(Math.random() * BEAT_QUERIES.length)];
        try {
          beatPath = await downloadBeatYtdlp(beatQuery, beatTemplate);
        } catch (_) {}

        if (beatPath && fs.existsSync(beatPath) && fs.statSync(beatPath).size > 5000) {
          // 3. دمج الصوت مع الموسيقى
          try {
            await mixVoiceWithBeat(voicePath, beatPath, finalPath);
            if (fs.existsSync(finalPath) && fs.statSync(finalPath).size > 1000) {
              resultPath = finalPath;
            }
          } catch (_) {
            // إذا فشل الدمج، استخدم تحسين الصوت فقط
            try {
              await enhanceVoice(voicePath, enhancedPath);
              if (fs.existsSync(enhancedPath) && fs.statSync(enhancedPath).size > 1000) resultPath = enhancedPath;
            } catch (_) {}
          }
          try { fs.unlinkSync(beatPath); } catch (_) {}
        } else {
          // بدون موسيقى - تحسين الصوت فقط
          try {
            await enhanceVoice(voicePath, enhancedPath);
            if (fs.existsSync(enhancedPath) && fs.statSync(enhancedPath).size > 1000) resultPath = enhancedPath;
          } catch (_) {}
        }
      }

      const sizeMB = (fs.statSync(resultPath).size / (1024 * 1024)).toFixed(2);
      const hasMusic = resultPath === finalPath;

      const infoMsg =
        "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
        "   🎤  أغنيتك جاهزة! 🇲🇦\n" +
        "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
        "  ❖ الكلمات: " + lyrics.slice(0, 60) + (lyrics.length > 60 ? "..." : "") + "\n" +
        (hasMusic ? "  ❖ النوع: صوت + موسيقى مغربية 🎵\n" : "  ❖ النوع: صوت عربي محسّن 🎙️\n") +
        "  ❖ الحجم: " + sizeMB + " MB\n" +
        "◈━━━━━━━━━━━━━━━━━━━━◈";

      await message.reply({
        body: infoMsg,
        attachment: fs.createReadStream(resultPath)
      });

      cleanup();

    } catch (err) {
      console.error("[aghnia]", err?.message);
      cleanup();
      return message.reply(
        "❌ فشل إنشاء الأغنية.\n" +
        "💡 تأكد من الاتصال بالإنترنت وحاول مجدداً.\n" +
        "📌 مثال: .اغنية-مغربية يا ليل يا عين"
      );
    }
  }
};
