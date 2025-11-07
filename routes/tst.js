const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

async function fetchMacRumorsArticle(url) {
  const { data} = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Accept-Language": "en-US,en;q=0.9"
}
});

  const $ = cheerio.load(data);
  const title = $("meta[property='og:title']").attr("content") || $("title").text().trim();
  const image = $("meta[property='og:image']").attr("content");

  // استخراج الفقرات من داخل المقال
  const paragraphs = [];
  $(".article-content p").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length> 30) paragraphs.push(text);
});

  const excerpt = paragraphs.length
? paragraphs.slice(0, 3).join("\n\n")
: "لا يوجد وصف متاح.";

  return {
    title,
    image,
    excerpt
};
}

router.get("/macrumors", async (req, res) => {
  const { url} = req.query;
  if (!url ||!url.startsWith("http")) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "يرجى تقديم رابط صالح للمقال من MacRumors"
});
}

  try {
    const article = await fetchMacRumorsArticle(url);
    res.json({
      status: 200,
      success: true,
      data: article
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء استخراج محتوى الخبر.",
      error: err.message
});
}
});

module.exports = {
  path: "/api/news",
  name: "macrumors article",
  type: "news",
  url: `${global.t}/api/news/macrumors?url=`,
  logo: "",
  description: "استخراج محتوى خبر من MacRumors عبر رابط مباشر",
  router
};