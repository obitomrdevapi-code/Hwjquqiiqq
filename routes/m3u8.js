// بسم الله الرحمن الرحيم ✨
// Interactive IPTV Log Scraper API
// تحويل من Python إلى Node.js (Express API)

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const router = express.Router();

/**
 * جلب روابط M3U8 من موقع streamtest.in/logs
 * @param {number} pages - عدد الصفحات المطلوب استخراجها
 * @param {string} name - اسم القناة أو كلمة البحث
 * @returns {Promise<string[]>}
 */
async function fetchLinks(pages = 1, name = "") {
  const scrapedLinks = [];
  const headers = { "User-Agent": "Mozilla/5.0" };

  for (let page = 1; page <= pages; page++) {
    const url = `https://streamtest.in/logs/page/${page}?filter=${encodeURIComponent(name)}&is_public=true`;
    console.log(`[INFO] Scraping: ${url}`);

    try {
      const response = await axios.get(url, { headers, timeout: 10000 });
      const $ = cheerio.load(response.data);

      $("p.line-clamp-3.hover\\:line-clamp-10").each((_, el) => {
        const link = $(el).text().trim();
        if (link && (link.startsWith("http://") || link.startsWith("https://"))) {
          scrapedLinks.push(link);
        }
      });
    } catch (err) {
      console.error(`[ERROR] فشل استخراج الصفحة ${page}:`, err.message);
    }
  }

  console.log(`[INFO] تم العثور على ${scrapedLinks.length} روابط`);
  return scrapedLinks;
}

/**
 * إنشاء ملف M3U من الروابط
 * @param {string[]} links - قائمة الروابط
 * @param {string} name - اسم الملف
 * @returns {string} - المسار النسبي للملف
 */
function createM3U(links, name = "logs") {
  const timestamp = new Date().toISOString().replace(/[:T]/g, "-").split(".")[0];
  const fileName = `${timestamp}_${name.toUpperCase()}.m3u`;
  const filePath = path.join(__dirname, fileName);

  fs.writeFileSync(filePath, links.join("\n"), "utf-8");
  console.log(`[INFO] تم إنشاء ملف M3U: ${filePath}`);
  return filePath;
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/stream/iptv?pages=3&name=bein
 *   /api/stream/iptv?pages=5
 *   /api/stream/iptv/save?pages=2&name=disney
 */
router.get("/iptv", async (req, res) => {
  const { pages, name } = req.query;
  const maxPages = Number(pages) || 1;
  const searchName = name || "";

  try {
    const links = await fetchLinks(maxPages, searchName);

    if (!links.length) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "لم يتم العثور على روابط IPTV 😢",
      });
    }

    res.json({
      status: 200,
      success: true,
      total: links.length,
      filter: searchName || "all",
      links,
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء الجلب 🚫",
      error: err.message,
    });
  }
});

/**
 * نقطة لإنشاء ملف m3u تلقائيًا
 * مثال:
 *   /api/stream/iptv/save?pages=3&name=sport
 */
router.get("/iptv/save", async (req, res) => {
  const { pages, name } = req.query;
  const maxPages = Number(pages) || 1;
  const searchName = name || "iptv";

  try {
    const links = await fetchLinks(maxPages, searchName);
    if (!links.length) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "لم يتم العثور على روابط لإنشاء ملف M3U.",
      });
    }

    const filePath = createM3U(links, searchName);
    res.json({
      status: 200,
      success: true,
      message: "✅ تم إنشاء ملف M3U بنجاح!",
      file: path.basename(filePath),
      total: links.length,
      preview: links.slice(0, 5),
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء إنشاء الملف.",
      error: err.message,
    });
  }
});

module.exports = {
  path: "/api/search",
  name: "iptv search",
  type: "search",
  url: `${global.t}/api/search/iptv?pages=3&name=bein`,
  logo: "https://qu.ax/obitoajajq.png",
  description:
    "البحث عن قنوات m3u8 التلفزيونة iptv الرياضيه/.... وحفظها على شكل m3u",
  router,
};