
// جلب سورس أي موقع باستخدام بروكسيات من ProxyScrape

const express = require("express");
const axios = require("axios");
const HttpsProxyAgent = require("https-proxy-agent");

const router = express.Router();
const proxyListUrl = "https://api.proxyscrape.com/?request=displayproxies&proxytype=https&timeout=1000";

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
 * اختبار البروكسي قبل استخدامه
 */
async function testProxy(proxy) {
  const agent = new HttpsProxyAgent(`http://${proxy}`);
  try {
    await axios.head("https://example.com", { httpsAgent: agent, timeout: 3000});
    return true;
} catch {
    return false;
}
}

/**
 * جلب سورس الموقع باستخدام بروكسي صالح
 * @param {string} targetUrl - رابط الموقع المطلوب
 * @returns {Promise<{html: string, proxy: string}>}
 */
async function fetchSiteWithProxy(targetUrl) {
  const proxies = await fetchProxies();
  for (const proxy of proxies.slice(0, 30)) { // جرب أول 30 بروكسي فقط
    const isValid = await testProxy(proxy);
    if (!isValid) continue;

    try {
      const agent = new HttpsProxyAgent(`http://${proxy}`);
      const { data} = await axios.get(targetUrl, { httpsAgent: agent, timeout: 7000});
      return { html: data, proxy};
} catch {
      continue;
}
}
  throw new Error("❌ لم يتم العثور على بروكسي HTTPS صالح");
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/tools/scrape?url=https://example.com
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
    const result = await fetchSiteWithProxy(url);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(result.html);
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
  description: "جلب سورس أي موقع باستخدام بروكسيات HTTPS من ProxyScrape",
  router
};
