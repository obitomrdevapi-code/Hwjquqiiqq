const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * جلب آخر الأخبار من صفحة all
 * @returns {Promise<Array>}
 */
async function fetchLatestNews() {
  const { data} = await axios.get("https://www.hespress.com/all");
  const $ = cheerio.load(data);
  const result = [];

  $(".col-12.col-sm-6.col-md-6.col-xl-3").each((_, el) => {
    const title = $(el).find(".card-title").text().trim();
    const date = $(el).find(".date-card small").text().trim();
    const link = $(el).find(".stretched-link").attr("href");
    const image = $(el).find(".card-img-top img").attr("src");
    result.push({ title, date, link, image});
});

  return result;
}

/**
 * جلب تفاصيل خبر من رابط مباشر
 * @param {string} url - رابط الخبر
 * @returns {Promise<object>}
 */
async function fetchArticleDetails(url) {
  const { data} = await axios.get(url);
  const $ = cheerio.load(data);

  $('script, style').remove();

  const title = $(".post-title").text().trim();
  let image = $(".figure-heading-post.post-thumbnail img").attr("src");
  let caption = $(".figure-heading-post figcaption").text().trim();
  let author = $(".author a").text().trim();
  let date = $(".date-post").text().trim();
  const content = $(".article-content").text().trim();
  const tags = $(".box-tags.tag_post_tag").map((i, el) => $(el).text().trim()).get();

  // fallback من JSON-LD
  const jsonLdBlocks = $('script[type="application/ld+json"]');
  jsonLdBlocks.each((_, el) => {
    try {
      const json = JSON.parse($(el).html());
      if (json['@type'] === 'NewsArticle') {
        image = image || json.image?.url;
        caption = caption || json.description;
        author = author || json.author?.name;
        date = date || json.datePublished;
}
} catch (_) {}
});

  return {
    title,
    author: author || "غير معروف",
    date: date || "غير متوفر",
    image: image || "غير متوفرة",
    caption: caption || "لا يوجد",
    content: content.slice(0, 2000), // تقصير المحتوى
    tags
};
}

/**
 * نقطة النهاية: /hespress/all
 */
router.get("/hespress/all", async (req, res) => {
  try {
    const news = await fetchLatestNews();
    res.json({
      status: 200,
      success: true,
      total: news.length,
      articles: news
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

/**
 * نقطة النهاية: /hespress?download=<رابط>
 */
router.get("/hespress", async (req, res) => {
  const url = req.query.download;
  if (!url ||!url.startsWith("http")) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إرسال رابط خبر صالح عبر?download="
});
}

  try {
    const article = await fetchArticleDetails(url);
    res.json({
      status: 200,
      success: true,
      article
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء جلب تفاصيل الخبر.",
      error: err.message
});
}
});

module.exports = {
  path: "/api/news",
  name: "Hespress News",
  type: "news",
  url: `${global.t}/api/news/hespress/all`,
  logo: "",
  description: "جلب آخر الأخبار من موقع Hespress أو تفاصيل خبر معين",
  router
};