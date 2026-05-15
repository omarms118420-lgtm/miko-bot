// keepalive.js
module.exports = {
  // لا يُستدعى بالاستدعاء العادي، بل يُستعمل لتشغيل البوت في الخلفية
  config: {
    name: "keepalive",
    aliases: [],
    version: "1.0",
    author: "ميكو AI",
    countDown: 0,
    role: 0,
    shortDescription: { ar: "يُشغل البوت في الخلفية ويمنع الإيقاف" },
    longDescription: { ar: "يُرسل طلب HTTP دوري إلى خادم “keep‑alive” ويُجعل البوت يعمل بلا انقطاع." },
    category: "أدوات",
    guide: { ar: "" } // لا يحتاج إلى دليل
  },

  onStart: async function ({ api, threadsData, usersData }) {
    // 1. إعداد متغيرات
    const keepAliveUrl = "https://example.com/heartbeat"; // أضف عنوانك هنا
    const intervalMs = 5 * 60 * 1000; // 5 دقائق

    // 2. دالة لإرسال الطلب
    const ping = async () => {
      try {
        const res = await fetch(keepAliveUrl, { method: "GET" });
        if (!res.ok) {
          console.warn("[KeepAlive] الخادم غير متاح:", res.status);
        } else {
          console.log("[KeepAlive] تم إرسال طلب بنجاح:", new Date().toISOString());
        }
      } catch (err) {
        console.error("[KeepAlive] خطأ أثناء الإرسال:", err.message);
      }
    };

    // 3. إرسال أول طلب فوراً
    await ping();

    // 4. ضبط الـ interval لتكرار الطلب كل 5 دقائق
    setInterval(ping, intervalMs);

    // 5. إضافة حدث بسيط لمنع الإيقاف في حال حدوث خطأ غير متوقع
    process.on("unhandledRejection", (reason, promise) => {
      console.error("[KeepAlive] وعد غير معالج:", reason);
    });
    process.on("uncaughtException", err => {
      console.error("[KeepAlive] استثناء غير معالج:", err);
    });

    // لا نحتاج لإرسال رسالة في الدردشة؛ البوت سيستمر في العمل في الخلفية
  }
};