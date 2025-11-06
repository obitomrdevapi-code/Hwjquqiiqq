// بسم الله الرحمن الرحيم ✨
// Anime Details Scraper API
// جلب تفاصيل الأنمي عبر الـ slug من موقع witanime.you

const express = require("express");
const axios = require("axios");

const router = express.Router();

const API_URL = "http://217.154.201.164:7763/api/animes";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
};

/**
 * استخراج الـ slug من رابط الأنمي
 * @param {string} url - رابط الأنمي
 * @returns {string}
 */
function extractSlug(url) {
  const match = url.match(/\/anime\/([^\/]+)/);
  if (!match) {
    throw new Error("تعذر استخراج Anime slug من الرابط.");
  }
  return match[1];
}

/**
 * جلب تفاصيل الأنمي عبر الـ slug
 * @param {string} slug - معرف الأنمي
 * @returns {Promise<object>}
 */
async function fetchAnimeDetails(slug) {
  const apiUrl = `${API_URL}?slug=${slug}`;
  
  const { data } = await axios.get(apiUrl, {
    headers: HEADERS,
    timeout: 10000
  });

  return data;
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/anime/details?url=https://witanime.you/anime/naruto
 */
router.get("/details", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إرسال رابط الأنمي (url) كمعامل استعلام"
    });
  }

  try {
    const slug = extractSlug(url);
    const animeDetails = await fetchAnimeDetails(slug);

    res.json({
      status: 200,
      success: true,
      slug: slug,
      data: animeDetails
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء جلب تفاصيل الأنمي",
      error: err.message
    });
  }
});

/**
 * نقطة النهاية البديلة باستخدام الـ slug مباشرة
 * مثال:
 *   /api/anime/slug?slug=naruto
 */
router.get("/slug", async (req, res) => {
  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إرسال معرف الأنمي (slug) كمعامل استعلام"
    });
  }

  try {
    const animeDetails = await fetchAnimeDetails(slug);

    res.json({
      status: 200,
      success: true,
      slug: slug,
      data: animeDetails
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء جلب تفاصيل الأنمي",
      error: err.message
    });
  }
});

module.exports = {
  path: "/api/anime",
  name: "anime details", 
  type: "anime",
  url: `${global.t}/api/anime/details?url=https://witanime.you/anime/naruto`,
  logo: "https://cdn-icons-png.flaticon.com/512/1532/1532556.png",
  description: "جلب تفاصيل الأنمي عبر الرابط أو الـ slug",
  router
};