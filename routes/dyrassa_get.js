const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

// كائن استخراج محتوى الدروس من dyrassa.com
const dyrassaContent = {
  baseUrl: "https://dyrassa.com",
  
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ar,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive'
  },

  // دالة استخراج المحتوى الرئيسية
  extractContent: async (url) => {
    if (!url) {
      return {
        status: false,
        code: 400,
        error: "⚠️ يرجى تقديم رابط الدرس"
      };
    }

    try {
      console.log(`📖 جاري استخراج المحتوى من: ${url}`);

      const response = await axios.get(url, {
        headers: dyrassaContent.headers,
        timeout: 30000
      });

      if (response.status !== 200) {
        return {
          status: false,
          code: response.status,
          error: `فشل في جلب المحتوى - حالة الخطأ: ${response.status}`
        };
      }

      const $ = cheerio.load(response.data);
      const content = {};

      // استخراج العنوان الرئيسي
      content.title = $('h1.page-title').text().trim() || 
                     $('h1.entry-title').text().trim() || 
                     $('h1').first().text().trim() || 
                     $('title').text().trim();

      // تحديد نوع المحتوى واستخراجه
      content.type = "unknown";
      content.data = {};

      // البحث عن PDFs
      const pdfLinks = [];
      $('a[href*=".pdf"]').each((index, element) => {
        const pdfLink = $(element).attr('href');
        const pdfText = $(element).text().trim();
        if (pdfLink) {
          pdfLinks.push({
            text: pdfText || "تحميل PDF",
            url: pdfLink.startsWith('http') ? pdfLink : `${dyrassaContent.baseUrl}${pdfLink}`
          });
        }
      });

      // البحث عن صور
      const images = [];
      $('img').each((index, element) => {
        const imgSrc = $(element).attr('src');
        const imgAlt = $(element).attr('alt') || "صورة";
        if (imgSrc && !imgSrc.includes('logo') && !imgSrc.includes('avatar')) {
          images.push({
            alt: imgAlt,
            url: imgSrc.startsWith('http') ? imgSrc : `${dyrassaContent.baseUrl}${imgSrc}`
          });
        }
      });

      // استخراج النص الرئيسي
      const mainContent = $('.entry-content, .elementor-widget-wrap, .post-content, .content').first();
      let textContent = "";

      if (mainContent.length) {
        // إزالة العناصر غير المرغوبة
        mainContent.find('script, style, nav, header, footer, .adsbygoogle').remove();
        
        // استخراج النص مع الحفاظ على الهيكل
        const paragraphs = [];
        mainContent.find('p, h2, h3, h4, h5, h6, li').each((index, element) => {
          const text = $(element).text().trim();
          if (text && text.length > 10) { // تجاهل النصوص القصيرة
            const tag = $(element).prop('tagName').toLowerCase();
            paragraphs.push({
              type: tag,
              content: text
            });
          }
        });

        textContent = paragraphs;
      }

      // تحديد نوع المحتوى بناء على المحتوى المستخرج
      if (pdfLinks.length > 0) {
        content.type = "pdf";
        content.data = {
          files: pdfLinks,
          text_preview: textContent.slice(0, 5) // معاينة نصية مختصرة
        };
      } else if (images.length > 5) {
        content.type = "images";
        content.data = {
          images: images,
          text_content: textContent
        };
      } else if (textContent.length > 0) {
        content.type = "text";
        content.data = {
          paragraphs: textContent,
          total_paragraphs: textContent.length
        };
      } else {
        content.type = "mixed";
        content.data = {
          text_content: textContent,
          images: images.slice(0, 10), // أول 10 صور فقط
          pdf_links: pdfLinks
        };
      }

      // استخراج معلومات إضافية
      content.metadata = {
        url: url,
        images_count: images.length,
        pdfs_count: pdfLinks.length,
        text_paragraphs: textContent.length,
        extraction_date: new Date().toISOString()
      };

      return {
        status: true,
        code: 200,
        data: content
      };

    } catch (error) {
      console.error('❌ خطأ في استخراج المحتوى:', error.message);
      
      return {
        status: false,
        code: 500,
        error: `حدث خطأ أثناء استخراج المحتوى: ${error.message}`
      };
    }
  },

  // دالة لاستخراج جميع أنواع الوسائط من الصفحة
  extractAllMedia: async (url) => {
    try {
      const response = await axios.get(url, {
        headers: dyrassaContent.headers,
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const media = {
        pdfs: [],
        images: [],
        videos: [],
        links: [],
        text_blocks: []
      };

      // استخراج PDFs
      $('a[href*=".pdf"]').each((index, element) => {
        const href = $(element).attr('href');
        media.pdfs.push({
          title: $(element).text().trim() || "PDF",
          url: href.startsWith('http') ? href : `${dyrassaContent.baseUrl}${href}`,
          download: true
        });
      });

      // استخراج الصور
      $('img').each((index, element) => {
        const src = $(element).attr('src');
        if (src && !src.includes('logo') && !src.includes('avatar')) {
          media.images.push({
            alt: $(element).attr('alt') || "صورة",
            url: src.startsWith('http') ? src : `${dyrassaContent.baseUrl}${src}`
          });
        }
      });

      // استخراج الفيديوهات
      $('iframe[src*="youtube"], iframe[src*="vimeo"], video source').each((index, element) => {
        const src = $(element).attr('src');
        if (src) {
          media.videos.push({
            url: src,
            platform: src.includes('youtube') ? 'youtube' : src.includes('vimeo') ? 'vimeo' : 'other'
          });
        }
      });

      // استخراج النصوص المنظمة
      $('.entry-content p, .elementor-widget-text-editor p, .post-content p').each((index, element) => {
        const text = $(element).text().trim();
        if (text && text.length > 20) {
          media.text_blocks.push({
            type: 'paragraph',
            content: text,
            length: text.length
          });
        }
      });

      // استخراج العناوين
      $('h1, h2, h3, h4, h5, h6').each((index, element) => {
        const text = $(element).text().trim();
        if (text) {
          media.text_blocks.push({
            type: 'heading',
            level: $(element).prop('tagName').toLowerCase(),
            content: text
          });
        }
      });

      return {
        status: true,
        code: 200,
        data: media
      };

    } catch (error) {
      return {
        status: false,
        code: 500,
        error: `خطأ في استخراج الوسائط: ${error.message}`
      };
    }
  }
};

/**
 * نقطة النهاية الرئيسية - استخراج محتوى الدرس
 * مثال:
 *   GET /api/content?url=https://dyrassa.com/امتحانات-إقليمية-في-الرياضيات/
 */
router.get("/dyrassa_get", async (req, res) => {
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى تقديم رابط الدرس بعد ?url=",
      example: `${global.t}/api/search/dyrassa_get?url=https://dyrassa.com/%d8%a7%d9%85%d8%aa%d8%ad%d8%a7%d9%86%d8%a7%d8%aa-%d8%a5%d9%82%d9%84%d9%8a%d9%85%d9%8a%d8%a9-%d9%81%d9%8a-%d8%a7%d9%84%d8%b1%d9%8a%d8%a7%d8%b6%d9%8a%d8%a7%d8%aa/`
    });
  }

  try {
    console.log(`استخراج محتوى من: ${url}`);
    
    const result = await dyrassaContent.extractContent(url);

    if (!result.status) {
      return res.status(result.code).json({
        status: result.code,
        success: false,
        message: result.error,
        url: url
      });
    }

    res.json({
      status: 200,
      success: true,
      data: {
        lesson_info: {
          title: result.data.title,
          url: url,
          content_type: result.data.type,
          extraction_date: new Date().toISOString()
        },
        content: result.data.data,
        metadata: result.data.metadata
      }
    });
    
  } catch (err) {
    console.error('Content Extraction API Error:', err.message);
    
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء استخراج المحتوى",
      error: err.message,
      url: url
    });
  }
});

