// بسم الله الرحمن الرحيم ✨
// Quran MP4Upload Video Stream API
// بث فيديوهات القرآن مباشرة من موقع MP4Upload

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * استخراج رابط الفيديو المباشر من MP4Upload
 * @param {string} url - رابط الفيديو
 * @returns {Promise<string>}
 */
async function fetchVideoUrl(url) {
  // تحويل الرابط إلى رابط embed إذا كان رابطاً عادياً
  let embedUrl = url;
  if (url.includes('/embed-')) {
    // الرابط بالفعل embed
    embedUrl = url;
  } else {
    // استخراج المعرف من الرابط العادي وتحويله إلى embed
    const videoId = url.match(/\/([a-zA-Z0-9]+)$/)?.[1];
    if (videoId) {
      embedUrl = `https://www.mp4upload.com/embed-${videoId}.html`;
    }
  }

  const { data } = await axios.get(embedUrl, {
    headers: {
      'authority': 'www.mp4upload.com',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'accept-language': 'ar-AE,ar;q=0.9,fr-MA;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
      'cookie': 'affiliate=KZSm92qiRxMprG3OHA1JRWhuYeafnm2zqANp2cF7gCKZYvcfkWz5m%2BZaNLPzdTSRtheFTwGZPVjnPQ1%2FIHDb6cpCoHTSjHvmrEcF0yJDmKfAGsj2rP9EFVk92jYbV8S6RVX4AIB71T2bAd2Cezkt5d0%3D',
      'referer': embedUrl,
      'sec-ch-ua': '"Chromium";v="107", "Not=A?Brand";v="24"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'sec-fetch-dest': 'iframe',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'upgrade-insecure-requests': '1',
      'user-agent': 'Mozilla/5.0 (Linux; Android 12; SM-A217F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36'
    },
    timeout: 30000
  });

  // البحث عن رابط الفيديو في الكود المصدري
  let videoUrl = null;

  // طريقة 1: البحث في JavaScript variables
  const jsMatch = data.match(/src\s*:\s*["']([^"']+\.mp4[^"']*)["']/i);
  if (jsMatch && jsMatch[1]) {
    videoUrl = jsMatch[1];
    if (videoUrl.startsWith('//')) {
      videoUrl = 'https:' + videoUrl;
    } else if (videoUrl.startsWith('/')) {
      videoUrl = 'https://www.mp4upload.com' + videoUrl;
    }
  }

  // طريقة 2: البحث في iframe أو video tags
  if (!videoUrl) {
    const videoMatch = data.match(/<video[^>]+src=["']([^"']+)["']/i);
    if (videoMatch && videoMatch[1]) {
      videoUrl = videoMatch[1];
      if (videoUrl.startsWith('//')) {
        videoUrl = 'https:' + videoUrl;
      } else if (videoUrl.startsWith('/')) {
        videoUrl = 'https://www.mp4upload.com' + videoUrl;
      }
    }
  }

  // طريقة 3: البحث في أي رابط يحتوي على mp4
  if (!videoUrl) {
    const mp4Match = data.match(/(https?:\/\/[^\s"']+\.mp4[^\s"']*)/i);
    if (mp4Match && mp4Match[1]) {
      videoUrl = mp4Match[1];
    }
  }

  return videoUrl;
}

/**
 * نقطة النهاية الرئيسية - بث الفيديو مباشرة
 * مثال:
 *   /api/mp4upload/stream?url=https://www.mp4upload.com/vjbax053zqsq
 *   /api/mp4upload/stream?url=https://www.mp4upload.com/embed-vjbax053zqsq.html
 */
router.get("/mp4upload", async (req, res) => {
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى تقديم رابط الفيديو"
    });
  }

  // التحقق من أن الرابط صحيح
  if (!url.includes('mp4upload.com')) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "🚫 الرابط غير صحيح. يجب أن يكون من موقع mp4upload.com"
    });
  }

  try {
    // استخراج رابط الفيديو المباشر
    const videoUrl = await fetchVideoUrl(url);
    
    if (!videoUrl) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "❌ تعذر العثور على رابط التحميل المباشر"
      });
    }

    console.log('🎯 تم استخراج الرابط:', videoUrl);

    // إعداد رأسيات الاستجابة للفيديو
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'inline; filename="quran_video.mp4"');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // تخزين لمدة ساعة

    // بث الفيديو مباشرة إلى العميل
    const videoResponse = await axios({
      method: 'GET',
      url: videoUrl,
      responseType: 'stream',
      headers: {
        'authority': 'www.mp4upload.com',
        'referer': url.includes('/embed-') ? url : `https://www.mp4upload.com/embed-${url.match(/\/([a-zA-Z0-9]+)$/)?.[1]}.html`,
        'user-agent': 'Mozilla/5.0 (Linux; Android 12; SM-A217F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36',
        'accept': '*/*',
        'sec-fetch-dest': 'video',
        'sec-fetch-mode': 'no-cors'
      },
      timeout: 60000
    });

    // تحويل الفيديو إلى العميل
    videoResponse.data.pipe(res);

    // معالجة الأخطاء أثناء البث
    videoResponse.data.on('error', (error) => {
      console.error('❌ خطأ في بث الفيديو:', error);
      if (!res.headersSent) {
        res.status(500).json({
          status: 500,
          success: false,
          message: "حدث خطأ أثناء بث الفيديو"
        });
      }
    });

  } catch (err) {
    console.error('❌ خطأ في الاستخراج:', err);
    
    if (!res.headersSent) {
      res.status(500).json({
        status: 500,
        success: false,
        message: "حدث خطأ أثناء استخراج الفيديو",
        error: err.message
      });
    }
  }
});

