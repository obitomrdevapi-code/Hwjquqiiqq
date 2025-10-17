// بسم الله الرحمن الرحيم ✨
// API لاستخراج جميع روابط M3U8 من موقع streamtest.in/logs

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * دالة لاستخراج روابط M3U8 من موقع streamtest.in/logs
 * @param {number} maxPages - عدد الصفحات التي سيتم استخراجها (افتراضي 3)
 * @returns {Promise<string[]>} - مصفوفة روابط M3U8
 */
async function scrapeStreamtestGeneric(maxPages = 3) {
  const baseUrl = "https://streamtest.in/logs";
  let allM3u8Links = [];
  const visitedUrls = new Set();

  console.log(`[STREAMTEST SCRAPE DEBUG] بدء استخراج حتى ${maxPages} صفحات من ${baseUrl}`);

  for (let page = 1; page <= maxPages; page++) {
    const url = `${baseUrl}?page=${page}`;
    if (visitedUrls.has(url)) continue;
    visitedUrls.add(url);

    try {
      const response = await axios.get(url, {
        timeout: 20000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      if (response.status !== 200) continue;

      const $ = cheerio.load(response.data);
      $("table tbody tr").each((i, el) => {
        const linkElement = $(el).find("td:first-child div div p:nth-child(2)");
        let link = linkElement.text().trim();

        if (!link) {
          const cellText = $(el).find("td:first-child").text();
          const urlMatch = cellText.match(/https?:\/\/[^\s\\'"<>]+/);
          if (urlMatch) link = urlMatch[0];
        }

        if (link && link.includes(".m3u8") && !allM3u8Links.includes(link)) {
          allM3u8Links.push(link);
        }
      });
    } catch (err) {
      console.error(`[STREAMTEST ERROR] الصفحة ${page}:`, err.message);
    }
  }

  console.log(`[STREAMTEST SCRAPE DEBUG] تم العثور على ${allM3u8Links.length} روابط`);
  return allM3u8Links;
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/stream/streamtest?pages=5
 */
router.get("/streamtest", async (req, res) => {
  const { pages } = req.query;
  const maxPages = Number(pages) || 3;

  try {
    const links = await scrapeStreamtestGeneric(maxPages);
    if (!links.length) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "لم يتم العثور على أي روابط M3U8 😢",
      });
    }

    return res.json({
      status: 200,
      success: true,
      total: links.length,
      links,
    });
  } catch (err) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء الاستخراج 🚫",
      error: err.message,
    });
  }
});

module.exports = {
  path: "/api/stream",
  name: "StreamTest M3U8 Scraper",
  type: "scraper",
  url: `${global.t}/api/stream/streamtest?pages=3`,
  logo: "https://i.ibb.co/SXxT4hK/streamtest-logo.png",
  description:
    "استخراج روابط M3U8 من موقع streamtest.in/logs بشكل مباشر مع تحديد عدد الصفحات.",
  router,
};