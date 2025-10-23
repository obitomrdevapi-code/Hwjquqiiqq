const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * استخراج رابط الفيديو النهائي من صفحة أكوام
 * @param {string} url - رابط الصفحة الأصلية
 * @returns {Promise<string|null>}
 */
async function extractVideoLink(url) {
  const headers = { "User-Agent": "Mozilla/5.0 (compatible; Bot/1.0)"};

  try {
    const page1 = await axios.get(url, { headers, timeout: 20000});
    const $ = cheerio.load(page1.data);

    let downloadPage = $("a.download-link").first().attr("href") ||
                       $('a:contains("اضغط هنا")').first().attr("href") ||
                       $('a:contains("Click here")').first().attr("href");

    if (!downloadPage) return null;

    try {
      downloadPage = new URL(downloadPage, page1.request.res.responseUrl || url).toString();
} catch {}

    const page2 = await axios.get(downloadPage, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
      timeout: 20000
});

    const $$ = cheerio.load(page2.data);
    let videoLink = null;

    $$("a").each((_, el) => {
      const href = $$(el).attr("href");
      if (href && (href.includes("downet.net") || href.endsWith(".mp4"))) {
        videoLink = href;
        return false;
}
});

    if (!videoLink) {
      const regex = /(https?:\/\/s\d+\.downet\.net\/download\/[A-Za-z0-9\/._%-]+\.mp4)/;
      const match = page2.data.match(regex);
      if (match) videoLink = match[0];
}

    return videoLink || null;
} catch (err) {
    throw new Error(`فشل في استخراج الرابط: ${err.message}`);
}
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/search/link?url=https://ak.sv/episode/12345
 */
router.get("/akwam_download", async (req, res) => {
  const { url} = req.query;

  if (!url) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "❌ يرجى إرسال رابط الصفحة عبر?url="
});
}

  try {
    const videoLink = await extractVideoLink(url);

    if (!videoLink) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "❌ لم يتم العثور على رابط الفيديو في صفحة التحميل."
});
}

    res.status(200).json({
      status: 200,
      success: true,
      source: url,
      videoLink
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "⚠️ حدث خطأ أثناء الاستخراج.",
      error: err.message
});
}
});

module.exports = {
  path: "/api/download",
  name: "akwam video download",
  type: "download",
  url: `${global.t}/api/download/akwam_download?url=https://ak.sv/episode/43995/fast-furious-spy-racers-الموسم-السادس/الحلقة-12`,
  logo: "",
  description: "تحميل الفيديوهات من موقع اكوام عبر رابط",
  router
};
