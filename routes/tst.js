const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114.0.0.0 Safari/537.36",
  "Accept-Language": "ar,en;q=0.9"
};

/**
 * جلب آخر الأخبار من صفحة all
 */
router.get("/hespress/all", async (req, res) => {
  try {
    const { data} = await axios.get("https://www.hespress.com/all", { headers});
    const $ = cheerio.load(data);
    const result = [];

    $(".col-12.col-sm-6.col-md-6.col-xl-3").each((_, el) => {
      const title = $(el).find(".card-title").text().trim();
      const date = $(el).find(".date-card small").text().trim();
      const link = $(el).find(".stretched-link").attr("href");
      const image = $(el).find(".card-img-top img").attr("src");
      result.push({ title, date, link, image});
});

    res.json({
      status: 200,
      success: true,
      total: result.length,
      articles: result
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
 * جلب تفاصيل خبر من رابط مباشر
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
    const { data} = await axios.get(url, { headers});
    const $ = cheerio.load(data);

    $("script, style").remove();

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
        if (json["@type"] === "NewsArticle") {
          image = image || json.image?.url;
          caption = caption || json.description;
          author = author || json.author?.name;
          date = date || json.datePublished;
}
} catch (_) {}
});

    res.json({
      status: 200,
      success: true,
      article: {
        title,
        author: author || "غير معروف",
        date: date || "غير متوفر",
        image: image || "غير متوفرة",
        caption: caption || "لا يوجد",
        content: content.slice(0, 2000),
        tags
}
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