/**
 * نقطة النهاية للتحميل المباشر
 * مثال:
 *   /api/mp4upload/download?url=https://www.mp4upload.com/vjbax053zqsq
 */
router.get("/mp4upload2", async (req, res) => {
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى تقديم رابط الفيديو"
    });
  }

  try {
    const videoUrl = await fetchVideoUrl(url);
    
    if (!videoUrl) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "❌ تعذر العثور على رابط التحميل المباشر"
      });
    }

    console.log('📥 رابط التحميل:', videoUrl);

    // إعداد رأسيات التحميل
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'attachment; filename="quran_recitation.mp4"');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // بث الفيديو للتحميل
    const videoResponse = await axios({
      method: 'GET',
      url: videoUrl,
      responseType: 'stream',
      headers: {
        'authority': 'www.mp4upload.com',
        'referer': url.includes('/embed-') ? url : `https://www.mp4upload.com/embed-${url.match(/\/([a-zA-Z0-9]+)$/)?.[1]}.html`,
        'user-agent': 'Mozilla/5.0 (Linux; Android 12; SM-A217F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36',
        'accept': '*/*'
      },
      timeout: 60000
    });

    videoResponse.data.pipe(res);

  } catch (err) {
    console.error('❌ خطأ في التحميل:', err);
    if (!res.headersSent) {
      res.status(500).json({
        status: 500,
        success: false,
        message: "حدث خطأ أثناء تحميل الفيديو",
        error: err.message
      });
    }
  }
});

/**
 * نقطة النهاية للحصول على الرابط المباشر فقط (JSON)
 * مثال:
 *   /api/mp4upload/url?url=https://www.mp4upload.com/vjbax053zqsq
 */
router.get("/url", async (req, res) => {
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى تقديم رابط الفيديو"
    });
  }

  try {
    const videoUrl = await fetchVideoUrl(url);
    
    if (!videoUrl) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "❌ تعذر العثور على رابط التحميل المباشر"
      });
    }

    res.json({
      status: 200,
      success: true,
      data: {
        original_url: url,
        direct_url: videoUrl,
        embed_url: url.includes('/embed-') ? url : `https://www.mp4upload.com/embed-${url.match(/\/([a-zA-Z0-9]+)$/)?.[1]}.html`,
        headers: {
          'referer': url.includes('/embed-') ? url : `https://www.mp4upload.com/embed-${url.match(/\/([a-zA-Z0-9]+)$/)?.[1]}.html`,
          'user-agent': 'Mozilla/5.0 (Linux; Android 12; SM-A217F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36'
        }
      }
    });

  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء استخراج الرابط",
      error: err.message
    });
  }
});

/**
 * نقطة النهاية للتحقق من حالة الخادم
 */
router.get("/status", async (req, res) => {
  res.json({
    status: 200,
    success: true,
    message: "🎉 MP4Upload Stream API يعمل بشكل طبيعي",
    timestamp: new Date().toISOString(),
    endpoints: {
      stream: "/api/mp4upload/stream?url=URL",
      download: "/api/mp4upload/download?url=URL", 
      url: "/api/mp4upload/url?url=URL",
      status: "/api/mp4upload/status"
    },
    examples: {
      regular_url: "https://www.mp4upload.com/vjbax053zqsq",
      embed_url: "https://www.mp4upload.com/embed-vjbax053zqsq.html"
    }
  });
});

module.exports = {
  path: "/api/download",
  name: "mp4upload video stream",
  type: "download",
  url: `${global.t}/api/download/mp4upload?url=https://www.mp4upload.com/vjbax053zqsq`,
  logo: "https://cdn-icons-png.flaticon.com/512/1384/1384060.png",
  description: "بث فيديوهات القرآن مباشرة من موقع MP4Upload",
  router
};