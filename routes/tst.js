const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * البحث عن كتب في موقع alarabimag.com
 * @param {string} query - كلمة البحث
 * @returns {Promise<Array>}
 */
async function searchBooks(query) {
  try {
    const searchUrl = `https://www.alarabimag.com/search/?q=${encodeURIComponent(query)}`;
    const { data} = await axios.get(searchUrl);
    const $ = cheerio.load(data);
    const results = [];

    $(".hotbooks").slice(0, 10).each((index, element) => {
      const title = $(element).find("h2 a").text().trim();
      const link = "https://www.alarabimag.com" + $(element).find("h2 a").attr("href");
      const description = $(element).find(".info").text().trim();
      const image = "https://www.alarabimag.com" + $(element).find(".smallimg").attr("src");

      if (title && link) {
        results.push({ index: index + 1, title, link, description, image});
}
});

    return results;
} catch (error) {
    throw new Error(`خطأ أثناء البحث: ${error.message}`);
}
}

/**
 * جلب تفاصيل الكتاب وروابط التحميل
 * @param {string} bookUrl - رابط الكتاب
 * @returns {Promise<object>}
 */
async function getBookDetails(bookUrl) {
  try {
    const { data: bookPage} = await axios.get(bookUrl);
    const $ = cheerio.load(bookPage);

    const title = $("h1").text().trim();
    const description = $(".info").text().trim();
    const image = "https://www.alarabimag.com" + $(".smallimg").attr("src");

    const downloadLink = $("#download a").attr("href");
    if (!downloadLink) throw new Error("لم يتم العثور على رابط التحميل");

    const { data: downloadPage} = await axios.get("https://www.alarabimag.com" + downloadLink);
    const $$ = cheerio.load(downloadPage);

    const downloadLinks = $$("a[href^='/download/']")
.map((_, el) => "https://www.alarabimag.com" + $$(el).attr("href"))
.get();

    const infos = $$(".rTable.rTableRow").map((_, row) => {
      return {
        title: $$(row).find(".rTableHead").text().trim(),
        value: $$(row).find(".rTableCell").text().trim(),
};
}).get();

    return { title, description, image, downloadLinks, infos};
} catch (error) {
    throw new Error(`خطأ أثناء جلب تفاصيل الكتاب: ${error.message}`);
}
}

/**
 * نقطة النهاية للبحث
 * مثال:
 *   /api/alarabimag/search?q=رواية
 */
router.get("/alarabimag/search", async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال كلمة للبحث عنها"
});
}

  try {
    const results = await searchBooks(query);
    if (!results.length) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "❌ لم يتم العثور على نتائج"
});
}

    res.json({
      status: 200,
      success: true,
      query,
      totalResults: results.length,
      results
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء البحث",
      error: err.message
});
}
});

/**
 * نقطة النهاية لجلب تفاصيل الكتاب
 * مثال:
 *   /api/alarabimag/get?link=https://www.alarabimag.com/book/123456
 */
router.get("/alarabimag/get", async (req, res) => {
  const link = req.query.link;
  if (!link) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال رابط الكتاب"
});
}

  try {
    const details = await getBookDetails(link);
    res.json({
      status: 200,
      success: true,
      book: details
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء جلب معلومات الكتاب",
      error: err.message
      });
}
});

module.exports = {
  path: "/api/search",
  name: "Alarabimag Book Search",
  type: "search",
  url: `${global.t}/api/search/alarabimag/search?q=example`,
  logo: "https://files.catbox.moe/wy1k15.jpg",
  description: "البحث عن الكتب وجلب روابط التحميل من موقع alarabimag.com",
  router
};