const express = require("express");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

const router = express.Router();

async function allHespress() {
  try {
    const response = await fetch("https://api.allorigins.win/raw?url=https://www.hespress.com/all");
    const html = await response.text();
    const $ = cheerio.load(html);
    const result = [];

    $(".col-12.col-sm-6.col-md-6.col-xl-3").each((index, element) => {
      const title = $(element).find(".card-title").text().trim();
      const date = $(element).find(".date-card small").text().trim();
      const image = $(element).find(".card-img-top img").attr("src");
      const link = $(element).find(".stretched-link").attr("href");

      if (title && link) {
        result.push({ title, date, image, link});
}
});

    return result;
} catch (error) {
    console.error("Error:", error);
    return [];
}
}

async function readHespress(url) {
  try {
    const encodedURL = encodeURIComponent(url);
    const response = await fetch(`https://api.allorigins.win/raw?url=${encodedURL}`);
    const html = await response.text();
    const $ = cheerio.load(html);
    $("script, style").remove();

    const title = $(".post-title").text().trim();
    const image = $(".figure-heading-post.post-thumbnail img").attr("src");
    const caption = $(".figure-heading-post figcaption").text().trim();
    const author = $(".author a").text().trim();
    const date = $(".date-post").text().trim();
    const content = $(".article-content").text().trim();
    const tags = $(".box-tags.tag_post_tag")
.map((i, el) => $(el).text().trim())
.get();

    if (!title) return null;

    return { title, image, caption, author, date, content, tags};
} catch (error) {
    console.error("Error:", error);
    return null;
}
}

router.get("/hespress", async (req, res) => {
  const { details} = req.query;

  try {
    if (details) {
      const content = await readHespress(details);
      if (!content) {
        return res.status(404).json({
          status: 404,
          success: false,
          message: "🚫 لم يتم العثور على تفاصيل الخبر.",
});
}
      return res.json({
        status: 200,
        success: true,
...content,
});
}

    const list = await allHespress();
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
  url: "https://obito-mr-apis.vercel.app/api/news/hespress",
  logo: "https://qu.ax/hespresslogo.png",
  description: "جلب آخر أخبار موقع Hespress أو تفاصيل خبر معين",
  router,
};