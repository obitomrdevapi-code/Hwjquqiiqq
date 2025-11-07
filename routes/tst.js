const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const { lookup} = require("mime-types");

const router = express.Router();

/**
 * استخراج معلومات الملف من MediaFire عبر وكيل nekolabs
 * @param {string} url - رابط مباشر لصفحة الملف
 * @returns {Promise<object>}
 */
async function fetchMediafireFile(url) {
  if (!url.includes("www.mediafire.com")) {
    throw new Error("رابط غير صالح");
}

  const { data} = await axios.get(
    `https://api.nekolabs.web.id/px?url=${encodeURIComponent(url)}`
);

  const $ = cheerio.load(data.result.content);
  const raw = $("div.dl-info");

  const filename =
    $(".dl-btn-label").attr("title") ||
    raw.find("div.intro div.filename").text().trim() ||
    null;

  const ext = filename?.split(".").pop() || null;
  const mimetype = lookup(ext?.toLowerCase()) || null;

  const filesize = raw.find("ul.details li:nth-child(1) span").text().trim();
  const uploaded = raw.find("ul.details li:nth-child(2) span").text().trim();

  const dl = $("a#downloadButton").attr("href");
  if (!dl) throw new Error("لم يتم العثور على رابط التحميل");

  return {
    filename,
    filesize,
    mimetype,
    uploaded,
    download_url: dl,
};
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/mediafire/file?url=https://www.mediafire.com/file/xxxxxx
 */
router.get("/mediafire", async (req, res) => {
  const { url} = req.query;

  if (!url ||!url.startsWith("http") ||!url.includes("mediafire.com")) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى تقديم رابط MediaFire صالح عبر?url=",
});
}

  try {
    const result = await fetchMediafireFile(url);
    res.json({
      status: 200,
      success: true,
...result,
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء استخراج الملف.",
      error: err.message,
});
}
});

module.exports = {
  path: "/api/download",
  name: "mediafire download",
  type: "download",
  url: `${global.t}/api/download/mediafire?url=https://www.mediafire.com/file/xxxxxx`,
  logo: "https://qu.ax/obitomediafire.png",
  description: "تحميل من ميديافاير",
  router,
};