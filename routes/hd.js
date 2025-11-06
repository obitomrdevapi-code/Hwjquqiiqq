const express = require("express");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const { default: fetch} = require("node-fetch");

const router = express.Router();

/**
 * دالة لتحسين الصورة من رابط مباشر
 * @param {string} imageUrl - رابط الصورة
 * @returns {Promise<object>}
 */
async function upscaleImageFromUrl(imageUrl) {
  const buffer = await (await fetch(imageUrl)).buffer();
  const ext = path.extname(imageUrl).slice(1) || "jpg";
  const mime = ext === "png"? "image/png": ext === "jpg" || ext === "jpeg"? "image/jpeg": "application/octet-stream";
  const fileName = Math.random().toString(36).slice(2, 8) + "." + ext;

  const { data: signed} = await axios.post("https://pxpic.com/getSignedUrl", {
    folder: "uploads",
    fileName
}, {
    headers: { "Content-Type": "application/json"}
});

  await axios.put(signed.presignedUrl, buffer, {
    headers: { "Content-Type": mime}
});

  const uploadedUrl = "https://files.fotoenhancer.com/uploads/" + fileName;

  const { data: result} = await axios.post("https://pxpic.com/callAiFunction", new URLSearchParams({
    imageUrl: uploadedUrl,
    targetFormat: "png",
    needCompress: "no",
    imageQuality: "100",
    compressLevel: "6",
    fileOriginalExtension: "png",
    aiFunction: "upscale",
    upscalingLevel: ""
}).toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8",
      "Content-Type": "application/x-www-form-urlencoded",
      "accept-language": "id-ID"
}
});

  const formatSize = size => {
    const round = (value, precision) => {
      const multiplier = Math.pow(10, precision || 0);
      return Math.round(value * multiplier) / multiplier;
};
    const KB = 1024;
    const MB = KB * KB;
    const GB = KB * MB;
    const TB = KB * GB;
    if (size < KB) return size + "B";
    else if (size < MB) return round(size / KB, 1) + "KB";
    else if (size < GB) return round(size / MB, 1) + "MB";
    else if (size < TB) return round(size / GB, 1) + "GB";
    else return round(size / TB, 1) + "TB";
};

  const finalBuffer = await (await fetch(result.resultImageUrl)).buffer();
  const size = formatSize(finalBuffer.length);

  return {
    status: 200,
    success: true,
    result: {
      original: imageUrl,
      enhanced: result.resultImageUrl,
      size
}
};
}

/**
 * نقطة النهاية: /api/upscale?url=<رابط صورة>
 */
router.get("/hd", async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl ||!/^https?:\/\/.+\.(jpg|jpeg|png)$/i.test(imageUrl)) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إرسال رابط صورة صالح بصيغة JPG أو PNG عبر?url="
});
}

  try {
    const result = await upscaleImageFromUrl(imageUrl);
    res.json(result);
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "❌ حدث خطأ أثناء تحسين الصورة.",
      error: err.message
});
}
});

module.exports = {
  path: "/api/ai",
  name: "Image hd",
  type: "ai",
  url: `${global.t}/api/ai/hd?url=https://example.com/image.jpg`,
  logo: "https://files.fotoenhancer.com/favicon.ico",
  description: "تحسين جودة الصور",
  router
};