const express = require("express");
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

  try {
    const streamInfo = await launchStream(streamKey, m3u8);

    return res.status(200).json({
      status: 200,
      success: true,
      message: "✅ تم إطلاق البث المباشر بنجاح!",
      stream: streamInfo
});
} catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "❌ حدث خطأ أثناء تشغيل البث",
      details: error.message
});
}
});

async function launchStream(streamKey, m3u8Url) {
  const rtmpBase = "rtmps://live-api-s.facebook.com:443/rtmp/";
  const fullRtmpUrl = `${rtmpBase}${streamKey}`;
  const startTime = new Date().toISOString();

  // محاولة اشتقاق رابط MPD من رابط m3u8
  let mpdUrl = m3u8Url.replace(/\.m3u8$/, ".mpd");

  const ffmpegArgs = [
    "-reconnect", "1",
    "-reconnect_streamed", "1",
    "-reconnect_delay_max", "300",
    "-rw_timeout", "30000000",
    "-timeout", "30000000",
    "-i", m3u8Url,
    "-c:v", "copy",
    "-c:a", "copy",
    "-f", "flv",
    fullRtmpUrl
  ];

  const ffmpeg = spawn("ffmpeg", ffmpegArgs, { stdio: "ignore", detached: true});
  ffmpeg.unref();

  return {
    streamKey,
    m3u8Url,
    mpdUrl,
    rtmpUrl: fullRtmpUrl,
    pid: ffmpeg.pid,
    startedAt: startTime
};
}

module.exports = {
  path: "/api/stream",
  name: "tst",
  type: "tools",
  url: `${global.t}/api/stream/fbstream?streamKey=مفتاح_البث&m3u8=رابط_m3u8`,
  logo: "https://i.ibb.co/3yYgLZy/facebook-live.jpg",
  description: "تست",
  router
};
