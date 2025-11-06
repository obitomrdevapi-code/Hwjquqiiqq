// بسم الله الرحمن الرحيم ✨
// Anime Search Scraper API
// استخراج نتائج البحث من موقع witanime.you

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

const BASE_URL = "https://witanime.you/";
const PROXY_URL = "http://217.154.201.164:7763/api/proxy?url=";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
};

/**
 * جلب HTML مباشرة أو عبر بروكسي
 * @param {string} url - رابط الصفحة
 * @returns {Promise<string>}
 */
async function fetchHtml(url) {
  try {
    const response = await axios.get(url, { headers: HEADERS, timeout: 10000 });
    if (response.status === 200) return response.data;
  } catch {}

  // إذا فشل الجلب المباشر، نستخدم البروكسي
  const proxiedUrl = `${PROXY_URL}${encodeURIComponent(url)}`;
  try {
    const response = await axios.get(proxiedUrl, {
      headers: HEADERS,
      timeout: 15000,
    });
    if (response.status !== 200)
      throw new Error(`فشل عبر البروكسي: ${response.status}`);
    return response.data;
  } catch (e) {
    throw new Error(`فشل في جلب الصفحة: ${e.message}`);
  }
}

/**
 * استخراج نتائج البحث من الموقع
 * @param {string} query - كلمة البحث
 * @returns {Promise<Array>}
 */
async function searchAnime(query) {
  if (!query) return [];

  const searchUrl = `${BASE_URL}?search_param=animes&s=${encodeURIComponent(
    query
  )}`;
  const htmlContent = await fetchHtml(searchUrl);
  const $ = cheerio.load(htmlContent);

  const results = [];

  $(".anime-list-content .anime-card-container").each((i, el) => {
    const element = $(el);

    const link = element.find(".anime-card-poster a.overlay").attr("href");
    const title = element.find(".anime-card-title h3 a").text().trim();
    const status = element.find(".anime-card-status a").text().trim();
    const poster = element
      .find(".anime-card-poster img")
      .attr("src")
      ?.trim()
      .replace(/\?.*$/, ""); // إزالة أي query من الصورة

    if (title && link) {
      results.push({
        title,
        url: link.startsWith("http") ? link : BASE_URL + link,
        status: status || "غير معروف",
        poster: poster || "غير متوفر",
      });
    }
  });

  return results;
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/anime/search?q=naruto
 */
router.get("/search", async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال كلمة البحث (q) كمعامل استعلام"
    });
  }

  try {
    const results = await searchAnime(query);
    
    res.json({
      status: 200,
      success: true,
      query: query,
      count: results.length,
      results: results
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء عملية البحث",
      error: err.message
    });
  }
});

module.exports = {
  path: "/api/anime",
  name: "anime search",
  type: "anime",
  url: `${global.t}/api/anime/search?q=naruto`,
  logo: "https://cdn-icons-png.flaticon.com/512/1532/1532556.png",
  description: "البحث عن الأنمي عبر موقع witanime.you",
  router
};