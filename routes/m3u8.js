const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();
const base = "https://www.alloschool.com";

/**
 * جلب جميع الدروس من AlloSchool حسب كلمة البحث
 * @param {string} query
 * @returns {Promise<object>}
 */
async function fetchLessons(query = "") {
  if (!query) return { status: false, message: "يرجى إدخال كلمة بحث."};

  try {
    const searchUrl = `${base}/search?q=${encodeURIComponent(query)}`;
    const { data: html} = await axios.get(searchUrl);
    const $ = cheerio.load(html);

    const links = [];
    $('ul.list-unstyled li a').each((i, el) => {
      const title = $(el).text().trim();
      const href = $(el).attr('href');
      if (/^https?:\/\/www\.alloschool\.com\/element\/\d+$/.test(href)) {
        links.push({ title, url: href});
}
});

    const results = [];

    for (const item of links) {
      const { data: pageHtml} = await axios.get(item.url);
      const $$ = cheerio.load(pageHtml);
      const pdfs = [];

      $$('a').each((i, el) => {
        const href = $$(el).attr('href');
        if (href && href.endsWith('.pdf')) {
          pdfs.push(href);
}
});

      results.push({
        title: item.title || "بدون عنوان",
        source: item.url,
        pdf: pdfs[0] || null
});
}

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
 *   /api/search/lesson?q=math
 */
router.get("/lesson", async (req, res) => {
  const { q} = req.query;
  const query = q || "";

  if (!query) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "يرجى إدخال كلمة البحث."
});
}

  const result = await fetchLessons(query);
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
  name: "AlloSchool Lesson Search",
  type: "search",
  url: `${global.t}/api/search/lesson?q=math`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "البحث عن جميع الدروس من AlloSchool مع روابط تحميل PDF.",
  router
};

