// بسم الله الرحمن الرحيم ✨
// Terabox Video Downloader API
// تحميل الفيديوهات من موقع teraboxvideodownloader.pro

const express = require("express");
const axios = require("axios");
const CryptoJS = require("crypto-js");

const router = express.Router();
const encryptionKey = "website:teraboxvideodownloader.pro";

/**
 * تشفير رابط الفيديو باستخدام AES
 * @param {string} url - رابط الفيديو
 * @returns {string} - الرابط المشفر
 */
function encryptUrl(url) {
  return CryptoJS.AES.encrypt(url, encryptionKey).toString();
}

/**
 * إرسال الطلب إلى API teraboxvideodownloader.pro
 * @param {string} encryptedUrl - الرابط المشفر
 * @returns {Promise<object>}
 */
async function fetchVideoData(encryptedUrl) {
  const { data} = await axios.post(
    "https://teraboxvideodownloader.pro/api/video-downloader",
    { link: encryptedUrl},
    { headers: { "Content-Type": "application/json"}}
);
  return data;
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/download/terabox?url=https://1024terabox.com/s/1REdTPbZqbw9RHZImo8QXOg
 */
router.get("/terabox", async (req, res) => {
  const { url} = req.query;
  if (!url) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال رابط الفيديو"
});
}

  try {
    const encrypted = encryptUrl(url);
    const videoData = await fetchVideoData(encrypted);

    res.json({
      status: 200,
      success: true,
      originalUrl: url,
      data: videoData
});
} catch (err) {
    console.error("[Terabox Router] Error:", err.message || err);
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء تحميل الفيديو.",
      error: err.message
});
}
});

module.exports = {
  path: "/api/download",
  name: "terabox download",
  type: "download",
  url: `${global.t}/api/download/terabox?url=https://1024terabox.com/s/1REdTPbZqbw9RHZImo8QXOg`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "تحميل من terabox",
  router
};