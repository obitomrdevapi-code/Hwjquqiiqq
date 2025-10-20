const express = require("express");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

const router = express.Router();
const BASE_URL = "https://api.allorigins.win/raw?url=https://myanimelist.net/topanime.php";

/**
 * جلب قائمة أفضل الأنميات من MyAnimeList عبر proxy لتجنب مشاكل Vercel
 * @param {number} limit
 * @returns {Promise<object>}
 */
async function fetchTopAnime(limit = 10) {
  try {
    const response = await fetch(BASE_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36"
}
});

    const html = await response.text();
    const $ = cheerio.load(html);
    const titles = $(".detail h3");
    const results = [];

    titles.each((i, el) => {
      if (i>= limit) return false;
      const name = $(el).text().trim();
      results.push({ rank: i + 1, title: name});
});

    return { status: true, data: results};
} catch (err) {
    console.error("[ERROR] أثناء جلب الأنميات:", err.message);
    return { status: false, message: "فشل في جلب قائمة الأنميات."};
}
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/anime/top?limit=5
 */
router.get("/top", async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const result = await fetchTopAnime(limit);

  if (!result.status) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: result.message
});
}

  res.json({
    status: 200,
    success: true,
    count: result.data.length,
    data: result.data
});
});

module.exports = {
  path: "/api/anime",
  name: "Top Anime",
  type: "anime",
  url: `${global.t}/api/anime/top?limit=5`,
  logo: "",
  description: "جلب أفضل الأنميات من MyAnimeList ",
  router
};
