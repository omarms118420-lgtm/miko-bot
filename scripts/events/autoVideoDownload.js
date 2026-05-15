const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { spawn } = require("child_process");

const TMP_DIR = path.join(__dirname, "tmp");
fs.ensureDirSync(TMP_DIR);

const PATTERNS = [
  { re: /https?:\/\/(?:www\.|vm\.|vt\.)?tiktok\.com\/\S+/i, platform: "tiktok", label: "TikTok 🎵" },
  { re: /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch|shorts)[^\s]*|youtu\.be\/[A-Za-z0-9_-]+)[^\s]*/i, platform: "youtube", label: "YouTube 🎬" },
  { re: /https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|reels|tv)\/[A-Za-z0-9_-]+[^\s]*/i, platform: "instagram", label: "Instagram 📸" },
  { re: /https?:\/\/(?:www\.|m\.)?facebook\.com\/(?:[^\s]*videos[^\s]*|watch[^\s]*|[^\s]*reels[^\s]*|[^\s]*reel[^\s]*|share\/[^\s]*)/i, platform: "facebook", label: "Facebook 🔵" },
  { re: /https?:\/\/fb\.watch\/[A-Za-z0-9_-]+/i, platform: "facebook", label: "Facebook 🔵" },
  { re: /https?:\/\/(?:www\.)?twitter\.com\/[^\s]+\/status\/\d+[^\s]*/i, platform: "twitter", label: "Twitter 🐦" },
  { re: /https?:\/\/x\.com\/[^\s]+\/status\/\d+[^\s]*/i, platform: "twitter", label: "Twitter 🐦" }
];

const cooldowns = new Map();
const COOLDOWN = 15000;

// ─── تنزيل مباشر (stream) ───
async function streamDownload(url, dest, headers = {}) {
  const r = await axios({
    method: "get", url,
    responseType: "stream",
    timeout: 120000,
    maxContentLength: 50 * 1024 * 1024,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
      ...headers
    },
    validateStatus: s => s < 400
  });
  const writer = fs.createWriteStream(dest);
  r.data.pipe(writer);
  return new Promise((res, rej) => { writer.on("finish", res); writer.on("error", rej); });
}

// ─── yt-dlp تنزيل فيديو ───
function runYtdlp(url, outTemplate, extraArgs = []) {
  return new Promise((resolve, reject) => {
    const args = [
      "-m", "yt_dlp",
      "--no-playlist",
      "--no-warnings",
      "--format", "best[ext=mp4][filesize<50M]/best[ext=mp4]/best[filesize<50M]/best",
      "--output", outTemplate,
      "--no-part",
      "--socket-timeout", "30",
      "--retries", "3",
      "--extractor-args", "youtube:skip=dash",
      ...extraArgs,
      url
    ];
    const proc = spawn("python3", args, { timeout: 180000 });
    let stderr = "";
    proc.stderr.on("data", d => { stderr += d.toString(); });
    proc.stdout.on("data", () => {});
    proc.on("close", () => {
      const dir = path.dirname(outTemplate);
      const base = path.basename(outTemplate).split(".%(ext)s")[0];
      try {
        const files = fs.readdirSync(dir).filter(f => f.startsWith(base));
        for (const f of files) {
          const full = path.join(dir, f);
          if (fs.statSync(full).size > 10000) return resolve(full);
        }
      } catch (_) {}
      reject(new Error(stderr.slice(-300) || "yt-dlp failed"));
    });
    proc.on("error", reject);
  });
}

const ok = (p) => { try { return p && fs.existsSync(p) && fs.statSync(p).size > 10000; } catch (_) { return false; } };

