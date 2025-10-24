
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * تنظيف النص من الوسوم مثل <span class="search-keys">...</span>
 * @param {string} html
 * @returns {string}
 */
function cleanText(html) {
  const $ = cheerio.load(html);
  return $.text().trim();
}

/**
 * البحث عن حديث بناءً على عنوان
 * @param {string} title
 * @returns {Promise<Array>}
 */
async function fetchHadithByTitle(title) {
  const url = "https://search.sunnah.one";
  const params = {
    ver: "2",
    q: title,
};

  const headers = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
    "sec-ch-ua": "\"Chromium\";v=\"128\", \"Not;A=Brand\";v=\"24\", \"Google Chrome\";v=\"128\"",
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": "\"Android\"",
    "origin": "https://sunnah.one",
    "sec-fetch-site": "same-site",
    "sec-fetch-mode": "cors",
    "sec-fetch-dest": "empty",
    "referer": "https://sunnah.one/",
    "accept-language": "ar-IQ,ar;q=0.9,en-US;q=0.8,en;q=0.7",
    "priority": "u=1, i"
};

  const { data} = await axios.get(url, { params, headers});
  const results = [];

  for (const item of data.data || []) {
    try {
      results.push({
        text: cleanText(item.text),
        rawy: item.rawy,
        muhaddith: item.muhaddith,
        source: item.source,
        source_location: item.source_location,
        hukm: item.hukm,
        takhreej: item.takhreej,
});
} catch {
      continue;
}
}

  return results;
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/sunnah/search?title=علي بن أبي طالب
 */
router.get("/sunnah", async (req, res) => {
  const title = (req.query.title || "").trim();
  if (!title) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال عنوان صالح للبحث",
});
}

  try {
    const results = await fetchHadithByTitle(title);
    if (!results.length) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "🚫 لم يتم العثور على نتائج.",
});
}

    res.json({
      status: 200,
      success: true,
      total: results.length,
      results,
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "❌ حدث خطأ أثناء استخراج البيانات.",
      error: err.message,
});
}
});

module.exports = {
  path: "/api/islam",
  name: "sunnah search",
  type: "islam",
  url: `${global.t}/api/islam/sunnah?title=علي بن أبي طالب`,
  logo: "https://qu.ax/sunnahlogo.png",
  description: "البحث عن الاحاديث الشريفه عبر",
  router,
};
