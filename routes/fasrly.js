const express = require("express");
const axios = require("axios");

const router = express.Router();

/**
 * تفسير الحلم باستخدام API
 * @param {string} dream - نص الحلم
 * @returns {Promise<object>}
 */
async function interpretDream(dream) {
  const url = 'https://dream-interpreter-backend.vercel.app/api/assistant';
  
  const headers = {
    'authority': 'dream-interpreter-backend.vercel.app',
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'ar-AE,ar;q=0.9,fr-MA;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
    'access-control-allow-origin': '*',
    'content-type': 'application/json',
    'origin': 'https://fasrly.online',
    'referer': 'https://fasrly.online/',
    'sec-ch-ua': '"Chromium";v="107", "Not=A?Brand";v="24"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site',
    'user-agent': 'Mozilla/5.0 (Linux; Android 12; SM-A217F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36'
  };

  const data = {
    prompt: dream
  };

  const response = await axios.post(url, data, { headers });
  return response.data;
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/fasrly?txt=كلب في المنام
 */
router.get("/fasrly", async (req, res) => {
  const dreamText = req.query.txt;

  if (!dreamText || dreamText.trim() === "") {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال نص الحلم في المعلمة txt"
    });
  }

  try {
    const interpretation = await interpretDream(dreamText.trim());

    res.json({
      status: 200,
      success: true,
      dream: dreamText,
      interpretation: interpretation.response || interpretation.interpretation || interpretation,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء تفسير الحلم.",
      error: err.message,
      dream: dreamText
    });
  }
});

/**
 * نقطة نهاية للصحة
 */
router.get("/fasrly/health", async (req, res) => {
  try {
    // اختبار اتصال بسيط
    await interpretDream("اختبار");
    
    res.json({
      status: 200,
      success: true,
      message: "✅ خدمة تفسير الأحلام تعمل بشكل طبيعي",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: 503,
      success: false,
      message: "❌ خدمة تفسير الأحلام غير متاحة",
      error: err.message
    });
  }
});

module.exports = {
  path: "/api/islam",
  name: "fasrly",
  type: "islam",
  url: `${global.t}/api/islam/fasrly?txt=كلب في المنام`,
  logo: "",
  description: "تفسير الاحلام",
  router
};