// بسم الله الرحمن الرحيم ✨
// Website Source Code Scraper API

const express = require("express");
const axios = require("axios");

const app = express();

app.get("/website_source", async (req, res) => {
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال رابط الموقع في المعامل ?url="
    });
  }

  try {
    new URL(url);
  } catch (error) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "🚫 الرابط غير صالح"
    });
  }

  try {
    const response = await axios.get(`https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const sourceCode = response.data;

    if (!sourceCode) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "🚫 لم يتم العثور على محتوى"
      });
    }

    res.json({
      status: 200,
      success: true,
      url: url,
      source_length: sourceCode.length,
      source_code: sourceCode
    });
    
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء جلب سورس الموقع"
    });
  }
});

module.exports = {
  path: "/api/tools",
  name: "simple scraper",
  type: "tools",
  url: `${global.t}/api/tools/website_source?url=https://example.com`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "جلب سورس مواقع,
  router
}; 