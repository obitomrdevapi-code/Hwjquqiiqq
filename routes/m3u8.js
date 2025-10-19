const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();
const base = "https://www.alloschool.com";

/**
 * جلب عناوين الدروس مع روابطها من AlloSchool
 * @param {string} query
 * @returns {Promise<object>}
 */
async function fetchLessonTitles(query = "") {
  if (!query) return { status: false, message: "يرجى إدخال كلمة بحث."};

  try {
    const searchUrl = `${base}/search?q=${encodeURIComponent(query)}`;
    const { data: html} = await axios.get(searchUrl);
    const $ = cheerio.load(html);

    const results = [];
    $('ul.list-unstyled li a').each((i, el) => {
      const title = $(el).text().trim();
      const href = $(el).attr('href');
      const url = href.startsWith("http")? href: `${base}${href}`;
      if (title && url.includes("/element/")) {
        results.push({ title, url});
}
});

    return {
      status: true,
      total: results.length,
      results
};
} catch (err) {
    console.error("[ERROR] فشل جلب الدروس:", err.message);
    return { status: false, message: "حدث خطأ أثناء البحث."};
}
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/search/lesson-links?q=math
 */
router.get("/lesson-links", async (req, res) => {
  const { q} = req.query;
  const query = q || "";

  if (!query) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "يرجى إدخال كلمة البحث."
});
}

  const result = await fetchLessonTitles(query);
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
    results: result.results
});
});

module.exports = {
  path: "/api/search",
  name: "AlloSchool Lesson Links",
  type: "search",
  url: `${global.t}/api/search/alloschool?q=math`,
  logo: "",
  description: "البحث عن دروس و الفروض على موقع AlloSchool",
  router
};
