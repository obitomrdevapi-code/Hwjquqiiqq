const express = require("express");
const { spawn} = require("child_process");

const router = express.Router();
const userStreams = {};

router.get("/facebook", async (req, res) => {
  const { sender, key, url} = req.query;

  if (!sender ||!key ||!url) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال جميع البيانات المطلوبة: sender, key, url"
});
}

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

  try {
    const ffmpeg = spawn('ffmpeg', args, { detached: true, stdio: 'ignore'});

    if (!userStreams[sender]) userStreams[sender] = {};
    userStreams[sender][key] = ffmpeg;

    res.json({
      status: 200,
      success: true,
      message: "🚀 تم إطلاق البث المباشر بنجاح!",
      rtmps,
      source: url
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

module.exports = {
  path: "/api/tools",
  name: "facebook",
  type: "tools",
  url: `${global.t}/api/tools/facebook?sender=123&key=FB-abc123&url=https://server.com/live.m3u8`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "اطلاق بثوث",
  router
};
