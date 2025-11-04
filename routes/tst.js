
// بسم الله الرحمن الرحيم ✨
// Website Source Scraper API
// جلب سورس أي موقع باستخدام codetabs proxy

const express = require("express");
const axios = require("axios");

const router = express.Router();

/**
 * جلب سورس الموقع
 * @param {string} targetUrl - رابط الموقع المراد جلبه
 * @returns {Promise<string>}
 */
async function fetchWebsiteSource(targetUrl) {
  try {
    const proxyUrl = `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(targetUrl)}`;
    const response = await axios.get(proxyUrl);
    return response.data;
} catch (error) {
    console.error("❌ خطأ أثناء جلب السورس:", error.message);
    throw new Error("تعذر جلب سورس الموقع.");
}
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/source?url=https://example.com
 */
router.get("/html_get_proxy", async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال رابط الموقع في المعامل?url="
});
}

  try {
    const html = await fetchWebsiteSource(targetUrl);
    res.status(200).json({
      status: 200,
      success: true,
      url: targetUrl,
      source: html
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: err.message
});
}
});

module.exports = {
  path: "/api/tools",
  name: "simple scraper",
  type: "tools",
  url: `${global.t}/api/tools/html_get_proxy?url=https://example.com`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "جلب سورس مواقع,
  router
};

