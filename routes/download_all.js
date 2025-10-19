const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * استخراج رابط PDF وصورة من صفحة درس AlloSchool
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

    // استخراج رابط PDF
    const pdfLink = $('a.btn.btn-lg.btn-primary[target="_blank"][href$=".pdf"]').attr("href") || null;

    // استخراج رابط الصورة الكبيرة
    const imageLink = $('div.document-viewer a[href$=".jpg"]').attr("href") || null;

    return {
      status: true,
      source: url,
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
  description: "استخراج رابط PDF وصورة من صفحة درس AlloSchool",
  router
};
