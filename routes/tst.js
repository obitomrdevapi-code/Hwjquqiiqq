// بسم الله الرحمن الرحيم 📰
// LE360 Morocco News Scraper API
// استخراج آخر الأخبار من موقع le360.ma

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * جلب آخر الأخبار من الصفحة الرئيسية
 * @returns {Promise<Array>}
 */
async function fetchLatestNews() {
  const { data } = await axios.get("https://ar.le360.ma/", {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  
  const $ = cheerio.load(data);
  const news = [];

  // استخراج الأخبار من الأقسام المختلفة
  try {
    // 1. الأخبار من الشريط الجانبي (آخر الأخبار)
    $("div.list-container, div.right-rail-section").each((_, section) => {
      $(section).find("article.list-item-simple, article.fil-dactualite-item").each((_, article) => {
        const titleElem = $(article).find("a.simple-list-headline-anchor, a.fil-dactualite-item-anchor");
        const title = titleElem.text().trim();
        let link = titleElem.attr("href");
        
        if (title && link) {
          if (!link.startsWith('http')) {
            link = "https://ar.le360.ma" + link;
          }
          
          const timeElem = $(article).find("span.time-part");
          const time = timeElem.text().trim() || "غير محدد";
          
          const imageElem = $(article).find("img");
          let imageUrl = imageElem.attr("src") || null;
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = "https://ar.le360.ma" + imageUrl;
          }
          
          news.push({
            title,
            link,
            time,
            section: "آخر الأخبار",
            type: "نص",
            image_url: imageUrl
          });
        }
      });
    });

    // 2. الأخبار الرئيسية
    $("div.selections-list-item, div.article-list-item").each((_, section) => {
      const titleElem = $(section).find("a.text, a.headline-text, a");
      const title = titleElem.first().text().trim();
      let link = titleElem.attr("href");
      
      if (title && link) {
        if (!link.startsWith('http')) {
          link = "https://ar.le360.ma" + link;
        }
        
        const categoryElem = $(section).find("a.category-link");
        const category = categoryElem.text().trim() || "عام";
        
        const timeElem = $(section).find("span.time-part");
        const time = timeElem.text().trim() || "غير محدد";
        
        const imageElem = $(section).find("img");
        let imageUrl = imageElem.attr("src") || null;
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = "https://ar.le360.ma" + imageUrl;
        }
        
        news.push({
          title,
          link,
          time,
          section: category,
          type: "نص",
          image_url: imageUrl
        });
      }
    });

    // 3. أخبار الفيديو
    $("div.homepage-video-block, div.video-item").each((_, item) => {
      const titleElem = $(item).find("a.video-item_text, a");
      const title = titleElem.text().trim();
      let link = titleElem.attr("href");
      
      if (title && link) {
        if (!link.startsWith('http')) {
          link = "https://ar.le360.ma" + link;
        }
        
        const imageElem = $(item).find("img");
        let imageUrl = imageElem.attr("src") || null;
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = "https://ar.le360.ma" + imageUrl;
        }
        
        news.push({
          title,
          link,
          time: "غير محدد",
          section: "فيديو",
          type: "فيديو",
          image_url: imageUrl
        });
      }
    });

  } catch (error) {
    console.error("Error extracting news:", error);
  }

  // إزالة التكرارات
  const uniqueNews = [];
  const seenTitles = new Set();
  
  news.forEach(item => {
    const cleanTitle = item.title.trim().toLowerCase();
    if (cleanTitle && !seenTitles.has(cleanTitle) && cleanTitle.length > 10) {
      seenTitles.add(cleanTitle);
      uniqueNews.push(item);
    }
  });

  return uniqueNews.slice(0, 20); // إرجاع آخر 20 خبر
}

/**
 * استخراج محتوى الخبر الكامل
 * @param {string} url - رابط الخبر
 * @returns {Promise<object>}
 */
async function fetchArticleContent(url) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    
    const articleData = {
      title: '',
      subtitle: '',
      author: '',
      publish_date: '',
      content: [],
      image_url: '',
      section: ''
    };

    // استخراج العنوان الرئيسي
    const titleElem = $("h1.headline-container");
    articleData.title = titleElem.text().trim();

    // استخراج العنوان الفرعي
    const subtitleElem = $("h2.subheadline-container");
    articleData.subtitle = subtitleElem.text().trim();

    // استخراج المؤلف
    const authorElem = $("span.byline-credits-bold");
    articleData.author = authorElem.text().trim();

    // استخراج تاريخ النشر
    const dateElem = $("div.subheadline-date");
    articleData.publish_date = dateElem.text().trim();

    // استخراج القسم
    const sectionElem = $("a.overline-link");
    articleData.section = sectionElem.text().trim();

    // استخراج الصورة الرئيسية
    const leadImage = $("figure.lead-art-wrapper img");
    let imageUrl = leadImage.attr("src");
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = "https://ar.le360.ma" + imageUrl;
    }
    articleData.image_url = imageUrl;

    // استخراج محتوى المقال
    const articleBody = $("article.article-body-wrapper");
    if (articleBody.length > 0) {
      articleBody.find("p, h2, h3, h4").each((_, element) => {
        const text = $(element).text().trim();
        if (text && text.length > 10) {
          const tagName = $(element).prop("tagName").toLowerCase();
          if (tagName === 'p') {
            articleData.content.push({
              type: 'paragraph',
              text: text
            });
          } else if (['h2', 'h3', 'h4'].includes(tagName)) {
            articleData.content.push({
              type: 'heading',
              level: tagName,
              text: text
            });
          }
        }
      });
    }

    // طريقة بديلة إذا لم يتم العثور على محتوى
    if (articleData.content.length === 0) {
      $("p.body-paragraph").each((_, p) => {
        const text = $(p).text().trim();
        if (text && text.length > 10) {
          articleData.content.push({
            type: 'paragraph',
            text: text
          });
        }
      });
    }

    return articleData;
    
  } catch (error) {
    console.error("Error fetching article content:", error);
    return null;
  }
}

/**
 * نقطة النهاية لجلب آخر الأخبار
 * مثال:
 *   /morocco_le360
 */
router.get("/morocco_le360", async (req, res) => {
  try {
    const news = await fetchLatestNews();
    
    res.json({
      status: 200,
      success: true,
      total_news: news.length,
      source: "LE360 Morocco",
      last_updated: new Date().toISOString(),
      news: news
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
 * نقطة النهاية لجلب تفاصيل الخبر
 * مثال:
 *   /morocco_le360?url=https://ar.le360.ma/politique/12345
 */
router.get("/morocco_le360/get_news", async (req, res) => {
  const articleUrl = req.query.url;
  
  if (!articleUrl) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى تقديم رابط الخبر في المعلمة url"
    });
  }

  try {
    const articleContent = await fetchArticleContent(articleUrl);
    
    if (!articleContent || !articleContent.title) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "🚫 لم يتم العثور على محتوى للخبر المطلوب."
      });
    }

    res.json({
      status: 200,
      success: true,
      article: articleContent
    });
    
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء استخراج محتوى الخبر.",
      error: err.message
    });
  }
});

module.exports = {
  path: "/api/news",
  name: "LE360 Morocco News",
  type: "news",
  url: `${global.t}/api/news/morocco_le360`,
  logo: "https://cdn-icons-png.flaticon.com/512/2965/2965879.png",
  description: "جلب آخر الأخبار من موقع LE360 المغربي",
  router
};