/**
 * نقطة النهاية - استخراج جميع الوسائط
 * مثال:
 *   GET /api/content/media?url=https://dyrassa.com/امتحانات-إقليمية-في-الرياضيات/
 */
router.get("/content/media", async (req, res) => {
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى تقديم رابط الدرس بعد ?url=",
      example: `${global.t}/api/search/dyrassa_get?url=https://dyrassa.com/%d8%a7%d9%85%d8%aa%d8%ad%d8%a7%d9%86%d8%a7%d8%aa-%d8%a5%d9%82%d9%84%d9%8a%d9%85%d9%8a%d8%a9-%d9%81%d9%8a-%d8%a7%d9%84%d8%b1%d9%8a%d8%a7%d8%b6%d9%8a%d8%a7%d8%aa/`
    });
  }

  try {
    console.log(`استخراج وسائط من: ${url}`);
    
    const result = await dyrassaContent.extractAllMedia(url);

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
        url: url,
        media_summary: {
          total_pdfs: result.data.pdfs.length,
          total_images: result.data.images.length,
          total_videos: result.data.videos.length,
          total_text_blocks: result.data.text_blocks.length
        },
        media: result.data
      }
    });
    
  } catch (err) {
    console.error('Media Extraction API Error:', err.message);
    
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء استخراج الوسائط",
      error: err.message
    });
  }
});

/**
 * نقطة النهاية - الحالة الصحية للخدمة
 * مثال:
 *   GET /api/content/status
 */
router.get("/content/status", async (req, res) => {
  try {
    // اختبار اتصال بسيط
    const testUrl = "https://dyrassa.com/%d8%a7%d9%84%d9%86%d8%b4%d8%a7%d8%b7-%d8%a7%d9%84%d8%b9%d9%84%d9%85%d9%8a-%d8%a7%d9%84%d8%b3%d8%a7%d8%af%d8%b3-%d8%a7%d8%a8%d8%aa%d8%af%d8%a7%d8%a6%d9%8a/";
    const testResult = await dyrassaContent.extractContent(testUrl);
    
    res.json({
      status: 200,
      success: true,
      data: {
        service: "Dyrasa Content Extraction API",
        status: "operational",
        base_url: dyrassaContent.baseUrl,
        last_check: new Date().toISOString(),
        extraction_working: testResult.status,
        supported_types: ["pdf", "text", "images", "mixed"]
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
  name: "dyrassa get content",
  type: "search",
  url: `${global.t}/api/search/dyrassa_get?url=https://dyrassa.com/%d8%a7%d9%85%d8%aa%d8%ad%d8%a7%d9%86%d8%a7%d8%aa-%d8%a5%d9%82%d9%84%d9%8a%d9%85%d9%8a%d8%a9-%d9%81%d9%8a-%d8%a7%d9%84%d8%b1%d9%8a%d8%a7%d8%b6%d9%8a%d8%a7%d8%aa/`,
  logo: "",
  description: "استخراج محتوى الدروس من موقع dyrassa",
  router
};