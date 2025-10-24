const express = require("express");
const { spawn} = require("child_process");

const router = express.Router();

// تخزين العمليات النشطة
const activeStreams = new Map();

/**
 * نقطة النهاية لتشغيل البث
 * مثال: /api/stream?key=test&m3u8=https://example.com/stream.m3u8
 */
router.get("/tetsuq", async (req, res) => {
  const { key, m3u8} = req.query;

  if (!key ||!m3u8 ||!m3u8.startsWith("http")) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال مفتاح ورابط m3u8 صالح"
});
}

  // إذا كان البث نشط مسبقًا
  if (activeStreams.has(key)) {
    return res.status(200).json({
      status: 200,
      success: true,
      message: `✅ البث '${key}' يعمل بالفعل`
});
}

  try {
    const ffmpegCmd = [
      "-re",
      "-i", m3u8,
      "-c:v", "copy",
      "-c:a", "aac",
      "-f", "flv",
      "rtmp://live.twitch.tv/app/live_XXXXXXXXXXXX" // ضع هنا وجهة البث
    ];

    const process = spawn("ffmpeg", ffmpegCmd);

    activeStreams.set(key, process);

    process.stderr.on("data", (data) => {
      console.log(`[${key}] ffmpeg: ${data}`);
});

    process.on("exit", () => {
      console.log(`🛑 البث '${key}' توقف`);
      activeStreams.delete(key);
});

    res.json({
      status: 200,
      success: true,
      message: `🚀 تم بدء البث '${key}' بنجاح`
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "❌ خطأ أثناء تشغيل البث",
      error: err.message
});
}
});

/**
 * نقطة لإيقاف البث
 * مثال: /api/stream/stop?key=test
 */
router.get("/tetsuq/stop", (req, res) => {
  const { key} = req.query;

  if (!activeStreams.has(key)) {
    return res.status(404).json({
      status: 404,
      success: false,
      message: "⚠️ لا يوجد بث بهذا المفتاح"
});
}

  activeStreams.get(key).kill("SIGTERM");
  activeStreams.delete(key);

  res.json({
    status: 200,
    success: true,
    message: `🛑 تم إيقاف البث '${key}'`
});
});

module.exports = {
  path: "/api/tst",
  name: "stream scraper",
  type: "tst",
  url: `${global.t}/api/tst/tetsuq?key=test&m3u8=https://example.com/stream.m3u8`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "تشغيل بث مباشر عبر ffmpeg باستخدام رابط m3u8",
  router
};
