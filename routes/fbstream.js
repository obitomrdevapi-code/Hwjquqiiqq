
const express = require("express");
const { spawn} = require("child_process");

const router = express.Router();
const userStreams = {};

/**
 * إطلاق بث مباشر فعلي
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
    const ffmpeg = spawn('ffmpeg', args);

    if (!userStreams[sender]) userStreams[sender] = {};
    userStreams[sender][key] = ffmpeg;

    let responded = false;

    ffmpeg.stderr.on('data', data => {
      const line = data.toString();
      if (!responded && line.toLowerCase().includes("frame=")) {
        responded = true;
        res.json({
          status: 200,
          success: true,
          message: "🚀 تم إطلاق البث المباشر بنجاح!",
          rtmps,
          source: url
});
}

      if (line.toLowerCase().includes("error") || line.toLowerCase().includes("failed")) {
        if (!responded) {
          responded = true;
          res.status(500).json({
            status: 500,
            success: false,
            message: "❌ خطأ في ffmpeg",
            error: line
});
}
}
});

    ffmpeg.on('close', code => {
      delete userStreams[sender][key];
      if (!responded) {
        responded = true;
        res.status(500).json({
          status: 500,
          success: false,
          message: "⚠️ تم إيقاف البث أو حدث خطأ غير متوقع."
});
}
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
  description: "اطلاق بثوث 0",
  router
};
