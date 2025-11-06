const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * جلب قائمة الأخبار من الصفحة الرئيسية
 * @returns {Promise<Array>}
 */
async function fetchNewsList() {
  const { data} = await axios.get("https://www.hespress.com/all");
  const $ = cheerio.load(data);
  const result = [];

  $(".col-12.col-sm-6.col-md-6.col-xl-3").each((_, el) => {
    const title = $(el).find(".card-title").text().trim();
    const date = $(el).find(".date-card small").text().trim();
    const link = $(el).find(".stretched-link").attr("href");
    result.push({ title, date, link});
});

  return result;
}

/**
 * استخراج تفاصيل خبر من الرابط
 * @param {string} link - رابط الخبر
 * @returns {Promise<object>}
 */
async function fetchNewsDetails(link) {
  const { data} = await axios.get(link);
  const $ = cheerio.load(data);

  $("script, style").remove();

  const title = $(".post-title").text().trim();
  let image = $(".figure-heading-post.post-thumbnail img").attr("src");
  const caption = $(".figure-heading-post figcaption").text().trim();
  const author = $(".author a").text().trim();
  const date = $(".date-post").text().trim();
  const content = $(".article-content").text().trim();
  const tags = $(".box-tags.tag_post_tag")
.map((_, el) => $(el).text().trim())
.get();

  if (!image) {
    const jsonLd = $('script[type="application/ld+json"]').html();
    if (jsonLd) {
      try {
        const json = JSON.parse(jsonLd);
        image = json.image?.url || image;
} catch (err) {
        console.warn("فشل في قراءة JSON-LD");
}
}
}

  return {
    title,
    author: author || "غير معروف",
    date: date || "غير متوفر",
    image: image || "غير متوفرة",
    caption: caption || "لا يوجد",
    content: content.slice(0, 1000) + "...",
    tags,
};
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/news/hespress?details=https://www.hespress.com/xxxxx
 */
router.get("/hespress", async (req, res) => {
  const { details} = req.query;

  try {
    if (details) {
      const content = await fetchNewsDetails(details);
      return res.json({
        status: 200,
        success: true,
...content,
});
}

    const list = await fetchNewsList();
    if (list.length === 0) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "🚫 لم يتم العثور على أخبار حالياً.",
});
}

    res.json({
      status: 200,
      success: true,
      total: list.length,
      news: list.slice(0, 5),
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء جلب الأخبار.",
      error: err.message,
});
}
});

module.exports = {
  path: "/api/news",
  name: "hespress news",
  type: "news",
  url: `${global.t}/api/news/hespress`,
  logo: "https://qu.ax/hespresslogo.png",
  description: "جلب آخر أخبار موقع Hespress أو تفاصيل خبر معين",
  router,
};