const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

const freeFireNews = {
  baseUrl: "https://freefirejornal.com",
  
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ar,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive'
  },

  translateText: async (text, targetLang = 'ar') => {
    if (!text || text.trim() === '') return text;
    
    try {
      const url = new URL("https://translate.googleapis.com/translate_a/single");
      url.searchParams.append("client", "gtx");
      url.searchParams.append("sl", "auto");
      url.searchParams.append("dt", "t");
      url.searchParams.append("tl", targetLang);
      url.searchParams.append("q", text);

      const response = await axios.get(url.href, { timeout: 15000 });
      const data = response.data;
      
      if (data && data[0]) {
        return data[0].map(item => item[0].trim()).join("\n");
      }
      return text;
    } catch (err) {
      return text;
    }
  },

  getNews: async (page = 1) => {
    if (page < 1) {
      return {
        status: false,
        code: 400,
        error: "رقم الصفحة يجب أن يكون 1 أو أكبر"
      };
    }

    try {
      let pageUrl = page === 1 ? freeFireNews.baseUrl : `${freeFireNews.baseUrl}/page/${page}/`;
      
      const response = await axios.get(pageUrl, {
        headers: freeFireNews.headers,
        timeout: 30000
      });

      if (response.status !== 200) {
        return {
          status: false,
          code: response.status,
          error: `فشل في جلب الأخبار`
        };
      }

      const $ = cheerio.load(response.data);
      const results = [];

      $('li.post-item').each((index, element) => {
        if (results.length >= 20) return false;
        
        const post = $(element);
        const result = {};

        const titleElem = post.find('h2.post-title').first();
        if (titleElem.length) {
          const linkElem = titleElem.find('a').first();
          if (linkElem.length) {
            result.originalTitle = titleElem.text().trim();
            result.link = linkElem.attr('href') || '';
          }
        }

        const categoryElem = post.find('span.post-cat').first();
        if (categoryElem.length) {
          result.originalCategory = categoryElem.text().trim();
        }

        const excerptElem = post.find('p.post-excerpt').first();
        if (excerptElem.length) {
          result.originalExcerpt = excerptElem.text().trim();
        }

        const dateElem = post.find('span.date').first();
        if (dateElem.length) {
          result.date = dateElem.text().trim();
        }

        const imageElem = post.find('img').first();
        if (imageElem.length) {
          result.image_url = imageElem.attr('src') || '';
        }

        if (result.originalTitle) {
          results.push(result);
        }
      });

      const translationPromises = results.map(async (result) => {
        try {
          const [titleAr, categoryAr, excerptAr] = await Promise.all([
            freeFireNews.translateText(result.originalTitle),
            freeFireNews.translateText(result.originalCategory || 'عام'),
            freeFireNews.translateText(result.originalExcerpt || 'لا يوجد وصف')
          ]);

          return {
            title: titleAr,
            category: categoryAr,
            excerpt: excerptAr,
            date: result.date,
            link: result.link,
            image_url: result.image_url
          };
        } catch (error) {
          return {
            title: result.originalTitle,
            category: result.originalCategory || 'عام',
            excerpt: result.originalExcerpt || 'لا يوجد وصف',
            date: result.date,
            link: result.link,
            image_url: result.image_url
          };
        }
      });

      const translatedResults = await Promise.all(translationPromises);

      return {
        status: true,
        code: 200,
        data: translatedResults
      };

    } catch (error) {
      return {
        status: false,
        code: 500,
        error: `حدث خطأ أثناء جلب الأخبار`
      };
    }
  }
};

router.get("/freefire_news/list", async (req, res) => {
  try {
    const result = await freeFireNews.getNews(1);

    if (!result.status) {
      return res.status(result.code).json({
        success: false,
        message: result.error
      });
    }

    const latestNews = result.data.slice(0, 10);

    res.json(latestNews);
    
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الأخبار"
    });
  }
});

router.get("/freefire_news", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  
  if (page < 1) {
    return res.status(400).json({
      success: false,
      message: "رقم الصفحة يجب أن يكون 1 أو أكبر"
    });
  }

  try {
    const result = await freeFireNews.getNews(page);

    if (!result.status) {
      return res.status(result.code).json({
        success: false,
        message: result.error
      });
    }

    res.json(result.data);
    
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الأخبار"
    });
  }
});

module.exports = {
  path: "/api/news",
  name: "roblox id info",
  type: "news",
  url: `${global.t}/api/news/freefire_news?page=1`,
  logo: "جلب اخبار فري فاير و الاحداث",
  description: "جلب اخبار و احداث فري فاير /freefire_news/list لجلب اخر الاخبار freefire_news?page= لجلب خبر من صفحه",
  router
};