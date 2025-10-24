// تست
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

async function extractVideoLink(url) {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "ar,en-US;q=0.7,en;q=0.3",
    "Referer": "https://ak.sv/",
    "Connection": "keep-alive"
};

  try {
    const page1 = await axios.get(url, { headers, timeout: 15000});
    const $ = cheerio.load(page1.data);

    let downloadPage = $("a.download-link").first().attr("href") ||
                       $('a.link-download').first().attr("href") ||
                       $('a:contains("تحميل")').first().attr("href") ||
                       $('a:contains("اضغط هنا")').first().attr("href") ||
                       $('a:contains("Click here")').first().attr("href");

    if (!downloadPage) return null;

    try {
      downloadPage = new URL(downloadPage, page1.request.res.responseUrl || url).toString();
} catch {}

    const page2 = await axios.get(downloadPage, { headers, timeout: 15000});
    const $$ = cheerio.load(page2.data);

    let videoLink = null;

    $$("a").each((_, el) => {
      const href = $$(el).attr("href");
      if (href && href.includes("downet.net") && href.endsWith(".mp4")) {
        videoLink = href;
        return false;
}
});

    if (!videoLink) {
      $$("a").each((_, el) => {
        const href = $$(el).attr("href");
        if (href && href.endsWith(".mp4")) {
          videoLink = href;
          return false;
}
});
}

    if (!videoLink) {
      const regex = /(https?:\/\/s\d+\.downet\.net\/download\/[A-Za-z0-9\/._%-]+\.mp4)/g;
      const matches = page2.data.match(regex);
      if (matches && matches.length> 0) {
        videoLink = matches[0];
}
}

    if (!videoLink) {
      $$('a[href*=".mp4"], a[download],.btn-loader a,.download-link').each((_, el) => {
        const href = $$(el).attr("href");
        if (href && href.includes(".mp4")) {
          videoLink = href;
          return false;
}
});
}

    if (videoLink &&!videoLink.startsWith('http')) {
      try {
        videoLink = new URL(videoLink, page2.request.res.responseUrl || downloadPage).toString();
} catch {}
}

    return videoLink || null;

} catch {
    return null;
}
}

router.get("/akwam_link", async (req, res) => {
  const { url} = req.query;

  if (!url) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "❌ يرجى إرسال رابط الصفحة عبر?url="
});
}

  if (!url.includes("ak.sv") &&!url.includes("akwam")) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "❌ الرابط غير صالح، يجب أن يكون من موقع أكوام"
});
}

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
    videoLink: videoLink
});
});

router.get("/test", async (req, res) => {
  res.json({
    status: 200,
    message: "السكريبت يعمل بشكل صحيح",
    timestamp: new Date().toISOString()
});
});

module.exports = {
  path: "/api/download",
  name: "akwam download link",
  type: "download",
  url: `${global.t}/api/download/akwam_link?url=https://ak.sv/episode/12345`,
  logo: "",
  description: "استخراج رابط الفيديو النهائي من صفحة أكوام",
  router
};
