// بسم الله الرحمن الرحيم ✨
// Facebook Videos Scraper API
// استخراج فيديوهات الفيسبوك من المغرب باستخدام Google Search API

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
  const url = `https://www.google.com/complete/search`;
  
  const params = {
    q: `site:facebook.com/videos ${query}`,
    cp: 0,
    client: "mobile-gws-modeless-video",
    xssi: "t",
    gs_pcrt: 2,
    ds: "v",
    hl: "ar-SG",
    authuser: 0,
    pq: `facebook.com/videos ${query}`,
    psi: "mOEYacjrIODfseMPi_LkyA0.1763238292775",
    dpr: 1.75,
    pfq: `facebook.com/videos ${query}`
  };

  const headers = {
    'authority': 'www.google.com',
    'accept': '*/*',
    'accept-language': 'ar-AE,ar;q=0.9,fr-MA;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
    'cookie': 'AEC=AaJma5taCG4SpqSw14MOv4O5Uowl-yQXMdTpgSHnuJnyCgpeMwj7rRCFboE; NID=526=Lb8RF5NvIUBGYcGM5ZaO47lldkBrFK1hRUjJMNhCqec3iDelkOXNczwZXDvsMfLPjQWrq35Zuq8Ac4nESaQPA5yb_B3EmGUU4KYG4INrIKKiDjWir1LsrAae7I4jEmTKFSsZHo2xNpsiRvRtzh3VSL_cOUOdiVIgchySelnwir0MesQ5lWADuiIXwH4CN1pPW4PCEP-ptYr3hvAXfaMpoOi5PZdolw1ALtST5juErJ0yH9DO-cjSmkxULoEFHQ',
    'downlink': '0.35',
    'referer': 'https://www.google.com/',
    'rtt': '800',
    'sec-ch-prefers-color-scheme': 'light',
    'sec-ch-ua': '"Chromium";v="107", "Not=A?Brand";v="24"',
    'sec-ch-ua-arch': '',
    'sec-ch-ua-bitness': '',
    'sec-ch-ua-full-version': '"107.0.5304.74"',
    'sec-ch-ua-full-version-list': '"Chromium";v="107.0.5304.74", "Not=A?Brand";v="24.0.0.0"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-model': '"SM-A217F"',
    'sec-ch-ua-platform': '"Android"',
    'sec-ch-ua-platform-version': '"12.0.0"',
    'sec-ch-ua-wow64': '?0',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Linux; Android 12; SM-A217F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36',
    'x-client-data': 'CN/4ygE='
  };

  try {
    const response = await axios.get(url, { params, headers });
    
    // معالجة الاستجابة لاستخراج النتائج
    const results = parseGoogleResponse(response.data);
    return results;
    
  } catch (error) {
    console.error('Error searching Facebook videos:', error.message);
    throw new Error('فشل في جلب النتائج من جوجل');
  }
}

/**
 * تحليل استجابة جوجل واستخراج النتائج
 * @param {string} data - البيانات الخام من جوجل
 * @returns {Array}
 */
function parseGoogleResponse(data) {
  const results = [];
  
  try {
    // إزالة البادئة من استجابة جوجل
    const cleanData = data.replace(/^\)\]\}'/, '');
    const jsonData = JSON.parse(cleanData);
    
    // استخراج الاقتراحات والنتائج
    if (jsonData[1] && Array.isArray(jsonData[1])) {
      jsonData[1].forEach(item => {
        if (item[0] && typeof item[0] === 'string') {
          // استخراج الروابط من النص
          const videoLinks = extractVideoLinks(item[0]);
          results.push(...videoLinks);
        }
      });
    }
    
  } catch (error) {
    console.error('Error parsing Google response:', error.message);
  }
  
  return results;
}

/**
 * استخراج روابط الفيديوهات من النص
 * @param {string} text - النص المحتوي على الروابط
 * @returns {Array}
 */
function extractVideoLinks(text) {
  const links = [];
  const videoRegex = /https:\/\/www\.facebook\.com\/[^"'\s]+\/videos\/[^"'\s]+/g;
  const matches = text.match(videoRegex);
  
  if (matches) {
    matches.forEach(match => {
      if (match.includes('/videos/')) {
        links.push({
          url: match,
          title: extractVideoTitle(match),
          source: 'facebook'
        });
      }
    });
  }
  
  return links;
}

/**
 * استخراج عنوان الفيديو من الرابط
 * @param {string} url - رابط الفيديو
 * @returns {string}
 */
function extractVideoTitle(url) {
  try {
    // استخراج الجزء المهم من الرابط
    const parts = url.split('/');
    const videoPart = parts.find(part => part.includes('videos'));
    if (videoPart) {
      return `فيديو فيسبوك - ${videoPart}`;
    }
    return 'فيديو فيسبوك';
  } catch (error) {
    return 'فيديو فيسبوك';
  }
}

/**
 * البحث المتقدم في فيديوهات الفيسبوك
 * @param {string} query - كلمة البحث
 * @param {number} maxResults - الحد الأقصى للنتائج
 * @returns {Promise<Array>}
 */
async function advancedFacebookSearch(query, maxResults = 50) {
  const allResults = [];
  const searchTerms = [
    `${query} المغرب`,
    `${query} maroc`,
    `${query} morocco`,
    `${query} فيديو`
  ];
  
  for (const searchTerm of searchTerms) {
    try {
      const results = await searchFacebookVideos(searchTerm);
      results.forEach(result => {
        // تجنب التكرار
        if (!allResults.find(r => r.url === result.url)) {
          allResults.push(result);
        }
      });
      
      // إذا وصلنا للحد المطلوب نوقف
      if (allResults.length >= maxResults) {
        break;
      }
      
      // تأخير بين الطلبات لتجنب الحظر
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Error searching for: ${searchTerm}`, error.message);
      continue;
    }
  }
  
  return allResults.slice(0, maxResults);
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/facebook/videos?query=المغرب
 *   /api/facebook/videos?query=كرة قدم
 */
router.get("/facebook", async (req, res) => {
  const query = req.query.query || "المغرب";
  const maxResults = parseInt(req.query.max) || 50;

  if (!query.trim()) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال كلمة بحث في المعلمة query"
    });
  }

  try {
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
 *   /api/facebook/search?q=المغرب
 */
router.get("/facebook2", async (req, res) => {
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
 * نقطة نهاية للصحة
 */
router.get("/health", async (req, res) => {
  try {
    // اختبار اتصال بسيط
    await searchFacebookVideos("test");
    
    res.json({
      status: 200,
      success: true,
      message: "✅ خدمة فيديوهات الفيسبوك تعمل بشكل طبيعي",
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
  url: `${global.t}/api/search/facebook?query=المغرب`,
  logo: "https://cdn-icons-png.flaticon.com/512/124/124010.png",
  description: "البحث عن فيديوهات الفيسبوك من المغرب",
  router
};