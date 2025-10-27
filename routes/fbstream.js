
// بسم الله الرحمن الرحيم ✨
// Facebook Live Scraper API
// إطلاق بث مباشر باستخدام ffmpeg عبر GET

const express = require("express");
const { spawn} = require("child_process");

const router = express.Router();
const userStreams = {};

/**
 * إطلاق بث مباشر
 * @param {string} sender - معرف المستخدم
 * @param {string} key - مفتاح البث
 * @param {string} url - رابط m3u8
 * @param {function} log - دالة تسجيل
 * @returns {void}
 */
function launchStream(sender, key, url, log) {
  const rtmps = `rtmps://live-api-s.facebook.com:443/rtmp/${key}`;
  const args = [
    '-re',
    '-i', url,
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-tune', 'zerolatency',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    '-g', '60',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-ar', '44100',
    '-ac', '2',
    '-f', 'flv',
    rtmps
  ];

  const ffmpeg = spawn('ffmpeg', args);

  if (!userStreams[sender]) userStreams[sender] = {};
  userStreams[sender][key] = ffmpeg;

  ffmpeg.stderr.on('data', data => {
    const line = data.toString();
    if (line.toLowerCase().includes("error") || line.toLowerCase().includes("failed")) {
      log({ status: 500, success: false, message: "❌ خطأ في ffmpeg", error: line});
}
});

  ffmpeg.on('close', code => {
    delete userStreams[sender][key];
    if (code === 0) {
      log({ status: 200, success: true, message: "✅ تم إنهاء البث بنجاح."});
} else {
      log({ status: 500, success: false, message: "⚠️ تم إيقاف البث أو حدث خطأ غير متوقع."});
}
});

  log({
    status: 200,
    success: true,
    message: "🚀 تم إطلاق البث المباشر بنجاح!",
    rtmps,
    source: url
});
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/tools/facebook?sender=123&key=FB-abc123&url=https://server.com/live.m3u8
 */
router.get("/facebook", async (req, res) => {
  const { sender, key, url} = req.query;

  if (!sender ||!key ||!url) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال جميع البيانات المطلوبة: sender, key, url"
});
}

  launchStream(sender, key, url, result => {
    if (!res.headersSent) res.json(result);
});
});

module.exports = {
  path: "/api/tools",
  name: "facebook",
  type: "tools",
  url: `${global.t}/api/tools/facebook?sender=123&key=FB-abc123&url=https://server.com/live.m3u8`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "اطلاق بثوث تست",
  router
};
