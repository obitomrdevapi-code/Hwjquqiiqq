const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();
const base = "https://www.alloschool.com";

/**
 * جلب عناوين الدروس فقط من AlloSchool
 * @param {string} query
 * @returns {Promise<object>}
 */
async function fetchTitles(query = "") {
  if (!query) return { status: false, message: "يرجى إدخال كلمة بحث."};

  try {
    const searchUrl = `${base}/search?q=${encodeURIComponent(query)}`;
    const { data: html} = await axios.get(searchUrl);
    const $ = cheerio.load(html);

    const titles = [];
    $('ul.list-unstyled li a').each((i, el) => {
      const title = $(el).text().trim();
      if (title) titles.push(title);
});

    return {
      status: true,
      total: titles.length,
      titles
};
} catch (err) {
    console.error("[ERROR] فشل جلب العناوين:", err.message);
    return { status: false, message: "حدث خطأ أثناء البحث."};
}
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/search/lesson-titles?q=math
 */
router.get("/lesson-titles", async (req, res) => {
  const { q} = req.query;
  const query = q || "";

  if (!query) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "يرجى إدخال كلمة البحث."
});
}

  const result = await fetchTitles(query);
  if (!result.status) {
    return res.status(404).json({
      status: 404,
      success: false,
      message: result.message
});
}

  res.json({
    status: 200,
    success: true,
    query,
    total: result.total,
    titles: result.titles
});
});

module.exports = {
  path: "/api/search",
  name: "AlloSchool Title Scraper",
  type: "search",
  url: `${global.t}/api/search/lesson-titles?q=math`,
  logo: "",
  description: "جلب عناوين الدروس فقط من AlloSchool بدون روابط تحميل.",
  router
};
