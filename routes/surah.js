// بسم الله الرحمن الرحيم ✨
// Quran Surah Scraper API
// استخراج آيات السورة من موقع litequran.net

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * جلب قائمة السور من الموقع
 * @returns {Promise<Array>}
 */
async function fetchSurahList() {
  const { data} = await axios.get("https://litequran.net/");
  const $ = cheerio.load(data);
  const result = [];

  $("body> main> ol> li:nth-child(n)").each((_, el) => {
    const name = $(el).find("a").text();
    const link = "https://litequran.net/" + $(el).find("a").attr("href");
    result.push({ name, link});
});

  return result;
}

/**
 * استخراج محتوى السورة من الرابط
 * @param {string} link - رابط السورة
 * @returns {Promise<object>}
 */
async function fetchSurahContent(link) {
  const { data} = await axios.get(link);
  const $ = cheerio.load(data);

  const surah = $("body> main> article> h1").text();
  const bismillah = $("body> main> article> p").text();
  const verses = [];

  $("body> main> article> ol> li:nth-child(n)").each((_, el) => {
    const arabic = $(el).find("p.arabic").text();
    const translation = $(el).find("p.translate").text();
    verses.push({ arabic, translation});
});

  return { surah, bismillah, verses};
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/quran/surah?index=1
 */
router.get("/surah", async (req, res) => {
  const index = parseInt(req.query.index);
  if (isNaN(index)) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال رقم سورة صالح"
});
}

  try {
    const list = await fetchSurahList();
    if (index < 1 || index> list.length) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "🚫 رقم السورة غير موجود."
});
}

    const selected = list[index - 1];
    const content = await fetchSurahContent(selected.link);

    res.json({
      status: 200,
      success: true,
      surah: content.surah,
      bismillah: content.bismillah,
      totalAyat: content.verses.length,
      ayat: content.verses
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء استخراج السورة.",
      error: err.message
});
}
});

module.exports = {
  path: "/api/islam",
  name: "quran surah",
  type: "islam",
  url: `${global.t}/api/islam/surah?index=1`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "جلب سور القرأن الكريم عبر رقمها",
  router
};