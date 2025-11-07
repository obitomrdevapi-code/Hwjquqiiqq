const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * استخراج معلومات الملف من صفحة MediaFire
 * @param {string} url - رابط مباشر لصفحة الملف
 * @returns {Promise<object>}
 */
async function fetchMediafireFile(url) {
  const { data} = await axios.get(url, { headers: DEFAULT_HEADERS});
  const $ = cheerio.load(data);

  let link = $("#downloadButton").attr("href");
  const size = $("#downloadButton").text()
.replace("Download", "")
.replace("(", "")
.replace(")", "")
.replace(/\n/g, "")
.trim();

  if (!link || link.includes("javascript:void(0)")) {
    const match = data.match(/"(https:\/\/download\d+\.mediafire\.com[^\"]+)"/i);
    if (match) link = match[1];
}

  if (!link || link.includes("javascript:void(0)")) {
    const scrambled = $("#downloadButton").attr("data-scrambled-url");
    if (scrambled) {
      try {
        link = Buffer.from(scrambled, "base64").toString("utf-8");
} catch {}
}
}

  let nama = "file";
  let mime = "bin";
  if (link && link.startsWith("https")) {
    const parts = link.split("/");
    nama = decodeURIComponent(parts.pop().split("?")[0]);
    mime = nama.includes(".")? nama.split(".").pop(): "bin";
}

  return { nama, mime, size, link};
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
      filename: result.nama,
      filesize: result.size,
      mimetype: result.mime,
      download: result.link,
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