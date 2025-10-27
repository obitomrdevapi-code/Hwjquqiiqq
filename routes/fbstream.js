```js
// بسم الله الرحمن الرحيم ✨
// Facebook Live Stream API
// إطلاق بث مباشر باستخدام ffmpeg

const express = require("express");
const { spawn} = require("child_process");

const router = express.Router();
const userStreams = {};

/**
 * إطلاق بث مباشر
 * @param {string} sender - معرف المستخدم
 * @param {string} key - مفتاح البث
 * @param {string} url - رابط m3u8
 * @returns {Promise<object>}
 */
async function launchStream(sender, key, url) {
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

  return new Promise((resolve, reject) => {
    try {
      const ffmpeg = spawn('ffmpeg', args);

      if (!userStreams[sender]) userStreams[sender] = {};
      userStreams[sender][key] = ffmpeg;

      ffmpeg.stderr.on('data', data => {
        const line = data.toString();
        if (line.toLowerCase().includes("error") || line.toLowerCase().includes("failed")) {
          reject({ success: false, message: "❌ خطأ في ffmpeg", error: line});
}
});

      ffmpeg.on('close', code => {
        delete userStreams[sender][key];
        if (code === 0) {
          resolve({ success: true, message: "✅ تم إنهاء البث بنجاح."});
} else {
          reject({ success: false, message: "⚠️ تم إيقاف البث أو حدث خطأ غير متوقع."});
}
});

      resolve({
        success: true,
        message: "🚀 تم إطلاق البث المباشر بنجاح!",
        rtmps,
        source: url
});

} catch (err) {
      reject({ success: false, message: "❌ خطأ أثناء تشغيل ffmpeg", error: err.message});
}
});
}

router.post("/facebook", async (req, res) => {
  const { sender, key, url} = req.body;

  if (!sender ||!key ||!url) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال جميع البيانات المطلوبة: sender, key, url"
});
}

  try {
    const result = await launchStream(sender, key, url);
    res.json({ status: 200,...result});
} catch (err) {
    res.status(500).json({ status: 500,...err});
}
});

module.exports = {
  path: "/api/tools",
  name: "facebook",
  type: "tools",
  url: `${global.t}/api/tools/facebook`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "اطلاق بثوث",
  router
};
```
