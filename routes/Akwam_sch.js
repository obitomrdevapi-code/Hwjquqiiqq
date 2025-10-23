
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * جلب نتائج البحث من موقع ak.sv
 * @param {string} name - كلمة البحث
 * @returns {Promise<object[]>}
 */
async function fetchAkwamResults(name = "") {
  const results = [];
  const headers = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
    "Accept-Language": "ar,en;q=0.9"
};

  const searchUrl = `https://ak.sv/search?q=${encodeURIComponent(name)}`;
  console.log(`[INFO] Scraping: ${searchUrl}`);

  try {
    const { data} = await axios.get(searchUrl, { headers, timeout: 10000});
    const $ = cheerio.load(data);

    $(".entry-box.entry-box-1").each((_, el) => {
      const $el = $(el);
      const titleElement = $el.find(".entry-title a");
      const title = titleElement.text().trim();
      const link = titleElement.attr("href");
      const image = $el.find("img.lazy").attr("data-src") || $el.find("img").attr("src");
      const rating = $el.find(".label.rating").text().trim() || "غير معروف";
      const quality = $el.find(".label.quality").text().trim() || "غير معروف";
      const year = $el.find(".badge-secondary").first().text().trim() || "غير معروف";
      const genres = [];

      $el.find(".badge-light").each((_, genreEl) => {
        const genre = $(genreEl).text().trim();
        if (genre && genre!== year) genres.push(genre);
});

      if (title && link) {
        results.push({
          title,
          link,
          image,
          rating,
          quality,
          year,
          genres: genres.join(", "),
          type: link.includes("/movie/")? "🎬 فيلم": link.includes("/series/")? "📺 مسلسل": "📁 محتوى"
});
}
});

    return results;
} catch (err) {
    console.error(`[ERROR] فشل استخراج النتائج:`, err.message);
    return [];
}
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/search/akwam?name=الهيبة
 */
router.get("/akwam", async (req, res) => {
  const { name} = req.query;
  const searchName = name || "";

  if (!searchName) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "❌ يرجى إرسال كلمة البحث عبر?name="
});
}

  try {
    const results = await fetchAkwamResults(searchName);

    if (!results.length) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "لم يتم العثور على نتائج 😢"
});
}

    res.json({
      status: 200,
      success: true,
      total: results.length,
      query: searchName,
      preview: results.slice(0, 10)
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء الجلب 🚫",
      error: err.message
});
}
});

module.exports = {
  path: "/api/search",
  name: "akwam search",
  type: "search",
  url: `${global.t}/api/search/akwam?name=الهيبة`,
  logo: "https://ak.sv/favicon.ico",
  description: "البحث عن الافلام في منصة اكوام",
  router,
};
