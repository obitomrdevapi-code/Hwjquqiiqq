const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * استخراج آخر أخبار Apple من MacRumors باستخدام cheerio
 * @returns {Promise<Array>}
 */
async function fetchAppleNewsWithCheerio() {
  const rssUrl = "https://feeds.macrumors.com/MacRumors-All";
  const { data} = await axios.get(rssUrl);
  const $ = cheerio.load(data, { xmlMode: true});

  const items = $("item");
  const result = [];

  items.each((i, el) => {
    if (i>= 10) return false;

    const title = $(el).find("title").text().trim() || "لا عنوان";
    const link = $(el).find("link").text().trim() || "لا رابط";
    const descriptionRaw = $(el).find("description").text().trim() || "لا يوجد وصف";
    const pubDate = $(el).find("pubDate").text().trim() || "غير معروف";

    const cleanDescription = descriptionRaw.replace(/<[^>]*>/g, "").slice(0, 150) + "...";

    result.push({
      title,
      link,
      description: cleanDescription,
      pubDate
});
});

  return result;
}

/**
 * استخراج محتوى خبر Apple مفصل من رابط معين
 * @param {string} url - رابط الخبر
 * @returns {Promise<Object>}
 */
async function fetchAppleNewsDetail(url) {
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };
    
    const { data } = await axios.get(url, { headers });
    const $ = cheerio.load(data);

    let title = $('meta[property="og:title"]').attr('content') || 
                $('title').text().trim() || 
                'لا عنوان';

    let imageUrl = $('meta[property="og:image"]').attr('content') || 
                   'لم يتم العثور على صورة';

    let description = '';
    
    const contentSelectors = [
      '.content--2u3grYDr',
      '.ugc--2nTu61bm',
      '.article-content',
      '.content',
      'article'
    ];

    for (const selector of contentSelectors) {
      const articleContent = $(selector);
      if (articleContent.length > 0) {
        const paragraphs = articleContent.find('p').map((i, el) => $(el).text().trim()).get();
        const validParagraphs = paragraphs.filter(p => 
          p.length > 20 && 
          !p.toLowerCase().includes('related roundup') &&
          !p.toLowerCase().includes('tag:') &&
          !p.toLowerCase().includes('related forum:') &&
          !p.toLowerCase().includes('read full article')
        );
        
        if (validParagraphs.length > 0) {
          description = validParagraphs.join('\n\n');
          break;
        }
      }
    }

    if (description.length < 100) {
      description = $('meta[property="og:description"]').attr('content') || 
                    'لم يتم العثور على الوصف الكامل';
    }

    return {
      title: title.trim(),
      image_url: imageUrl,
      description: description.trim(),
      article_url: url,
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: `خطأ في جلب المحتوى: ${error.message}`
    };
  }
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/news/apple
 */
router.get("/apple", async (req, res) => {
  try {
    const news = await fetchAppleNewsWithCheerio();
    res.json({
      status: 200,
      success: true,
      total: news.length,
      data: news
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء جلب الأخبار.",
      error: err.message
});
}
});

/**
 * نقطة النهاية لجلب محتوى خبر معين
 * مثال:
 *   /api/news/apple_get?url=https://www.macrumors.com/2025/11/07/iphone-18-lineup-24mp-selfie-cameras/
 */
router.get("/apple_get", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "يجب تقديم رابط الخبر في المعلمة url"
      });
    }

    if (!url.includes('macrumors.com')) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "يجب أن يكون الرابط من موقع MacRumors"
      });
    }

    const newsDetail = await fetchAppleNewsDetail(url);
    
    if (!newsDetail.success) {
      return res.status(500).json({
        status: 500,
        success: false,
        message: newsDetail.error
      });
    }

    res.json({
      status: 200,
      success: true,
      data: newsDetail
    });

  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء جلب محتوى الخبر.",
      error: err.message
    });
  }
});

module.exports = {
  path: "/api/news",
  name: "apple news",
  type: "news",
  url: `${global.t}/api/news/apple`,
  logo: "",
  description: "جلب آخر أخبار Apple من MacRumors",
  router
};