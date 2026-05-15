const fs = require("fs-extra");
const axios = require("axios");
const cheerio = require("cheerio");
const qs = require("qs");
const path = require("path");

function cleanCache(cacheDir) {
  try {
    if (!fs.existsSync(cacheDir)) return;
    const files = fs.readdirSync(cacheDir);
    let deleted = 0;
    for (const file of files) {
      try {
        fs.unlinkSync(path.join(cacheDir, file));
        deleted++;
      } catch (_) {}
    }
    if (deleted > 0) console.log(`[Cache] 🧹 Cleaned ${deleted} file(s) from cache`);
  } catch (err) {
    console.error('[Cache] Cleanup error:', err.message);
  }
}

function randomString(length = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

function loadAutoLinkStates() {
  try { return JSON.parse(fs.readFileSync("autolink.json", "utf8")); }
  catch { return {}; }
}
function saveAutoLinkStates(states) {
  fs.writeFileSync("autolink.json", JSON.stringify(states, null, 2));
}

let autoLinkStates = loadAutoLinkStates();

const urlPatterns = {
  youtube:       /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
  instagram:     /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\/(?:p|reel|tv|stories)\/[\w-]+\/?/i,
  facebookStory: /(?:https?:\/\/)?(?:www\.|web\.|m\.)?facebook\.com\/stories\/(\d+)\/([\w]+)\/?/i,
  // ✅ regex محدّث يدعم: /share/r/ و /share/v/ و /watch/?share_url= و /watch/?v=
  facebook:      /(?:https?:\/\/)?(?:www\.|web\.|m\.|mobile\.)?(?:facebook\.com|fb\.watch|fb\.me)\/(?:watch(?:\/|\?[^\s"']*)|reel\/[\w.-]*\/?|[\w.-]+\/videos\/[\w.-]*\/?|video\.php\?v=[\w.-]+|share\/(?:video|r|v)\/[\w.-]*\/?)/i,
  tiktok:        /(?:https?:\/\/)?(?:www\.)?(?:tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)\/[@\w.-]+\/video\/\d+\/?|(?:https?:\/\/)?(?:vm|vt)\.tiktok\.com\/[\w]+\/?/i,
  twitter:       /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/[\w]+\/status\/\d+\/?/i,
  pinterest:     /(?:https?:\/\/)?(?:www\.)?(?:pinterest\.com|pin\.it)\/(?:pin\/\d+\/|[\w.-]+\/[\w.-]+\/)/i
};

module.exports = {
  config: {
    name: "تحميل",
    version: "11.4.0",
    author: "Enhanced + FB Stories Support",
    countDown: 5,
    role: 0,
    shortDescription: { en: "أداة تحميل فيديو تلقائية" },
    longDescription: { en: "تحميل من يوتيوب، تيك توك، تويتر، إنستغرام، فيسبوك (Watch, Reels, Videos, Stories, Share)، بينتريست" },
    category: "الغروب",
    guide: { en: "{p}{n} أو -تحميل تشغيل | -تحميل إيقاف" }
  },

  langs: {
    en: {
      disableSuccess: "✅ تم إيقاف التحميل التلقائي في هذه المحادثة.",
      enableSuccess:  "✅ تم تشغيل التحميل التلقائي في هذه المحادثة.",
      autoPrompt:     "📥 أمر التحميل يشتغل تلقائي، فقط أرسل أي رابط.",
      downloadFailed: "❌ فشل الإرسال بعد 3 محاولات"
    }
  },

  onStart: async function ({ message, event, getLang }) {
    const threadID = event.threadID;
    if (!autoLinkStates[threadID]) {
      autoLinkStates[threadID] = "on";
      saveAutoLinkStates(autoLinkStates);
    }
    const body = event.body?.toLowerCase().trim();
    if (body === "-تحميل إيقاف") {
      autoLinkStates[threadID] = "off";
      saveAutoLinkStates(autoLinkStates);
      return message.reply(getLang("disableSuccess"));
    }
    if (body === "-تحميل تشغيل") {
      autoLinkStates[threadID] = "on";
      saveAutoLinkStates(autoLinkStates);
      return message.reply(getLang("enableSuccess"));
    }
    return message.reply(getLang("autoPrompt"));
  },

  onChat: async function ({ event, message, getLang }) {
    const threadID = event.threadID;
    if (!autoLinkStates[threadID] || autoLinkStates[threadID] === "off") return;

    const foundURLs = event.body?.match(/(https?:\/\/[^\s]+)/g);
    if (!foundURLs?.length) return;

    const videoUrl = foundURLs[0];
    const platform = this.detectPlatform(videoUrl);
    if (!platform) return;

    try {
      await message.reaction("⏳", event.messageID);
      switch (platform.type) {
        case 'youtube':       await this.downloadFromYouTube(videoUrl, message, event); break;
        case 'instagram':     await this.downloadInstagram(videoUrl, message, event); break;
        case 'facebookStory': await this.downloadFacebookStory(videoUrl, message, event); break;
        case 'facebook':      await this.downloadFacebook(videoUrl, message, event); break;
        case 'tiktok':        await this.downloadTikTok(videoUrl, message, event); break;
        case 'twitter':       await this.downloadTwitter(videoUrl, message, event); break;
        case 'pinterest':     await this.downloadPinterest(videoUrl, message, event); break;
        default: await message.reaction("❌", event.messageID); return;
      }
    } catch (err) {
      await message.reaction("❌", event.messageID);
      console.error(`[${platform.type}] Error:`, err.message);
    }
  },

  detectPlatform(url) {
    for (const [type, regex] of Object.entries(urlPatterns)) {
      const match = url.match(regex);
      if (match) return { type, match };
    }
    return null;
  },

  // ─── إرسال الملف مع ضمان اكتمال الكتابة ───────────────────────────────────
  async sendFile(message, event, filePath, caption, maxRetries = 3) {
    if (!fs.existsSync(filePath)) throw new Error("File not found: " + filePath);
    const size = fs.statSync(filePath).size;
    if (size === 0) throw new Error("File is empty");

    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Send] Attempt ${attempt}/${maxRetries} | Size: ${(size/1024/1024).toFixed(2)}MB`);
        const stream = fs.createReadStream(filePath);
        await new Promise((resolve, reject) => {
          stream.once('error', reject);
          stream.once('end', resolve);
          stream.resume();
        }).catch(() => {});
        const sendStream = fs.createReadStream(filePath);
        await message.reply({ body: caption, attachment: sendStream });
        await message.reaction("✅", event.messageID);
        console.log(`[Send] ✅ Success — cache cleanup in 5 min`);
        const cacheDir = path.dirname(filePath);
        setTimeout(() => cleanCache(cacheDir), 5 * 60 * 1000);
        return true;
      } catch (err) {
        lastError = err;
        console.error(`[Send] ❌ Attempt ${attempt} failed:`, err.message);
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, attempt * 3000));
        }
      }
    }
    cleanCache(path.dirname(filePath));
    await message.reaction("❌", event.messageID);
    throw lastError;
  },

  // ─── تحميل ملف بـ stream مباشرة ───────────────────────────────────────────
  async downloadStream(url, filePath, headers = {}) {
    await fs.ensureDir(path.dirname(filePath));
    const response = await axios({
      method: 'GET',
      url,
      responseType: 'stream',
      timeout: 180000,
      maxRedirects: 10,
      headers: { 'User-Agent': 'Mozilla/5.0', ...headers }
    });
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
      response.data.on('error', reject);
    });
    const size = fs.statSync(filePath).size;
    if (size === 0) throw new Error("Downloaded file is empty");
    console.log(`[Download] ✅ ${(size/1024/1024).toFixed(2)}MB saved to ${path.basename(filePath)}`);
  },

  // ─── YOUTUBE ──────────────────────────────────────────────────────────────
  async downloadFromYouTube(videoUrl, message, event) {
    const filePath = path.join(__dirname, 'cache', `ytb_${Date.now()}_${randomString(5)}.mp4`);
    try {
      const result = await this.getYouTubeDownloadUrl(videoUrl);
      await this.downloadStream(result.downloadUrl, filePath);
      const sizeMB = (fs.statSync(filePath).size / 1024 / 1024).toFixed(2);
      await this.sendFile(message, event, filePath, `🎥 ${result.title || 'يوتيوب'}\n📊 ${sizeMB}MB`);
    } catch (err) {
      cleanCache(path.dirname(filePath));
      throw err;
    }
  },

  async getYouTubeDownloadUrl(url) {
    const encoded = encodeURIComponent(url);
    const res = await axios.get(
      `https://p.savenow.to/ajax/download.php?button=1&start=1&end=1&format=480&iframe_source=https://www.y2down.app,&url=${encoded}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 }
    );
    const { progress_url: prgsurl, title } = res.data;
    if (!prgsurl) throw new Error("No progress URL");
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 1500));
      const { data } = await axios.get(prgsurl, { timeout: 8000 });
      if (data.success === 1 && data.progress === 1000 && data.download_url)
        return { downloadUrl: data.download_url, title };
    }
    throw new Error("YouTube timeout");
  },

  // ─── INSTAGRAM ────────────────────────────────────────────────────────────
  async downloadInstagram(url, message, event) {
    const filePath = path.join(__dirname, 'cache', `ig_${Date.now()}_${randomString(5)}.mp4`);
    try {
      const shortcodeMatch = url.match(/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
      if (!shortcodeMatch) throw new Error("رابط غير صالح");
      const videoUrl = await this.getInstagramVideoGraphQL(shortcodeMatch[1]);
      if (!videoUrl) throw new Error("لم يتم العثور على الفيديو");
      await this.downloadStream(videoUrl, filePath, { 'Referer': 'https://www.instagram.com/' });
      const sizeMB = (fs.statSync(filePath).size / 1024 / 1024).toFixed(2);
      await this.sendFile(message, event, filePath, `📸 إنستغرام\n📊 ${sizeMB}MB`);
    } catch (err) {
      cleanCache(path.dirname(filePath));
      throw err;
    }
  },

  async getInstagramVideoGraphQL(shortcode) {
    const docIds = ['6588824391221552', '8845758582119845', '25951867524398782'];
    for (const docId of docIds) {
      try {
        const data = qs.stringify({
          '__csr': 'g8O6PMgtlstaTROFrirqcLGHyWIyQGiyqp9ahkq9GqtRAz92eAHl4ypUG-QOVGAlWJyp9mi8heUCV8hA8cKozKqvyVbiABCBx11y8xeESUpxB004NODw90w0lBx22d0CzU0nUw1ZG0Bh4FsM9u1Sg0gswdeOm1fwxBwhU14poeU2_c0pa0hicxh045w0amy',
          'lsd': '2rW6RSUw1Z2nlKhvaIITDn',
          'variables': JSON.stringify({ shortcode }),
          'doc_id': docId
        });
        const response = await axios({
          method: 'POST',
          url: 'https://www.instagram.com/api/graphql',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 12; SM-P615N) AppleWebKit/537.36',
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-ig-app-id': '936619743392459',
            'X-Fb-Lsd': '2rW6RSUw1Z2nlKhvaIITDn'
          },
          data,
          timeout: 20000
        });
        const videoUrl = this.extractVideoUrl(response.data);
        if (videoUrl) return videoUrl;
      } catch { continue; }
    }
    return null;
  },

  extractVideoUrl(data) {
    const paths = [
      ['data', 'xdt_shortcode_media', 'video_url'],
      ['data', 'shortcode_media', 'video_url'],
      ['data', 'xdt_api__v1__media__shortcode__web_info', 'items', 0, 'video_versions', 0, 'url']
    ];
    for (const p of paths) {
      let obj = data;
      for (const key of p) {
        if (obj && key in obj) obj = obj[key]; else { obj = null; break; }
      }
      if (typeof obj === 'string' && obj.includes('http')) return obj;
    }
    const find = (obj, d = 0) => {
      if (d > 10 || !obj || typeof obj !== 'object') return null;
      if (obj.video_url && typeof obj.video_url === 'string') return obj.video_url;
      if (obj.url && typeof obj.url === 'string' && obj.url.includes('.mp4')) return obj.url;
      for (const key in obj) { const r = find(obj[key], d + 1); if (r) return r; }
      return null;
    };
    return find(data);
  },

  // ─── FACEBOOK STORY ───────────────────────────────────────────────────────
  async downloadFacebookStory(url, message, event) {
    const filePath = path.join(__dirname, 'cache', `fbstory_${Date.now()}_${randomString(5)}.mp4`);
    try {
      console.log(`[FB Story] Trying to download: ${url}`);

      let videoUrl = await this.getFacebookStoryUrl_SnapSave(url);
      if (videoUrl) console.log("[FB Story] ✅ Got URL from SnapSave");

      if (!videoUrl) {
        videoUrl = await this.getFacebookStoryUrl_Fdown(url);
        if (videoUrl) console.log("[FB Story] ✅ Got URL from Fdown");
      }

      if (!videoUrl) {
        videoUrl = await this.getFacebookStoryUrl_Getfvid(url);
        if (videoUrl) console.log("[FB Story] ✅ Got URL from Getfvid");
      }

      if (!videoUrl) {
        videoUrl = await this.getFacebookStoryUrl_SaveFrom(url);
        if (videoUrl) console.log("[FB Story] ✅ Got URL from SaveFrom");
      }

      if (!videoUrl) throw new Error("لم يتم العثور على رابط القصة من أي مصدر");

      await this.downloadStream(videoUrl, filePath, {
        'Referer': 'https://www.facebook.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });
      const sizeMB = (fs.statSync(filePath).size / 1024 / 1024).toFixed(2);
      await this.sendFile(message, event, filePath, `📖 قصة فيسبوك\n📊 ${sizeMB}MB`);
    } catch (err) {
      cleanCache(path.dirname(filePath));
      throw err;
    }
  },

  async getFacebookStoryUrl_SnapSave(url) {
    try {
      const response = await axios.post(
        "https://snapsave.app/action.php?lang=vn",
        { url },
        {
          headers: {
            "content-type": "multipart/form-data",
            "referer": "https://snapsave.app/vn",
            "User-Agent": "Mozilla/5.0"
          },
          timeout: 15000
        }
      );
      let html;
      const evalCode = response.data.replace("return decodeURIComponent", "html = decodeURIComponent");
      eval(evalCode);
      if (!html) return null;
      html = html.split('innerHTML = "')[1]?.split('";\n')[0]?.replace(/\\"/g, '"');
      if (!html) return null;
      const $ = cheerio.load(html);
      let videoUrl = null;
      $("table tbody tr").each((i, el) => {
        const href = $(el).find("td a").attr("href");
        if (href && !videoUrl) videoUrl = href;
      });
      return videoUrl;
    } catch (err) {
      console.error("[FB Story][SnapSave] Error:", err.message);
      return null;
    }
  },

  async getFacebookStoryUrl_Fdown(url) {
    try {
      const { data } = await axios.post(
        "https://fdown.net/download.php",
        qs.stringify({ URLz: url }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Referer": "https://fdown.net/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          },
          timeout: 15000
        }
      );
      const $ = cheerio.load(data);
      const hdLink = $("#hdlink").attr("href");
      const sdLink = $("#sdlink").attr("href");
      return hdLink || sdLink || null;
    } catch (err) {
      console.error("[FB Story][Fdown] Error:", err.message);
      return null;
    }
  },

  async getFacebookStoryUrl_Getfvid(url) {
    try {
      const { data } = await axios.post(
        "https://www.getfvid.com/downloader",
        qs.stringify({ url }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Referer": "https://www.getfvid.com/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          },
          timeout: 15000
        }
      );
      const $ = cheerio.load(data);
      let videoUrl = null;
      $("a").each((i, el) => {
        const href = $(el).attr("href");
        if (href && (href.includes(".mp4") || href.includes("video")) && !videoUrl) videoUrl = href;
      });
      return videoUrl;
    } catch (err) {
      console.error("[FB Story][Getfvid] Error:", err.message);
      return null;
    }
  },

  async getFacebookStoryUrl_SaveFrom(url) {
    try {
      const { data } = await axios.get(
        `https://savefrom.net/api/convert?url=${encodeURIComponent(url)}&lang=ar`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://savefrom.net/"
          },
          timeout: 15000
        }
      );
      if (!data || !data.url) return null;
      const links = Array.isArray(data.url) ? data.url : [data.url];
      const mp4Link = links.find(l => l?.url && (l.url.includes(".mp4") || l.ext === "mp4"));
      return mp4Link?.url || null;
    } catch (err) {
      console.error("[FB Story][SaveFrom] Error:", err.message);
      return null;
    }
  },

  // ─── FACEBOOK (Videos/Reels/Watch/Share) ──────────────────────────────────
  async downloadFacebook(url, message, event) {
    const filePath = path.join(__dirname, 'cache', `fb_${Date.now()}_${randomString(5)}.mp4`);
    try {
      // ✅ حل الـ redirect لروابط /share/v/ و /share/r/ و /watch/?share_url=
      let resolvedUrl = url;
      if (url.includes('/share/') || url.includes('share_url=')) {
        try {
          const res = await axios.get(url, {
            maxRedirects: 10,
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept-Language': 'ar,en;q=0.9'
            }
          });
          const finalUrl = res.request?.res?.responseUrl || res.config?.url || url;
          if (finalUrl && finalUrl !== url) {
            resolvedUrl = finalUrl;
            console.log(`[FB] Resolved redirect: ${resolvedUrl}`);
          }
        } catch (redirectErr) {
          console.warn(`[FB] Redirect resolve failed, using original URL:`, redirectErr.message);
        }
      }

      const res = await this.fbDownloader(resolvedUrl);
      const videoUrl = res?.download?.[0]?.url;
      if (!videoUrl) throw new Error("لا يوجد رابط تحميل");
      await this.downloadStream(videoUrl, filePath);
      const sizeMB = (fs.statSync(filePath).size / 1024 / 1024).toFixed(2);
      await this.sendFile(message, event, filePath, `📘 فيسبوك\n📊 ${sizeMB}MB`);
    } catch (err) {
      cleanCache(path.dirname(filePath));
      throw err;
    }
  },

  async fbDownloader(url) {
    try {
      const response1 = await axios.post(
        "https://snapsave.app/action.php?lang=vn",
        { url },
        { headers: { "content-type": "multipart/form-data", "referer": "https://snapsave.app/vn" }, timeout: 15000 }
      );
      let html;
      const evalCode = response1.data.replace("return decodeURIComponent", "html = decodeURIComponent");
      eval(evalCode);
      html = html.split('innerHTML = "')[1].split('";\n')[0].replace(/\\"/g, '"');
      const $ = cheerio.load(html);
      const download = [];
      $("table tbody tr").each((i, el) => {
        const quality = $(el).find("td").eq(0).text().trim();
        const videoUrl = $(el).find("td a").attr("href");
        if (videoUrl) download.push({ quality, url: videoUrl });
      });
      return { success: true, download };
    } catch (err) {
      console.error("[Facebook] Error:", err.message);
      return { success: false };
    }
  },

  // ─── TIKTOK ───────────────────────────────────────────────────────────────
  async downloadTikTok(url, message, event) {
    const filePath = path.join(__dirname, 'cache', `tiktok_${Date.now()}_${randomString(5)}.mp4`);
    try {
      const { data } = await axios.get(
        `https://noobs-api.top/dipto/alldl?url=${encodeURIComponent(url)}`,
        { timeout: 30000 }
      );
      if (!data?.result) throw new Error("لم يتم العثور على رابط");
      await this.downloadStream(data.result, filePath);
      const sizeMB = (fs.statSync(filePath).size / 1024 / 1024).toFixed(2);
      await this.sendFile(message, event, filePath, `🎵 ${data.title || 'تيك توك'}\n📊 ${sizeMB}MB`);
    } catch (err) {
      cleanCache(path.dirname(filePath));
      throw err;
    }
  },

  // ─── TWITTER ──────────────────────────────────────────────────────────────
  async downloadTwitter(url, message, event) {
    const filePath = path.join(__dirname, 'cache', `twitter_${Date.now()}_${randomString(5)}.mp4`);
    try {
      const { data } = await axios.get(
        `https://noobs-api.top/dipto/alldl?url=${encodeURIComponent(url)}`,
        { timeout: 30000 }
      );
      if (!data?.result) throw new Error("لم يتم العثور على رابط");
      await this.downloadStream(data.result, filePath);
      const sizeMB = (fs.statSync(filePath).size / 1024 / 1024).toFixed(2);
      await this.sendFile(message, event, filePath, `🐦 ${data.title || 'تويتر'}\n📊 ${sizeMB}MB`);
    } catch (err) {
      cleanCache(path.dirname(filePath));
      throw err;
    }
  },

  // ─── PINTEREST ────────────────────────────────────────────────────────────
  async downloadPinterest(url, message, event) {
    const filePath = path.join(__dirname, 'cache', `pinterest_${Date.now()}_${randomString(5)}.mp4`);
    try {
      const { data } = await axios.get(
        `https://pindl-pinterest.vercel.app/kshitiz?url=${encodeURIComponent(url)}`,
        { timeout: 15000 }
      );
      if (!data?.url) throw new Error("لم يتم العثور على رابط");
      await this.downloadStream(data.url, filePath);
      const sizeMB = (fs.statSync(filePath).size / 1024 / 1024).toFixed(2);
      await this.sendFile(message, event, filePath, `📌 بينتريست\n📊 ${sizeMB}MB`);
    } catch (err) {
      cleanCache(path.dirname(filePath));
      throw err;
    }
  }
};