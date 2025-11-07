const express = require("express");
const axios = require("axios");
const { XMLParser} = require("fast-xml-parser");

const router = express.Router();

/**
 * استخراج آخر أخبار Apple من MacRumors RSS
 * @returns {Promise<Array>}
 */
async function fetchAppleNews() {
  const rssUrl = "https://feeds.macrumors.com/MacRumors-All";
  const { data} = await axios.get(rssUrl);
  const parser = new XMLParser({ ignoreAttributes: false});
  const parsed = parser.parse(data);

  const items = parsed.rss?.channel?.item || [];
  const result = [];

  for (let i = 0; i < Math.min(items.length, 10); i++) {
    const item = items[i];
    const cleanDescription = item.description
?.replace(/<[^>]*>/g, "")
?.slice(0, 150) + "...";

    result.push({
      title: item.title || "لا عنوان",
      link: item.link || "لا رابط",
      description: cleanDescription || "لا يوجد وصف",
      pubDate: item.pubDate || "غير معروف"
});
}

  return result;
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/news/apple
 */
router.get("/apple", async (req, res) => {
  try {
    const news = await fetchAppleNews();
    res.json({
      status: 200,
      success: true,
      total: news.length,
      data: news
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء جلب الأخبار.",
      error: err.message
});
}
});

module.exports = {
  path: "/api/news",
  name: "apple news",
  type: "news",
  url: `${global.t}/api/news/apple`,
  logo: "",
  description: "جلب آخر أخبار Apple من MacRumors",
  router
};