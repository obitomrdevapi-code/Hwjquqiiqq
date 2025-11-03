const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

// كائن البحث في موقع dyrassa.com
const dyrassaSearch = {
  baseUrl: "https://dyrassa.com",
  searchUrl: "https://dyrassa.com/?s=",
  
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ar,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive'
  },

  // دالة البحث الرئيسية
  search: async (query) => {
    if (!query || query.trim() === '') {
      return {
        status: false,
        code: 400,
        error: "⚠️ يرجى تقديم استعلام بحث بعد ?q="
      };
    }

    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `${dyrassaSearch.searchUrl}${encodedQuery}`;
      
      console.log(`🔍 جاري البحث عن: '${query}'`);
      console.log(`📝 الرابط: ${url}`);

      const response = await axios.get(url, {
        headers: dyrassaSearch.headers,
        timeout: 30000
      });

      if (response.status !== 200) {
        return {
          status: false,
          code: response.status,
          error: `فشل في جلب النتائج - حالة الخطأ: ${response.status}`
        };
      }

      const $ = cheerio.load(response.data);
      const results = [];

      // البحث عن المقالات
      $('article').each((index, element) => {
        const article = $(element);
        const result = {};

        // استخراج العنوان
        const titleElem = article.find('h2.entry-title, h1.entry-title, h2, h1').first();
        if (titleElem.length) {
          const linkElem = titleElem.find('a').first();
          if (linkElem.length) {
            result.title = titleElem.text().trim();
            result.link = linkElem.attr('href') || '';
          } else {
            result.title = titleElem.text().trim();
            const articleLink = article.find('a[href]').first();
            result.link = articleLink.length ? articleLink.attr('href') : '';
          }
        }

        // استخراج الوصف المختصر
        if (result.title) {
          const contentElem = article.find('div.entry-content, div.entry-summary, p').first();
          if (contentElem.length) {
            let excerpt = contentElem.text().trim();
            result.excerpt = excerpt.length > 200 ? excerpt.substring(0, 200) + "..." : excerpt;
          } else {
            result.excerpt = "لا يوجد وصف";
          }

          // إضافة النتيجة
          results.push(result);
        }
      });

      // إذا لم نجد نتائج بالطريقة العادية، نبحث في جميع الروابط
      if (results.length === 0) {
        $('a[href]').each((index, element) => {
          const link = $(element);
          const text = link.text().trim();
          
          if (text && text.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              title: text,
              link: link.attr('href'),
              excerpt: "تم العثور على نتيجة من خلال البحث العام"
            });
          }
        });
      }

      return {
        status: true,
        code: 200,
        data: {
          query: query,
          total_results: results.length,
          results: results
        }
      };

    } catch (error) {
      console.error('❌ خطأ في البحث:', error.message);
      
      return {
        status: false,
        code: 500,
        error: `حدث خطأ أثناء البحث: ${error.message}`
      };
    }
  },

  // دالة تصحيح الأخطاء
  debugSearch: async (query) => {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `${dyrassaSearch.searchUrl}${encodedQuery}`;
      
      console.log(`🔍 جاري فحص البحث عن: '${query}'`);
      console.log(`📝 الرابط: ${url}`);

      const response = await axios.get(url, {
        headers: dyrassaSearch.headers,
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const debugInfo = {
        status_code: response.status,
        url: url,
        articles_count: $('article').length,
        articles: []
      };

      // جمع معلومات عن المقالات
      $('article').each((index, element) => {
        const article = $(element);
        const articleInfo = {
          index: index + 1,
          html: article.html() ? article.html().substring(0, 200) + "..." : "لا يوجد محتوى",
          titles: []
        };

        // جمع جميع العناوين المحتملة
        article.find('h1, h2, h3, h4, h5, h6').each((i, titleElem) => {
          articleInfo.titles.push({
            tag: $(titleElem).prop('tagName'),
            text: $(titleElem).text().trim(),
            class: $(titleElem).attr('class') || ''
          });
        });

        debugInfo.articles.push(articleInfo);
      });

      return {
        status: true,
        code: 200,
        debug_info: debugInfo
      };

    } catch (error) {
      return {
        status: false,
        code: 500,
        error: `خطأ في التصحيح: ${error.message}`
      };
    }
  }
};

/**
 * نقطة النهاية الرئيسية - البحث عن الدروس
 * مثال:
 *   GET /api/dyrassa/search?q=تعلم البرمجة
 */
router.get("/dyrassa", async (req, res) => {
  const query = req.query.q;
  
  if (!query) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى تقديم استعلام بحث بعد ?q=",
      example: `${global.t}/api/dyrassa/search?q=تعلم البرمجة`
    });
  }

  try {
    console.log(`بحث عن: ${query}`);
    
    const result = await dyrassaSearch.search(query);

    if (!result.status) {
      return res.status(result.code).json({
        status: result.code,
        success: false,
        message: result.error,
        query: query
      });
    }

    res.json({
      status: 200,
      success: true,
      data: {
        search_info: {
          query: query,
          total_results: result.data.total_results,
          site: "dyrassa.com"
        },
        results: result.data.results.map((item, index) => ({
          id: index + 1,
          title: item.title,
          link: item.link,
          excerpt: item.excerpt
        }))
      }
    });
    
  } catch (err) {
    console.error('Dyrasa Search API Error:', err.message);
    
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء البحث",
      error: err.message,
      query: query
    });
  }
});

/**
 * نقطة النهاية - تصحيح أخطاء البحث
 * مثال:
 *   GET /api/dyrassa/debug?q=تعلم البرمجة
 */
router.get("/dyrassaa", async (req, res) => {
  const query = req.query.q;
  
  if (!query) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى تقديم استعلام بحث بعد ?q=",
      example: `${global.t}/api/dyrassa/debug?q=تعلم البرمجة`
    });
  }

  try {
    console.log(`تصحيح البحث عن: ${query}`);
    
    const result = await dyrassaSearch.debugSearch(query);

    if (!result.status) {
      return res.status(result.code).json({
        status: result.code,
        success: false,
        message: result.error
      });
    }

    res.json({
      status: 200,
      success: true,
      data: {
        debug_info: result.debug_info,
        query: query
      }
    });
    
  } catch (err) {
    console.error('Dyrasa Debug API Error:', err.message);
    
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء تصحيح البحث",
      error: err.message
    });
  }
});

/**
 * نقطة النهاية - الحالة الصحية للخدمة
 * مثال:
 *   GET /api/dyrassa/status
 */
router.get("/status", async (req, res) => {
  try {
    // اختبار اتصال بسيط
    const testResult = await dyrassaSearch.search("test");
    
    res.json({
      status: 200,
      success: true,
      data: {
        service: "Dyrasa Search API",
        status: "operational",
        base_url: dyrassaSearch.baseUrl,
        last_check: new Date().toISOString(),
        search_working: testResult.status
      }
    });
    
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "الخدمة غير متاحة",
      error: err.message
    });
  }
});

module.exports = {
  path: "/api/search",
  name: "dyrassa search",
  type: "search",
  url: `${global.t}/api/search/dyrassa?q=تعلم البرمجة`,
  logo: "",
  description: "أداة البحث عن الدروس في موقع dyrassa.com",
  router
};