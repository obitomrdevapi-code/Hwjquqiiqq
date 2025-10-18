const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();
const base = "https://www.alloschool.com";

/**
 * البحث في AlloSchool عن الدروس وملفات PDF
 * @param {string} query
 * @returns {Promise<object>}
 */
async function searchAlloschool(query) {
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
      query,
      results
};
} catch (err) {
    console.error("[ERROR] أثناء البحث:", err.message);
    return { status: false, message: "حدث خطأ أثناء البحث."};
}
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/alloschool?q=math
 */
router.get("/alloschool", async (req, res) => {
  const { q} = req.query;
  const query = q || "";

  const result = await searchAlloschool(query);
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
    total: result.total,
    query,
    results: result.results
});
});

module.exports = {
  path: "/api/search",
  name: "AlloSchool PDF Scraper",
  type: "search",
  url: `${global.t}/api/search/alloschool?q=math`,
  logo: "",
  description: "البحث عن جميع الدروس من AlloSchool مع روابط تحميل PDF",
  router
};

