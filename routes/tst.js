
// بسم الله الرحمن الرحيم ✨
// Proxy Site Scraper API
// جلب سورس أي موقع باستخدام بروكسيات من ProxyScrape

const express = require("express");
const axios = require("axios");
const HttpsProxyAgent = require("https-proxy-agent");

const router = express.Router();
const proxyListUrl = "https://api.proxyscrape.com/?request=displayproxies&proxytype=https&timeout=0";

/**
 * جلب قائمة البروكسيات من ProxyScrape
 * @returns {Promise<Array<string>>}
 */
async function fetchProxies() {
  const { data} = await axios.get(proxyListUrl);
  return data
.split("\n")
.map(p => p.trim())
.filter(p => p.length> 0);
}

/**
 * جلب سورس الموقع باستخدام بروكسي
 * @param {string} targetUrl - رابط الموقع المطلوب
 * @returns {Promise<string>}
 */
async function fetchSiteWithProxy(targetUrl) {
  const proxies = await fetchProxies();
  for (const proxy of proxies) {
    try {
      const agent = new HttpsProxyAgent(`http://${proxy}`);
      const { data} = await axios.get(targetUrl, { httpsAgent: agent, timeout: 5000});
      return data;
} catch (err) {
      continue; // جرب البروكسي التالي إذا فشل
}
}
  throw new Error("❌ لم يتم العثور على بروكسي صالح");
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/proxy/scrape?url=https://example.com
 */
router.get("/scrape", async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال رابط الموقع المطلوب"
});
}

  try {
    const html = await fetchSiteWithProxy(url);
    res.send(html); // عرض السورس مباشرة مثل allorigins
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء جلب الموقع عبر البروكسي",
      error: err.message
});
}
});

module.exports = {
  path: "/api/tools",
  name: "proxy scraper",
  type: "tools",
  url: `${global.t}/api/tools/scrape?url=https://example.com`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "جلب سورس أي موقع باستخدام بروكسيات HTTPS",
  router
};
