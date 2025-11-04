const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();
const baseUrl = "https://s7.nontonanimeid.boats/";
const headers = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
};

/**
 * جلب قائمة الأنميات من الصفحة الرئيسية
 * @returns {Promise<Array>}
 */
async function fetchAnimeHome() {
  const { data} = await axios.get(baseUrl, { headers});
  const $ = cheerio.load(data);
  const result = [];

  $("article.animeseries").each((_, el) => {
    result.push({
      title: $(el).find("h3.title").text().trim(),
      img: $(el).find("img").attr("src"),
      eps: $(el).find(".episodes").text().trim(),
      status: $(el).find(".status").text().trim()
});
});

  return result;
}

/**
 * البحث عن أنمي معين
 * @param {string} query - اسم الأنمي
 * @returns {Promise<Array>}
 */
async function searchAnime(query) {
  const { data} = await axios.get(`${baseUrl}?s=${query}`, { headers});
  const $ = cheerio.load(data);
  const result = [];

  $(".icon").remove();
  $(".as-anime-grid a").each((_, el) => {
    const genres = [];
    $(el).find(".as-genres span").each((_, g) => genres.push($(g).text().trim()));

    result.push({
      title: $(el).find(".as-anime-title").text().trim(),
      img: $(el).find("img").attr("src"),
      rating: $(el).find(".as-rating").text().trim(),
      type: $(el).find(".as-type").text().trim(),
      season: $(el).find(".as-season").text().trim(),
      sypnosis: $(el).find(".as-synopsis").text().trim(),
      genre: genres,
      url: $(el).attr("href")
});
});

  return result;
}

/**
 * استخراج تفاصيل الأنمي من الرابط
 * @param {string} url - رابط صفحة الأنمي
 * @returns {Promise<object>}
 */
async function fetchAnimeDetail(url) {
  const { data} = await axios.get(url, { headers});
  const $ = cheerio.load(data);

  const detail = {};
  $(".detail-separator").remove();
  $(".details-list li").each((_, el) => {
    const key = $(el).find(".detail-label").text().replace(":", "").toLowerCase().replace(/\s/g, "_");
    $(el).find(".detail-label").remove();
    detail[key] = $(el).text().trim();
});

  const genre = [];
  $(".anime-card__genres a").each((_, el) => genre.push($(el).text().trim()));

  const episodes = [];
  $(".episode-list-items a").each((_, el) => {
    episodes.push({
      eps: $(el).find(".ep-title").text().trim(),
      date: $(el).find(".ep-date").text().trim(),
      url: $(el).attr("href")
});
});

  return {
    title: $(".anime-card__sidebar img").attr("alt"),
    img: $(".anime-card__sidebar img").attr("src"),
    synopsis: $(".synopsis-prose").text().trim(),
    detail,
    genre,
    episodes
};
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/anime/home
 *   /api/anime/search?q=naruto
 *   /api/anime/detail?url=https://...
 */
router.get("/home", async (_, res) => {
  try {
    const list = await fetchAnimeHome();
    res.json({ status: 200, success: true, total: list.length, data: list});
} catch (err) {
    res.status(500).json({ status: 500, success: false, message: "خطأ أثناء جلب الصفحة الرئيسية", error: err.message});
}
});

router.get("/search", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ status: 400, success: false, message: "⚠️ يرجى إدخال اسم الأنمي للبحث"});

  try {
    const result = await searchAnime(q);
    res.json({ status: 200, success: true, total: result.length, data: result});
} catch (err) {
    res.status(500).json({ status: 500, success: false, message: "حدث خطأ أثناء البحث", error: err.message});
}
});

router.get("/detail", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ status: 400, success: false, message: "⚠️ يرجى إدخال رابط الأنمي"});

  try {
    const detail = await fetchAnimeDetail(url);
    res.json({ status: 200, success: true, data: detail});
} catch (err) {
    res.status(500).json({ status: 500, success: false, message: "حدث خطأ أثناء استخراج التفاصيل", error: err.message});
}
});

module.exports = {
  path: "/api/anime",
  name: "nontonanimeid scraper",
  type: "anime",
  url: `${global.t}/api/anime/search?q=naruto`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "جلب معلومات الأنمي من موقع nontonanimeid.boats",
  router
};
