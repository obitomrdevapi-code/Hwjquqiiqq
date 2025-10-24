const express = require("express");
const { spawn} = require("child_process");

const router = express.Router();
const activeStreams = new Map();

function getRtmpUrl(key) {
  return `rtmps://live-api-s.facebook.com:443/rtmp/${key}`;
}

function startStream(key, m3u8, rtmpUrl) {
  const ffmpegCmd = [
    "-re",
    "-i", m3u8,
    "-c:v", "copy",
    "-c:a", "aac",
    "-f", "flv",
    rtmpUrl
  ];

  const process = spawn("ffmpeg", ffmpegCmd);
  activeStreams.set(key, process);

  process.stdout.on("data", (data) => {
    console.log(`[${key}] ffmpeg output: ${data.toString()}`);
});

  process.stderr.on("data", (data) => {
    console.error(`[${key}] ffmpeg error: ${data.toString()}`);
});

  process.on("error", (err) => {
    console.error(`[${key}] ffmpeg failed: ${err.message}`);
});

  process.on("exit", (code, signal) => {
    console.log(`🛑 البث '${key}' توقف (code: ${code}, signal: ${signal})`);
    activeStreams.delete(key);
    setTimeout(() => startStream(key, m3u8, rtmpUrl), 5000);
});

  monitorStream(key, m3u8, rtmpUrl);
}

function monitorStream(key, m3u8, rtmpUrl) {
  const process = activeStreams.get(key);
  if (!process) return;

  const interval = setInterval(() => {
    if (process.exitCode!== null) {
      clearInterval(interval);
      console.log(`⚠️ البث '${key}' توقف. إعادة التشغيل...`);
      startStream(key, m3u8, rtmpUrl);
}
}, 10000);
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
  startStream(key, m3u8, rtmpUrl);

  res.json({
    status: 200,
    success: true,
    message: `🚀 تم بدء البث '${key}' بنجاح إلى ${rtmpUrl}`
});
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
  path: "/api/qwertyuio",
  name: "stream scraper",
  type: "qwertyuio",
  url: `${global.t}/api/qwertyuio/stream?key=FB-xxxx&m3u8=https://example.com/stream.m3u8`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "تشغيل بث مباشر عبر ffmpeg باستخدام رابط m3u8",
  router
};
