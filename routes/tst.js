// بسم الله الرحمن الرحيم ✨
// MediaFireTrend Scraper API
// استخراج روابط التحميل من mediafiretrend.com

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * استخراج نتائج البحث من mediafiretrend.com
 * @param {string} query - كلمة البحث
 * @returns {Promise<Array>}
 */
async function fetchMediafireResults(query) {
  const encodedSearchUrl = `https://mediafiretrend.com/?q=${encodeURIComponent(query)}&search=Search`;
  const { data: html} = await axios.get(`https://api.nekolabs.web.id/px?url=${encodeURIComponent(encodedSearchUrl)}`);
  const $ = cheerio.load(html.result.content);

  const links = $("tbody tr a[href*='/f/']")
.map((_, el) => $(el).attr("href"))
.get();

  const results = [];

  for (const link of links) {
    const fullUrl = `https://mediafiretrend.com${link}`;
    const { data} = await axios.get(`https://api.nekolabs.web.id/px?url=${encodeURIComponent(fullUrl)}`);
    const $ = cheerio.load(data.result.content);

    const rawScript = $("div.info tbody tr:nth-child(4) td:nth-child(2) script").text();
    const match = rawScript.match(/unescape\(['"`]([^'"`]+)['"`]\)/);
    const decoded = cheerio.load(decodeURIComponent(match[1]));

    results.push({
      filename: $("tr:nth-child(2) td:nth-child(2) b").text().trim(),
      filesize: $("tr:nth-child(3) td:nth-child(2)").text().trim(),
      download: decoded("a").attr("href")      
});
}

  return results;
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/mediafire/search?q=anime
 */
router.get("/mediafire", async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال كلمة للبحث"
});
}

  try {
    const results = await fetchMediafireResults(query);

    if (!results.length) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "🚫 لم يتم العثور على نتائج."
});
}

    res.json({
      status: 200,
      success: true,
      total: results.length,
      query,
      results
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء استخراج النتائج.",
      error: err.message
});
}
});

module.exports = {
  path: "/api/search",
  name: "mediafire search",
  type: "search",
  url: `${global.t}/api/search/mediafire?q=anime`,
  logo: "https://qu.ax/obitomediafire.png",
  description: "االبحث عن الملفات في mediafiretrend",
  router
};