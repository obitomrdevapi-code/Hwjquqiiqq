// بسم الله الرحمن الرحيم ✨
// Facebook Videos Scraper API
// استخراج فيديوهات الفيسبوك من المغرب باستخدام Google Search

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * البحث عن فيديوهات الفيسبوك من المغرب
 * @param {string} query - كلمة البحث
 * @returns {Promise<Array>}
 */
async function searchFacebookVideos(query = "المغرب") {
  const searchUrl = `https://www.google.com/search`;
  
  const params = {
    q: `site:facebook.com/videos ${query}`,
    tbm: "vid", // بحث فيديوهات
    hl: "ar",
    gl: "ma", // المغرب
    num: 50 // عدد النتائج
  };

  const headers = {
    'authority': 'www.google.com',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'accept-language': 'ar-AE,ar;q=0.9,fr-MA;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
    'cache-control': 'max-age=0',
    'sec-ch-ua': '"Chromium";v="107", "Not=A?Brand";v="24"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Linux; Android 12; SM-A217F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36'
  };

  try {
    console.log(`🔍 جاري البحث عن: ${query}`);
    const response = await axios.get(searchUrl, { params, headers });
    const videos = parseGoogleSearchResults(response.data);
    console.log(`✅ تم العثور على ${videos.length} فيديو`);
    return videos;
    
  } catch (error) {
    console.error('❌ خطأ في البحث:', error.message);
    throw new Error('فشل في جلب النتائج من جوجل');
  }
}

/**
 * تحليل نتائج بحث جوجل
 * @param {string} html - HTML من جوجل
 * @returns {Array}
 */
function parseGoogleSearchResults(html) {
  const $ = cheerio.load(html);
  const videos = [];

  // البحث عن عناصر الفيديوهات
  $('div.g').each((index, element) => {
    const $element = $(element);
    
    // استخراج الرابط
    const link = $element.find('a').attr('href');
    if (link && link.includes('facebook.com') && link.includes('/videos/')) {
      const videoUrl = extractFacebookVideoUrl(link);
      const title = $element.find('h3').text() || 'فيديو فيسبوك';
      const description = $element.find('.VwiC3b').text() || '';
      const thumbnail = $element.find('img').attr('src') || '';
      
      if (videoUrl) {
        videos.push({
          url: videoUrl,
          title: title.trim(),
          description: description.trim(),
          thumbnail: thumbnail,
          source: 'facebook'
        });
      }
    }
  });

  // إذا لم نجد نتائج بالطريقة الأولى، نجرب طريقة بديلة
  if (videos.length === 0) {
    $('a').each((index, element) => {
      const href = $(element).attr('href');
      if (href && href.includes('facebook.com') && href.includes('/videos/')) {
        const videoUrl = extractFacebookVideoUrl(href);
        if (videoUrl && !videos.find(v => v.url === videoUrl)) {
          videos.push({
            url: videoUrl,
            title: 'فيديو فيسبوك',
            description: '',
            thumbnail: '',
            source: 'facebook'
          });
        }
      }
    });
  }

  return videos;
}

/**
 * استخراج رابط فيديو الفيسبوك من رابط جوجل
 * @param {string} googleUrl - رابط من جوجل
 * @returns {string}
 */
function extractFacebookVideoUrl(googleUrl) {
  try {
    // رابط جوجل عادة يكون بهذا الشكل: /url?q=https://facebook.com/...
    const urlParams = new URLSearchParams(googleUrl.split('?')[1]);
    const actualUrl = urlParams.get('q');
    
    if (actualUrl && actualUrl.includes('facebook.com/videos/')) {
      return decodeURIComponent(actualUrl);
    }
    
    // إذا كان الرابط مباشر
    if (googleUrl.includes('facebook.com/videos/')) {
      return decodeURIComponent(googleUrl);
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * البحث المتقدم في فيديوهات الفيسبوك
 * @param {string} query - كلمة البحث
 * @param {number} maxResults - الحد الأقصى للنتائج
 * @returns {Promise<Array>}
 */
async function advancedFacebookSearch(query, maxResults = 30) {
  const allResults = [];
  
  // مصطلحات بحث مختلفة للحصول على نتائج أكثر
  const searchTerms = [
    `${query} المغرب`,
    `${query} maroc`,
    `${query} morocco`,
    `${query} فيديو`,
    `${query} facebook video`
  ];
  
  for (const searchTerm of searchTerms) {
    try {
      if (allResults.length >= maxResults) break;
      
      console.log(`🔎 البحث باستخدام: "${searchTerm}"`);
      const results = await searchFacebookVideos(searchTerm);
      
      results.forEach(result => {
        // تجنب التكرار
        if (!allResults.find(r => r.url === result.url)) {
          allResults.push(result);
        }
      });
      
      // تأخير بين الطلبات لتجنب الحظر
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`⚠️ خطأ في البحث عن: ${searchTerm}`, error.message);
      continue;
    }
  }
  
  return allResults.slice(0, maxResults);
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/facebook/videos?query=المغرب
 *   /api/facebook/videos?query=اوبيتو
 */
router.get("/facebook", async (req, res) => {
  const query = req.query.query || "المغرب";
  const maxResults = parseInt(req.query.max) || 30;

  if (!query.trim()) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال كلمة بحث في المعلمة query"
    });
  }

  try {
    console.log(`🎬 بدء البحث عن فيديوهات: "${query}"`);
    const videos = await advancedFacebookSearch(query, maxResults);

    res.json({
      status: 200,
      success: true,
      query: query,
      totalResults: videos.length,
      videos: videos,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ خطأ في API:', error.message);
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء البحث عن فيديوهات الفيسبوك",
      error: error.message,
      query: query
    });
  }
});

/**
 * نقطة نهاية للبحث السريع
 * مثال:
 *   /api/facebook/search?q=اوبيتو
 */
router.get("/facebook1", async (req, res) => {
  const q = req.query.q;
  
  if (!q || q.trim() === "") {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال كلمة البحث في المعلمة q"
    });
  }

  try {
    const videos = await searchFacebookVideos(q.trim());

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
 * نقطة نهاية للبحث عن فيديوهات مغربية عامة
 */
router.get("/morocco", async (req, res) => {
  try {
    const videos = await advancedFacebookSearch("المغرب", 20);

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
      message: "فشل في جلب الفيديوهات المغربية",
      error: error.message
    });
  }
});

/**
 * نقطة نهاية للصحة
 */
router.get("/health", async (req, res) => {
  try {
    // اختبار اتصال بسيط
    const testResults = await searchFacebookVideos("test");
    
    res.json({
      status: 200,
      success: true,
      message: "✅ خدمة فيديوهات الفيسبوك تعمل بشكل طبيعي",
      testResults: testResults.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 503,
      success: false,
      message: "❌ خدمة فيديوهات الفيسبوك غير متاحة",
      error: error.message
    });
  }
});

module.exports = {
  path: "/api/search",
  name: "facebook videos",
  type: "search",
  url: `${global.t}/api/search/facebook?query=اوبيتو`,
  logo: "https://cdn-icons-png.flaticon.com/512/124/124010.png",
  description: "البحث عن فيديوهات الفيسبوك من المغرب",
  router
};