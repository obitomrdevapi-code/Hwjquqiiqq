const express = require("express");
const axios = require("axios");

const router = express.Router();

/**
 * استخراج رابط الفيديو المباشر من صفحة embed
 * @param {string} url
 * @returns {Promise<string>}
 */
async function extractMp4Url(url) {
  const videoId = url.includes('/embed-')
? url.match(/embed-([a-zA-Z0-9]+)\.html/)?.[1]
: url.match(/\/([a-zA-Z0-9]+)$/)?.[1];

  if (!videoId) throw new Error("تعذر استخراج معرف الفيديو");

  const embedUrl = `https://www.mp4upload.com/embed-${videoId}.html`;

  const headers = {
    'user-agent': 'Mozilla/5.0 (Linux; Android 12)',
    'referer': embedUrl
};

  const { data} = await axios.get(embedUrl, { headers});

  const match =
    data.match(/src\s*:\s*["']([^"']+\.mp4[^"']*)["']/i) ||
    data.match(/<video[^>]+src=["']([^"']+)["']/i) ||
    data.match(/(https?:\/\/[^\s"']+\.mp4[^\s"']*)/i);

  if (!match ||!match[1]) throw new Error("لم يتم العثور على رابط mp4");

  let videoUrl = match[1];
  if (videoUrl.startsWith('//')) videoUrl = 'https:' + videoUrl;
  else if (videoUrl.startsWith('/')) videoUrl = 'https://www.mp4upload.com' + videoUrl;

  return videoUrl;
}

router.get("/mp4upload", async (req, res) => {
  const { url} = req.query;
  if (!url ||!url.includes("mp4upload.com")) {
    return res.status(400).json({ success: false, message: "يرجى تقديم رابط mp4upload صالح"});
}

  try {
    const directUrl = await extractMp4Url(url);
    res.json({ success: true, direct_url: directUrl});
} catch (err) {
    res.status(500).json({ success: false, message: err.message});
}
});

module.exports = {
  path: "/api/tst",
  name: "mp4upload direct link",
  type: "tst",
  url: `${global.t}/api/tst/mp4upload?url=https://www.mp4upload.com/vjbax053zqsq`,
  logo: "https://cdn-icons-png.flaticon.com/512/1384/1384060.png",
  description: "استخراج رابط mp4 المباشر من mp4upload بصيغة JSON",
  router
};