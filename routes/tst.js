
// بسم الله الرحمن الرحيم ✨
// Simple Site Scraper API
// جلب سورس أي موقع بدون بروكسيات

const express = require("express");
const axios = require("axios");

const router = express.Router();

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/tools/scrape?url=https://example.com
 */
router.get("/html_get", async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال رابط الموقع المطلوب"
});
}

  try {
    const { data} = await axios.get(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
},
      timeout: 10000
});

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(data);
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء جلب الموقع",
      error: err.message
});
}
});

module.exports = {
  path: "/api/tools",
  name: "simple scraper",
  type: "tools",
  url: `${global.t}/api/tools/html_get?url=https://example.com`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "جلب سورس مواقع,
  router
};