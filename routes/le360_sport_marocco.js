// بسم الله الرحمن الرحيم ⚽
// LE360 Sport Morocco News Scraper API
// استخراج آخر الأخبار الرياضية من موقع ar.sport.le360.ma

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * جلب آخر الأخبار الرياضية من الصفحة الرئيسية
 * @returns {Promise<Array>}
 */
async function fetchLatestSportNews() {
  const { data } = await axios.get("https://ar.sport.le360.ma/", {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  
  const $ = cheerio.load(data);
  const news = [];

  try {
    // 1. استخراج الأخبار من قسم "À la une" (العناوين الرئيسية)
    $(".a-la-une-sports .selections-list-item").each((_, item) => {
      const titleElem = $(item).find("a.text");
      const title = titleElem.text().trim();
      let link = titleElem.attr("href");
      
      if (title && link) {
        if (!link.startsWith('http')) {
          link = "https://ar.sport.le360.ma" + link;
        }
        
        const categoryElem = $(item).find("a.category-link .category");
        const category = categoryElem.text().trim() || "رياضة";
        
        const imageElem = $(item).find("img.c-image");
        let imageUrl = imageElem.attr("src") || null;
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = "https://ar.sport.le360.ma" + imageUrl;
        }
        
        news.push({
          title,
          link,
          section: category,
          type: "مقال",
          image_url: imageUrl,
          source: "LE360 Sport"
        });
      }
    });

    // 2. استخراج الأخبار من قسم "كرة القدم"
    $(".selection-articles-block .selections-list-item").each((_, item) => {
      const titleElem = $(item).find("a.text");
      const title = titleElem.text().trim();
      let link = titleElem.attr("href");
      
      if (title && link) {
        if (!link.startsWith('http')) {
          link = "https://ar.sport.le360.ma" + link;
        }
        
        const categoryElem = $(item).find("a.category-link .category");
        const category = categoryElem.text().trim() || "كرة القدم";
        
        const imageElem = $(item).find("img.c-image");
        let imageUrl = imageElem.attr("src") || null;
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = "https://ar.sport.le360.ma" + imageUrl;
        }
        
        news.push({
          title,
          link,
          section: category,
          type: "مقال",
          image_url: imageUrl,
          source: "LE360 Sport"
        });
      }
    });

    // 3. استخراج أخبار الفيديو
    $(".homepage-video-block .video-item").each((_, item) => {
      const titleElem = $(item).find("a.video-item_text");
      const title = titleElem.text().trim();
      let link = titleElem.attr("href");
      
      if (title && link) {
        if (!link.startsWith('http')) {
          link = "https://ar.sport.le360.ma" + link;
        }
        
        const categoryElem = $(item).find("a.category-link .category");
        const category = categoryElem.text().trim() || "فيديو";
        
        const imageElem = $(item).find("img.c-image");
        let imageUrl = imageElem.attr("src") || null;
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = "https://ar.sport.le360.ma" + imageUrl;
        }
        
        news.push({
          title,
          link,
          section: category,
          type: "فيديو",
          image_url: imageUrl,
          source: "LE360 Sport"
        });
      }
    });

    // 4. استخراج المقالات من القائمة الرئيسية
    $(".article-list-item").each((_, item) => {
      const titleElem = $(item).find(".headline-text");
      const title = titleElem.text().trim();
      let link = $(item).find("a").attr("href");
      
      if (title && link) {
        if (!link.startsWith('http')) {
          link = "https://ar.sport.le360.ma" + link;
        }
        
        const categoryElem = $(item).find(".overline-text a");
        const category = categoryElem.text().trim() || "رياضة";
        
        const dateElem = $(item).find(".article-list-date");
        const date = dateElem.text().trim() || "غير محدد";
        
        const imageElem = $(item).find("img.c-image");
        let imageUrl = imageElem.attr("src") || null;
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = "https://ar.sport.le360.ma" + imageUrl;
        }
        
        news.push({
          title,
          link,
          section: category,
          type: "مقال",
          publish_date: date,
          image_url: imageUrl,
          source: "LE360 Sport"
        });
      }
    });

    // 5. استخراج المقالات الأكثر قراءة
    $(".top360-item").each((_, item) => {
      const titleElem = $(item).find(".top360-item-title");
      const title = titleElem.text().trim();
      let link = $(item).find("a").attr("href");
      
      if (title && link) {
        if (!link.startsWith('http')) {
          link = "https://ar.sport.le360.ma" + link;
        }
        
        news.push({
          title,
          link,
          section: "الأكثر قراءة",
          type: "مقال",
          source: "LE360 Sport"
        });
      }
    });

  } catch (error) {
    console.error("Error extracting sport news:", error);
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

  return uniqueNews.slice(0, 25); // إرجاع آخر 25 خبر
}

/**
 * استخراج محتوى الخبر الرياضي الكامل
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
      section: '',
      description: ''
    };

    // استخراج العنوان الرئيسي
    const titleElem = $("h1.headline-container");
    articleData.title = titleElem.text().trim();

    // استخراج العنوان الفرعي
    const subtitleElem = $("h2.subheadline-container");
    articleData.subtitle = subtitleElem.text().trim();

    // استخراج الوصف
    const descriptionElem = $(".description-text");
    articleData.description = descriptionElem.text().trim();

    // استخراج المؤلف
    const authorElem = $("span.byline-credits-bold");
    articleData.author = authorElem.text().trim();

    // استخراج تاريخ النشر
    const dateElem = $(".article-list-date, .subheadline-date");
    articleData.publish_date = dateElem.first().text().trim();

    // استخراج القسم
    const sectionElem = $("a.overline-link");
    articleData.section = sectionElem.text().trim();

    // استخراج الصورة الرئيسية
    const leadImage = $("figure.lead-art-wrapper img, .article-list--image-container img");
    let imageUrl = leadImage.attr("src");
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = "https://ar.sport.le360.ma" + imageUrl;
    }
    articleData.image_url = imageUrl;

    // استخراج محتوى المقال
    const articleBody = $("article.article-body-wrapper, .article-list--description-container");
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
      $("p.body-paragraph, .description-text").each((_, p) => {
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
 * نقطة النهاية لجلب آخر الأخبار الرياضية
 * مثال:
 *   /le360_sport
 */
router.get("/le360_sport_marocco", async (req, res) => {
  try {
    const news = await fetchLatestSportNews();
    
    res.json({
      status: 200,
      success: true,
      total_news: news.length,
      source: "LE360 Sport Morocco",
      last_updated: new Date().toISOString(),
      news: news
    });
    
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء جلب الأخبار الرياضية.",
      error: err.message
    });
  }
});

/**
 * نقطة النهاية لجلب تفاصيل الخبر الرياضي
 * مثال:
 *   /le360_sport?url=https://ar.sport.le360.ma/football/lions-atlas/ESVSGH6KYRDWDN267CFTLJB4I4/
 */
router.get("/le360_sport_marocco/get_news", async (req, res) => {
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
  name: "LE360 Sport News marocco",
  type: "news",
  url: `${global.t}/api/news/le360_sport_marocco`,
  logo: "https://cdn-icons-png.flaticon.com/512/857/857418.png",
  description: "جلب آخر الأخبار الرياضية من موقع LE360 Sport المغربي",
  router
};