const express = require("express");
const { spawn} = require("child_process");

const router = express.Router();
const activeStreams = new Map();

// ✅ رابط RTMP الحقيقي (غيّره حسب المنصة)
function getRtmpUrl(key) {
  return `rtmps://live-api-s.facebook.com:443/rtmp/${key}`;
}

router.get("/stream", async (req, res) => {
  const { key, m3u8} = req.query;

  if (!key ||!m3u8 ||!m3u8.startsWith("http")) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال مفتاح ورابط m3u8 صالح"
});
}

  if (activeStreams.has(key)) {
    return res.status(200).json({
      status: 200,
      success: true,
      message: `✅ البث '${key}' يعمل بالفعل`
});
}

  const rtmpUrl = getRtmpUrl(key);
  const ffmpegCmd = [
    "-re",
    "-i", m3u8,
    "-c:v", "copy",
    "-c:a", "aac",
    "-f", "flv",
    rtmpUrl
  ];

  try {
    const process = spawn("ffmpeg", ffmpegCmd);

    activeStreams.set(key, process);

    process.stderr.on("data", (data) => {
      console.log(`[${key}] ffmpeg log: ${data.toString()}`);
});

    process.on("error", (err) => {
      console.error(`[${key}] ffmpeg error: ${err.message}`);
});

    process.on("exit", (code, signal) => {
      console.log(`🛑 البث '${key}' توقف (code: ${code}, signal: ${signal})`);
      activeStreams.delete(key);
});

    res.json({
      status: 200,
      success: true,
      message: `🚀 تم بدء البث '${key}' بنجاح إلى ${rtmpUrl}`
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "❌ خطأ أثناء تشغيل ffmpeg",
      error: err.message
});
}
});

router.get("/stream/stop", (req, res) => {
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
  path: "/api/tqhqb",
  name: "stream scraper",
  type: "tqhqb",
  url: `${global.t}/api/tqhqb/stream?key=FB-xxxx&m3u8=https://example.com/stream.m3u8`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "تشغيل بث مباشر عبر ffmpeg باستخدام رابط m3u8",
  router
};
