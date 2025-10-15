const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// API البحث
router.get('/tik-img', async (req, res) => {
  const { keywords } = req.query;

  // التحقق من إدخال الكلمات المفتاحية
  if (!keywords) {
    return res.status(400).json({
      code: 1,
      msg: 'Missing keywords parameter',
    });
  }

  try {
    // استدعاء API الخارجي
    const url = `https://tikwm.com/api/photo/search?keywords=${encodeURIComponent(keywords)}`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(500).json({
        code: 1,
        msg: `Failed to fetch data: ${response.statusText}`,
      });
    }

    const data = await response.json();

    // التحقق من البيانات المستلمة
    if (data.code !== 0 || !data.data || !data.data.videos) {
      return res.status(500).json({
        code: 1,
        msg: 'Invalid data received from API',
      });
    }

    // إعادة النتائج إلى المستخدم
    res.status(200).json({
      code: 0,
      msg: 'success',
      data: data.data.videos,
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      msg: 'An error occurred',
      error: error.message,
    });
  }
});

// تصدير الـ router
module.exports = {
    path: "/api/search",
    name: "TikTok-image",
    type: "search",
    url: `${global.t}/api/search/tik-img?keywords=shanks`,
    logo: "https://files.catbox.moe/75scb9.jpg",
    router,
};