// ─── TikTok ───
async function downloadTiktok(url, outTemplate) {
  // محاولة embed
  let finalUrl = url;
  if (!url.includes("/video/")) {
    try {
      const rr = await axios.get(url, { maxRedirects: 5, headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)" }, timeout: 10000 });
      finalUrl = rr.request?.res?.responseUrl || url;
    } catch (_) {}
  }
  const idMatch = finalUrl.match(/\/video\/(\d+)/);
  if (idMatch) {
    try {
      const r = await axios.get(`https://www.tiktok.com/embed/v2/${idMatch[1]}`, {
        headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://www.tiktok.com/" },
        timeout: 15000
      });
      for (const pat of [/"playAddr"\s*:\s*"([^"]+)"/, /"downloadAddr"\s*:\s*"([^"]+)"/]) {
        const m = r.data.match(pat);
        if (m) {
          const direct = m[1].replace(/\\u002F/gi, "/").replace(/\\u0026/gi, "&").replace(/\\/g, "");
          if (direct.startsWith("http")) {
            const dest = outTemplate.replace("%(ext)s", "mp4");
            try {
              await streamDownload(direct, dest, { "Referer": "https://www.tiktok.com/" });
              if (ok(dest)) return dest;
            } catch (_) {}
          }
        }
      }
    } catch (_) {}
  }
  // fallback yt-dlp
  return await runYtdlp(url, outTemplate);
}

// ─── Instagram ───
async function downloadInstagram(url, outTemplate) {
  try {
    const postId = url.match(/\/(?:p|reel|reels|tv)\/([\w-]+)/)?.[1];
    if (postId) {
      const r = await axios.get(`https://www.instagram.com/p/${postId}/embed/captioned/`, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" },
        timeout: 12000
      });
      const mp4 = r.data.match(/https[^"']+\.mp4[^"']*/)?.[0]?.replace(/&amp;/g, "&");
      if (mp4) {
        const dest = outTemplate.replace("%(ext)s", "mp4");
        await streamDownload(mp4, dest, { "Referer": "https://www.instagram.com/" });
        if (ok(dest)) return dest;
      }
    }
  } catch (_) {}
  return await runYtdlp(url, outTemplate);
}

// ─── Facebook ───
async function downloadFacebook(url, outTemplate) {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9"
  };
  const pats = [
    /\"playable_url_quality_hd\":\"([^\"]+)\"/,
    /\"playable_url\":\"([^\"]+)\"/,
    /\"browser_native_hd_url\":\"([^\"]+)\"/,
    /\"browser_native_sd_url\":\"([^\"]+)\"/,
    /\"hd_src\":\"([^\"]+)\"/,
    /\"sd_src\":\"([^\"]+)\"/
  ];
  for (const tryUrl of [url, url.replace("www.facebook.com", "m.facebook.com")]) {
    try {
      const r = await axios.get(tryUrl, { headers, timeout: 15000, maxRedirects: 5 });
      for (const pat of pats) {
        const m = r.data.match(pat);
        if (m) {
          const v = m[1].replace(/\\u002F/gi, "/").replace(/\\u0026/gi, "&").replace(/\\/g, "");
          if (v.startsWith("http")) {
            const dest = outTemplate.replace("%(ext)s", "mp4");
            try {
              await streamDownload(v, dest, { "Referer": "https://www.facebook.com/" });
              if (ok(dest)) return dest;
            } catch (_) {}
          }
        }
      }
    } catch (_) {}
  }
  // yt-dlp للفيسبوك
  return await runYtdlp(url, outTemplate, ["--add-header", "Accept-Language:en-US,en;q=0.9"]);
}

// ─── YouTube ───
async function downloadYoutube(url, outTemplate) {
  return await runYtdlp(url, outTemplate);
}

// ─── Twitter/X ───
async function downloadTwitter(url, outTemplate) {
  return await runYtdlp(url, outTemplate);
}

// ─── المُنسّق الرئيسي ───
async function downloadVideo(url, platform) {
  const ts = Date.now();
  const outTemplate = path.join(TMP_DIR, `vid_${ts}.%(ext)s`);

  let filePath = null;
  try {
    if (platform === "tiktok") filePath = await downloadTiktok(url, outTemplate);
    else if (platform === "youtube") filePath = await downloadYoutube(url, outTemplate);
    else if (platform === "instagram") filePath = await downloadInstagram(url, outTemplate);
    else if (platform === "facebook") filePath = await downloadFacebook(url, outTemplate);
    else if (platform === "twitter") filePath = await downloadTwitter(url, outTemplate);
  } catch (err) {
    // حاول البحث في المجلد المؤقت
    try {
      const files = fs.readdirSync(TMP_DIR).filter(f => f.startsWith(`vid_${ts}`));
      for (const f of files) {
        const full = path.join(TMP_DIR, f);
        if (ok(full)) { filePath = full; break; }
      }
    } catch (_) {}
    if (!filePath) throw err;
  }

  if (!ok(filePath)) return null;
  return { path: filePath, size: fs.statSync(filePath).size };
}

module.exports = {
  config: {
    name: "autoVideoDownload",
    version: "7.0",
    author: "ميكو",
    category: "events",
    shortDescription: { ar: "تنزيل فيديوهات TikTok/YouTube/Instagram/Facebook/Twitter تلقائياً" }
  },

  onStart: async function () {},

  onChat: async function ({ api, event }) {
    if (event.type !== "message") return;
    const body = (event.body || "").trim();
    if (!body) return;

    let url = null, platform = null, label = null;
    for (const { re, platform: p, label: l } of PATTERNS) {
      const m = body.match(re);
      if (m) { url = m[0].trim(); platform = p; label = l; break; }
    }
    if (!url) return;

    const tid = event.threadID;
    const mid = event.messageID;
    const now = Date.now();
    if (now - (cooldowns.get(tid) || 0) < COOLDOWN) return;
    cooldowns.set(tid, now);

    try {
      // ⏳ تفاعل ساعة رملية
      try { api.setMessageReaction("⏳", mid, () => {}, true); } catch (_) {}

      const result = await downloadVideo(url, platform);

      if (!result) {
        try { api.setMessageReaction("❌", mid, () => {}, true); } catch (_) {}
        return api.sendMessage(`❌ تعذّر تنزيل الفيديو من ${label}\n📌 قد يكون خاصاً أو محمياً`, tid);
      }

      const sizeMB = result.size / (1024 * 1024);

      if (result.size > 50 * 1024 * 1024) {
        try { fs.unlinkSync(result.path); } catch (_) {}
        try { api.setMessageReaction("⚠️", mid, () => {}, true); } catch (_) {}
        return api.sendMessage(`⚠️ الفيديو كبير جداً (${sizeMB.toFixed(1)} MB) - الحد 50 MB`, tid);
      }

      // ✅ تفاعل علامة صح بعد نجاح التنزيل
      try { api.setMessageReaction("✅", mid, () => {}, true); } catch (_) {}

      api.sendMessage(
        { body: `${label} — ${sizeMB.toFixed(1)} MB`, attachment: fs.createReadStream(result.path) },
        tid,
        () => { try { fs.unlinkSync(result.path); } catch (_) {} }
      );

    } catch (err) {
      console.error("[autoVideoDownload]", err?.message);
      try { api.setMessageReaction("❌", mid, () => {}, true); } catch (_) {}
      try { api.sendMessage(`❌ خطأ في التنزيل من ${label}`, tid); } catch (_) {}
      // تنظيف أي ملفات مؤقتة
      try {
        const files = fs.readdirSync(TMP_DIR).filter(f => f.startsWith("vid_") && fs.statSync(path.join(TMP_DIR, f)).mtimeMs < Date.now() - 5 * 60 * 1000);
        files.forEach(f => { try { fs.unlinkSync(path.join(TMP_DIR, f)); } catch (_) {} });
      } catch (_) {}
    }
  }
};
