const express = require("express");
const axios = require("axios");
const { spawn} = require("child_process");

const router = express.Router();

router.get("/fbstream", async (req, res) => {
  const { streamKey, m3u8} = req.query;

  if (!streamKey ||!m3u8) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "يرجى إدخال كل من streamKey و m3u8!"
});
}

  // تحقق مرن من صلاحية رابط m3u8
  try {
    const check = await axios.get(m3u8, {
      timeout: 5000,
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://www.facebook.com"
}
});

    const contentType = check.headers["content-type"] || "";
    if (
      check.status!== 200 ||
      (!contentType.includes("mpegurl") &&!contentType.includes("application"))
) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "رابط m3u8 غير صالح أو لا يستجيب بشكل صحيح."
});
}
} catch (err) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "تعذر الوصول إلى رابط m3u8. تأكد من صحته."
});
}

  // محاولة استخراج رابط MPD من نفس النطاق
  const mpdUrl = m3u8.includes("live-hls")
? m3u8.replace("live-hls", "live-dash").replace(".m3u8", ".mpd")
: m3u8.replace(".m3u8", ".mpd");

  // إطلاق FFmpeg
  const rtmpUrl = `rtmps://live-api-s.facebook.com:443/rtmp/${streamKey}`;
  const ffmpegArgs = [
    "-reconnect", "1",
    "-reconnect_streamed", "1",
    "-reconnect_delay_max", "300",
    "-rw_timeout", "30000000",
    "-timeout", "30000000",
    "-i", m3u8,
    "-c:v", "copy",
    "-c:a", "copy",
    "-f", "flv",
    rtmpUrl
  ];

  try {
    const ffmpeg = spawn("ffmpeg", ffmpegArgs, { stdio: "ignore", detached: true});
    ffmpeg.unref();

    return res.status(200).json({
      status: 200,
      success: true,
      message: "✅ تم إطلاق البث المباشر بنجاح!",
      stream: {
        streamKey,
        m3u8Url: m3u8,
        mpdUrl,
        rtmpUrl,
        pid: ffmpeg.pid,
        startedAt: new Date().toISOString()
}
});
} catch (error) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "❌ فشل إطلاق FFmpeg",
      details: error.message
});
}
});

module.exports = {
  path: "/api/stream",
  name: "Facebook Live Stream",
  type: "stream",
  url: `${global.t}/api/stream/fbstream?streamKey=مفتاح_البث&m3u8=رابط_m3u8`,
  logo: "https://i.ibb.co/3yYgLZy/facebook-live.jpg",
  description: "تشغيل بث مباشر إلى Facebook باستخدام FFmpeg مع التحقق من صلاحية رابط m3u8 وعرض رابط MPD.",
  router
};