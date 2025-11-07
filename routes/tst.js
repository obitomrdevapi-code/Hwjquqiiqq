const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * استخراج آخر أخبار Apple من MacRumors باستخدام cheerio
 * @returns {Promise<Array>}
 */
async function fetchAppleNewsWithCheerio() {
  const rssUrl = "https://feeds.macrumors.com/MacRumors-All";
  const { data} = await axios.get(rssUrl);
  const $ = cheerio.load(data, { xmlMode: true});

  const items = $("item");
  const result = [];

  items.each((i, el) => {
    if (i>= 10) return false;

    const title = $(el).find("title").text().trim() || "لا عنوان";
    const link = $(el).find("link").text().trim() || "لا رابط";
    const descriptionRaw = $(el).find("description").text().trim() || "لا يوجد وصف";
    const pubDate = $(el).find("pubDate").text().trim() || "غير معروف";

    const cleanDescription = descriptionRaw.replace(/<[^>]*>/g, "").slice(0, 150) + "...";

    result.push({
      title,
      link,
      description: cleanDescription,
      pubDate
});
});

  return result;
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/news/apple
 */
router.get("/apple", async (req, res) => {
  try {
    const news = await fetchAppleNewsWithCheerio();
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