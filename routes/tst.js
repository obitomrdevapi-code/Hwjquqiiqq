// بسم الله الرحمن الرحيم ✨
// Facebook Videos Scraper API
// استخراج فيديوهات الفيسبوك باستخدام Google Search

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * إعداد headers واقعية لطلب جوجل
 */
function getGoogleHeaders() {
  return {
    'authority': 'www.google.com',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'accept-language': 'ar-AE,ar;q=0.9,en-US;q=0.8,en;q=0.7',
    'cache-control': 'max-age=0',
    'sec-ch-ua': '"Chromium";v="118", "Google Chrome";v="118", "Not=A?Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
  };
}

/**
 * البحث في جوجل عن فيديوهات الفيسبوك
 */
async function searchGoogle(query) {
  const params = {
    q: `site:facebook.com/videos ${query}`,
    hl: 'ar',
    gl: 'ma', // المغرب
    tbm: 'vid' // بحث فيديوهات
  };

  try {
    const response = await axios.get('https://www.google.com/search', {
      params,
      headers: getGoogleHeaders(),
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    console.error('❌ خطأ في البحث:', error.message);
    throw error;
  }
}

/**
 * تحليل نتائج جوجل واستخراج فيديوهات الفيسبوك
 */
function parseGoogleResults(html) {
  const $ = cheerio.load(html);
  const results = [];

  // طريقة 1: البحث في العناصر الرئيسية
  $('div.g').each((i, elem) => {
    const $elem = $(elem);
    const title = $elem.find('h3').text().trim();
    const link = $elem.find('a').attr('href');
    
    if (link && link.includes('facebook.com') && link.includes('/videos/')) {
      const cleanLink = decodeGoogleUrl(link);
      if (cleanLink) {
        results.push({
          title: title || 'فيديو فيسبوك',
          url: cleanLink,
          source: 'facebook'
        });
      }
    }
  });

  // طريقة 2: البحث في جميع الروابط
  if (results.length === 0) {
    $('a').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href && href.includes('facebook.com/videos/')) {
        const cleanLink = decodeGoogleUrl(href);
        if (cleanLink && !results.find(r => r.url === cleanLink)) {
          results.push({
            title: 'فيديو فيسبوك',
            url: cleanLink,
            source: 'facebook'
          });
        }
      }
    });
  }

  return results;
}

/**
 * فك تشفير رابط جوجل
 */
function decodeGoogleUrl(url) {
  try {
    if (url.startsWith('/url?')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      return urlParams.get('q') || urlParams.get('url');
    }
    return url;
  } catch (error) {
    return url;
  }
}

/**
 * البحث المتقدم عن فيديوهات الفيسبوك
 */
async function searchFacebookVideos(query, maxResults = 20) {
  const allResults = [];
  const searchTerms = [
    `${query} المغرب`,
    `${query} maroc`,
    `${query} morocco`,
    `${query} فيديو`
  ];

  for (const searchTerm of searchTerms) {
    try {
      if (allResults.length >= maxResults) break;

      console.log(`🔍 البحث عن: "${searchTerm}"`);
      const html = await searchGoogle(searchTerm);
      const results = parseGoogleResults(html);

      // إضافة النتائج الجديدة
      results.forEach(result => {
        if (!allResults.find(r => r.url === result.url)) {
          allResults.push(result);
        }
      });

      // تأخير لتجنب الحظر
      await new Promise(resolve => setTimeout(resolve, 1500));

    } catch (error) {
      console.log(`⚠️ تخطي: ${searchTerm} - ${error.message}`);
      continue;
    }
  }

  return allResults.slice(0, maxResults);
}

/**
 * نقطة النهاية الرئيسية
 */
router.get("/facebook", async (req, res) => {
  const query = req.query.query || "المغرب";
  const maxResults = parseInt(req.query.max) || 20;

  if (!query.trim()) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال كلمة بحث"
    });
  }

  try {
    console.log(`🎬 بدء البحث: "${query}"`);
    const videos = await searchFacebookVideos(query, maxResults);

    res.json({
      status: 200,
      success: true,
      query: query,
      totalResults: videos.length,
      videos: videos,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    res.status(500).json({
      status: 500,
      success: false,
      message: "فشل في البحث",
      error: error.message
    });
  }
});

/**
 * نقطة نهاية للبحث السريع
 */
router.get("/search", async (req, res) => {
  const q = req.query.q;
  
  if (!q?.trim()) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال كلمة البحث"
    });
  }

  try {
    const videos = await searchFacebookVideos(q.trim(), 10);
    
    res.json({
      status: 200,
      success: true,
      search: q,
      results: videos,
      count: videos.length
    });

  } catch (error) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "فشل في البحث",
      error: error.message
    });
  }
});

/**
 * نقطة نهاية للفيديوهات المغربية العامة
 */
router.get("/morocco", async (req, res) => {
  try {
    const videos = await searchFacebookVideos("المغرب", 15);

    res.json({
      status: 200,
      success: true,
      category: "فيديوهات مغربية",
      totalResults: videos.length,
      videos: videos,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "فشل في جلب الفيديوهات",
      error: error.message
    });
  }
});

/**
 * نقطة نهاية للصحة
 */
router.get("/health", async (req, res) => {
  try {
    // اختبار بسيط
    const testResults = await searchFacebookVideos("test", 1);
    
    res.json({
      status: 200,
      success: true,
      message: "✅ الخدمة تعمل",
      testResults: testResults.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 503,
      success: false,
      message: "❌ الخدمة غير متاحة",
      error: error.message
    });
  }
});

module.exports = {
  path: "/api/search",
  name: "facebook videos",
  type: "search",
  url: `${global.t}/api/search/facebook?query=المغرب`,
  logo: "https://cdn-icons-png.flaticon.com/512/124/124010.png",
  description: "البحث عن فيديوهات الفيسبوك من المغرب",
  router
};