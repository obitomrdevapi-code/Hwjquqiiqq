const express = require("express");
const axios = require("axios");

const router = express.Router();

/**
 * جلب بيانات الفيديو من get-save.com API
 * @param {string} videoUrl
 * @returns {Promise<object[]>}
 */
async function fetchRawVideoData(videoUrl) {
  const endpoint = "https://api.get-save.com/api/v1/vidinfo";
  try {
    const { data} = await axios.post(endpoint, { url: videoUrl}, {
      headers: { "Content-Type": "application/json"}
});

    return data?.sizes || [];
} catch (err) {
    throw new Error("فشل في جلب البيانات من API: " + err.message);
}
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/video/scrap?url=https://youtube.com/watch?v=T0ZDIFvvtJc
 */
router.get("/youtube", async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl ||!/^https?:\/\/(www\.)?youtube\.com\/watch\?v=/.test(videoUrl)) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "يرجى إدخال رابط فيديو يوتيوب صالح"
});
}

  try {
    const rawData = await fetchRawVideoData(videoUrl);
    const sorted = rawData.map(item => ({
      type: item.type,
      quality: item.quality,
      hasAudio: item.hasAudio,
      size: item.size,
      url: item.url
}));

    res.json({
      status: 200,
      success: true,
      count: sorted.length,
      formats: sorted
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء جلب البيانات",
      error: err.message
});
}
});

module.exports = {
  path: "/api/download",
  name: "YouTube download",
  type: "download",
  url: `${global.t}/api/download/youtube?url=https://youtube.com/watch?v=T0ZDIFvvtJc`,
  logo: "",
  description: "تحميل المقاطع من اليوتيوب",
  router
};
