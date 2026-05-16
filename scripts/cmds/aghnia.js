const axios  = require("axios");
const fs     = require("fs-extra");
const path   = require("path");
const ytdl   = require("@distube/ytdl-core");
const { spawn } = require("child_process");

const DEV_ID  = "61576232405796";
const TMP_DIR = path.join(__dirname, "..", "assets", "tmp");
fs.ensureDirSync(TMP_DIR);

/* ── ffmpeg path ── */
let FFMPEG_PATH = null;
try { FFMPEG_PATH = require("ffmpeg-static"); } catch(_) {}

/* ── Google TTS ── */
async function textToSpeech(text, outPath) {
  const MAX_CHARS = 180;
  const words     = text.split(/\s+/);
  const parts     = [];
  let   cur       = [];

  for (const w of words) {
    cur.push(w);
    if (cur.join(" ").length >= MAX_CHARS) { parts.push(cur.join(" ")); cur = []; }
  }
  if (cur.length) parts.push(cur.join(" "));

  const chunks = [];
  for (let i = 0; i < parts.length; i++) {
    const part      = parts[i];
    const chunkPath = path.join(TMP_DIR, `tts_${Date.now()}_${i}.mp3`);
    const url       = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(part)}&tl=ar&client=tw-ob&total=${parts.length}&idx=${i}&textlen=${part.length}&prev=input`;

    const r = await axios.get(url, {
      responseType: "stream",
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
        "Referer":    "https://translate.google.com/"
      }
    });

    const writer = fs.createWriteStream(chunkPath);
    r.data.pipe(writer);
    await new Promise((res, rej) => { writer.on("finish", res); writer.on("error", rej); });
    if (fs.existsSync(chunkPath) && fs.statSync(chunkPath).size > 100) chunks.push(chunkPath);
  }

  if (!chunks.length) throw new Error("فشل توليد الصوت من Google TTS");

  if (chunks.length === 1) {
    fs.copyFileSync(chunks[0], outPath);
    try { fs.unlinkSync(chunks[0]); } catch(_) {}
    return outPath;
  }

  // Merge chunks with ffmpeg
  if (FFMPEG_PATH) {
    const listFile = path.join(TMP_DIR, `list_${Date.now()}.txt`);
    fs.writeFileSync(listFile, chunks.map(c => `file '${c}'`).join("\n"));
    await runFfmpeg(["-f","concat","-safe","0","-i",listFile,"-c","copy",outPath,"-y"]);
    try { fs.unlinkSync(listFile); } catch(_) {}
    chunks.forEach(c => { try { fs.unlinkSync(c); } catch(_) {} });
  } else {
    // Concatenate buffers manually (no ffmpeg)
    const bufs = chunks.map(c => fs.readFileSync(c));
    fs.writeFileSync(outPath, Buffer.concat(bufs));
    chunks.forEach(c => { try { fs.unlinkSync(c); } catch(_) {} });
  }
  return outPath;
}

/* ── ffmpeg runner ── */
function runFfmpeg(args) {
  const bin = FFMPEG_PATH || "ffmpeg";
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args, { timeout: 90000 });
    let err = "";
    proc.stderr.on("data", d => { err += d.toString(); });
    proc.on("close", code => { if (code === 0) resolve(); else reject(new Error(err.slice(-200))); });
    proc.on("error", reject);
  });
}

/* ── Download background beat via ytdl-core (replaces yt-dlp) ── */
async function downloadBeat(outPath) {
  const BEAT_QUERIES = [
    "moroccan gnawa instrumental background music no copyright",
    "arabic background music instrumental loop",
    "oriental arabic beat instrumental royalty free"
  ];
  const query = BEAT_QUERIES[Math.floor(Math.random() * BEAT_QUERIES.length)];

  // YouTube search
  const url = "https://www.youtube.com/results?search_query=" + encodeURIComponent(query);
  const res = await axios.get(url, {
    timeout: 10000,
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36" }
  });

  const match = res.data.match(/"videoId":"([^"]{11})"/);
  if (!match) throw new Error("لا توجد نتائج للموسيقى الخلفية");

  const videoUrl = "https://www.youtube.com/watch?v=" + match[1];

  // Check duration < 10 min
  try {
    const info = await ytdl.getBasicInfo(videoUrl, {
      requestOptions: { headers: { "User-Agent": "Mozilla/5.0" } }
    });
    if (Number(info.videoDetails.lengthSeconds) > 600) throw new Error("طويل جداً");
  } catch(e) {
    if (e.message === "طويل جداً") throw e;
    // ignore info errors
  }

  return new Promise((resolve, reject) => {
    let done = false;
    const stream = ytdl(videoUrl, {
      filter:  "audioonly",
      quality: "lowestaudio",
      requestOptions: { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } }
    });
    const file = fs.createWriteStream(outPath);
    stream.pipe(file);
    stream.on("error", e => { if (!done) { done = true; file.destroy(); reject(e); } });
    file.on("finish", () => { if (!done) { done = true; resolve(outPath); } });
    file.on("error", e => { if (!done) { done = true; reject(e); } });
    setTimeout(() => { if (!done) { done = true; stream.destroy(); file.destroy(); reject(new Error("انتهت المهلة")); } }, 90000);
  });
}

/* ── Mix voice + beat ── */
async function mixVoiceWithBeat(voicePath, beatPath, outPath) {
  await runFfmpeg([
    "-i", voicePath,
    "-i", beatPath,
    "-filter_complex",
    "[0:a]volume=2.0[voice];[1:a]volume=0.25,atrim=0:300[beat];[voice][beat]amix=inputs=2:duration=first:dropout_transition=2[out]",
    "-map", "[out]",
    "-codec:a", "libmp3lame",
    "-q:a", "4",
    "-t", "300",
    outPath, "-y"
  ]);
  return outPath;
}

/* ── Enhance voice only ── */
async function enhanceVoice(voicePath, outPath) {
  await runFfmpeg([
    "-i", voicePath,
    "-af", "aecho=0.6:0.6:50:0.3,volume=1.8",
    "-codec:a", "libmp3lame",
    "-q:a", "4",
    outPath, "-y"
  ]);
  return outPath;
}

/* ════════════════════════════════════════ */
module.exports = {
  config: {
    name:             "aghnia",
    aliases:          ["انشئ-اغنية","صنع-اغنية","اغنية-مغربية","create-song","اصنع-اغنية","اغنيه-مغربيه"],
    version:          "3.0",
    author:           "ميكو | مطور: " + DEV_ID,
    countDown:        30,
    role:             0,
    shortDescription: { ar: "إنشاء أغنية بصوت عربي مع موسيقى" },
    longDescription:  { ar: "اكتب كلمات الأغنية وسيُنشئ البوت صوتاً عربياً مع موسيقى مغربية اختيارياً" },
    category:         "موسيقى",
    guide:            { ar: "{pn} [كلمات الأغنية]\nمثال: .اغنية-مغربية يا قلبي لا تحزن الدنيا جميلة" }
  },

  onStart: async function({ message, args }) {
    if (!args.length) return message.reply(
      "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
      "   🎤  إنشاء أغنية مغربية\n" +
      "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
      "  اكتب كلمات أغنيتك وسأنشئ\n" +
      "  صوتاً عربياً مع موسيقى 🎵\n" +
      "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
      "  الاستخدام:\n" +
      "  .اغنية-مغربية [الكلمات]\n" +
      "  مثال: .اغنية-مغربية يا قلبي لا تحزن\n" +
      "◈━━━━━━━━━━━━━━━━━━━━◈"
    );

    const lyrics = args.join(" ");
    if (lyrics.length > 500) return message.reply("⚠️ الكلمات طويلة جداً. الحد الأقصى 500 حرف.");

    await message.reply(
      "🎤 جاري إنشاء أغنيتك...\n" +
      "⏳ يستغرق ذلك 20-40 ثانية، انتظر..."
    );

    const ts           = Date.now();
    const voicePath    = path.join(TMP_DIR, `voice_${ts}.mp3`);
    const beatPath     = path.join(TMP_DIR, `beat_${ts}.m4a`);
    const enhancedPath = path.join(TMP_DIR, `enh_${ts}.mp3`);
    const finalPath    = path.join(TMP_DIR, `aghnia_${ts}.mp3`);

    const cleanup = () => {
      for (const p of [voicePath, beatPath, enhancedPath, finalPath]) {
        try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch(_) {}
      }
    };

    try {
      /* 1. Generate TTS voice */
      await textToSpeech(lyrics, voicePath);
      if (!fs.existsSync(voicePath) || fs.statSync(voicePath).size < 500)
        throw new Error("فشل توليد الصوت");

      let resultPath = voicePath;
      let hasMusic   = false;

      if (FFMPEG_PATH) {
        /* 2. Try to download background music */
        let beatOk = false;
        try {
          await downloadBeat(beatPath);
          beatOk = fs.existsSync(beatPath) && fs.statSync(beatPath).size > 5000;
        } catch(e) {
          console.warn("[aghnia] beat download failed:", e.message);
        }

        if (beatOk) {
          /* 3. Mix voice + beat */
          try {
            await mixVoiceWithBeat(voicePath, beatPath, finalPath);
            if (fs.existsSync(finalPath) && fs.statSync(finalPath).size > 1000) {
              resultPath = finalPath;
              hasMusic   = true;
            }
          } catch(e) {
            console.warn("[aghnia] mix failed:", e.message);
          }
          try { fs.unlinkSync(beatPath); } catch(_) {}
        }

        /* 4. Fallback: enhance voice only */
        if (!hasMusic) {
          try {
            await enhanceVoice(voicePath, enhancedPath);
            if (fs.existsSync(enhancedPath) && fs.statSync(enhancedPath).size > 1000)
              resultPath = enhancedPath;
          } catch(_) {}
        }
      }

      const sizeMB = (fs.statSync(resultPath).size / (1024 * 1024)).toFixed(2);

      await message.reply({
        body:
          "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
          "   🎤  أغنيتك جاهزة! 🇲🇦\n" +
          "◈━━━━━━━━━━━━━━━━━━━━◈\n" +
          "  ❖ الكلمات: " + lyrics.slice(0, 60) + (lyrics.length > 60 ? "..." : "") + "\n" +
          (hasMusic
            ? "  ❖ النوع: صوت + موسيقى مغربية 🎵\n"
            : "  ❖ النوع: صوت عربي 🎙️\n") +
          "  ❖ الحجم: " + sizeMB + " MB\n" +
          "◈━━━━━━━━━━━━━━━━━━━━◈",
        attachment: fs.createReadStream(resultPath)
      });

      cleanup();

    } catch(err) {
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
