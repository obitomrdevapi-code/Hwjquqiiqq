const express = require("express");
const axios = require("axios");
const router = express.Router();

const API_URL = "https://api.yabes-desu.workers.dev/ai/tool/txt2video";

/**
 * تحويل وصف نصي إلى رابط فيديو
 * @param {string} prompt - الوصف النصي للفيديو
 * @returns {Promise<string>} - رابط الفيديو الناتج
 */
async function fetchVideoFromPrompt(prompt) {
  const encoded = encodeURIComponent(prompt);
  const { data, headers} = await axios.get(`${API_URL}?prompt=${encoded}`, {
    timeout: 600000,
});

  const contentType = headers["content-type"] || "";
  let videoUrl = null;

  if (contentType.includes("application/json")) {
    videoUrl = data.url || data.video || data.result || data.data;
}

  return videoUrl;
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/media/txt2video?prompt=boy%20talking%20about%20poverty
 */
router.get("/sora_beta", async (req, res) => {
  const prompt = (req.query.prompt || "").trim();
  if (!prompt) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال وصف نصي صالح",
});
}

  try {
    const videoUrl = await fetchVideoFromPrompt(prompt);
    if (!videoUrl) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "🚫 لم يتم العثور على رابط فيديو.",
});
}

    res.json({
      status: 200,
      success: true,
      prompt,
      video: videoUrl,
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "❌ حدث خطأ أثناء تحويل الوصف إلى فيديو.",
      error: err.message,
});
}
});

module.exports = {
  path: "/api/ai",
  name: "sora beta",
  type: "ai",
  url: `${global.t}/api/ai/sora_beta?prompt=boy%20talking%20about%20poverty`,
  logo: "https://qu.ax/ai2vid.png",
  description: "تحويل وصف نصي إلى فيديو باستخدام الذكاء الاصطناعي",
  router,
};
