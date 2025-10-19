const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * استخراج رابط PDF وصورة وعنوان من صفحة درس AlloSchool
 * @param {string} url
 * @returns {Promise<object>}
 */
async function extractFromLesson(url = "") {
  if (!url ||!url.includes("alloschool.com/element/")) {
    return { status: false, message: "يرجى تقديم رابط درس صالح من AlloSchool."};
}

  try {
    const { data: html} = await axios.get(url);
    const $ = cheerio.load(html);

    // المحاولة الأولى: المفاتيح التقليدية
    let pdfLink = $('a.btn.btn-lg.btn-primary[target="_blank"][href$=".pdf"]').attr("href") || null;
    let imageLink = $('div.document-viewer a[href$=".jpg"]').attr("href") || null;

    // المحاولة الثانية: المفاتيح البديلة
    if (!pdfLink) {
      pdfLink = $('a.btn.btn-primary[target="_blank"][href*="/pdf"]').attr("href") || null;
}

    if (!imageLink) {
      imageLink = $('div.slde-content img').attr("src") || null;
}

    // استخراج العنوان من الهيدر
    const title =
      $('h4 span[style*="background-color"]').text().trim() ||
      $('h4').text().trim() ||
      "بدون عنوان";

    return {
      status: true,
      source: url,
      title,
      pdf: pdfLink,
      image: imageLink
};
} catch (err) {
    console.error("[ERROR] فشل استخراج المحتوى:", err.message);
    return { status: false, message: "حدث خطأ أثناء استخراج البيانات."};
}
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/lesson/extract?url=https://www.alloschool.com/element/9713
 */
router.get("/alloschool", async (req, res) => {
  const { url} = req.query;
  const lessonUrl = url || "";

  const result = await extractFromLesson(lessonUrl);
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
    source: result.source,
    title: result.title,
    pdf: result.pdf,
    image: result.image
});
});

module.exports = {
  path: "/api/download",
  name: "AlloSchool download",
  type: "download",
  url: `${global.t}/api/download/alloschool?url=https://www.alloschool.com/element/9713`,
  logo: "",
  description: "استخراج رابط PDF وصورة وعنوان من صفحة درس AlloSchool",
  router
};
