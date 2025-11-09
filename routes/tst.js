// بسم الله الرحمن الرحيم ✨
// HappyMod Search Scraper API
// البحث عن التطبيقات في موقع happymod.cloud

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * البحث عن التطبيقات في HappyMod
 * @param {string} query - كلمة البحث
 * @returns {Promise<Array>}
 */
async function searchHappyMod(query) {
  const searchUrl = `https://ar.happymod.cloud/search.html?q=${encodeURIComponent(query)}`;
  const { data } = await axios.get(searchUrl);
  const $ = cheerio.load(data);
  const results = [];

  $(".list-item").each((index, element) => {
    const $item = $(element);
    const $link = $item.find(".list-box");
    
    const title = $item.find(".list-info-title").text().trim();
    const version = $item.find(".list-info-text:first-child span:first-child").text().trim();
    const size = $item.find(".list-info-text:first-child span:last-child").text().trim();
    const modFeatures = $item.find(".list-info-text:last-child span").text().trim();
    const icon = $item.find(".list-icon img").attr("data-src") || $item.find(".list-icon img").attr("src");
    const appUrl = $link.attr("href");
    
    if (title) {
      results.push({
        title,
        version: version || "غير معروف",
        size: size || "غير معروف",
        modFeatures: modFeatures || "لا توجد تعديلات محددة",
        icon: icon ? (icon.startsWith("http") ? icon : `https://ar.happymod.cloud${icon}`) : null,
        url: appUrl ? `https://ar.happymod.cloud${appUrl}` : null,
        index: index + 1
      });
    }
  });

  return results;
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/happymod/search?q=minecraft
 */
router.get("/happymod/search", async (req, res) => {
  const query = req.query.q;
  
  if (!query) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال كلمة البحث"
    });
  }

  try {
    const results = await searchHappyMod(query);
    
    if (results.length === 0) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: `🚫 لم يتم العثور على نتائج لـ "${query}"`
      });
    }

    res.json({
      status: 200,
      success: true,
      query: query,
      totalResults: results.length,
      results: results
    });
    
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء البحث في HappyMod",
      error: err.message
    });
  }
});

/**
 * نقطة النهاية للحصول على تفاصيل التطبيق
 * مثال:
 *   /api/happymod/app?url=/minecraft-pocket-edition-apps-502-10/com.mojang.minecraftpe/
 */
router.get("/happymod/app", async (req, res) => {
  const appUrl = req.query.url;
  
  if (!appUrl) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال رابط التطبيق"
    });
  }

  try {
    const fullUrl = appUrl.startsWith("http") ? appUrl : `https://ar.happymod.cloud${appUrl}`;
    const { data } = await axios.get(fullUrl);
    const $ = cheerio.load(data);

    const appDetails = {
      title: $("h1").first().text().trim() || "غير معروف",
      description: $('meta[name="description"]').attr("content") || "لا يوجد وصف",
      downloadLinks: []
    };

    // استخراج روابط التحميل (يمكن تعديل هذا الجزء حسب هيكل الصفحة)
    $("a[href*='download']").each((index, element) => {
      const link = $(element).attr("href");
      const text = $(element).text().trim();
      if (link && text) {
        appDetails.downloadLinks.push({
          text: text,
          url: link.startsWith("http") ? link : `https://ar.happymod.cloud${link}`
        });
      }
    });

    res.json({
      status: 200,
      success: true,
      app: appDetails
    });
    
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء جلب تفاصيل التطبيق",
      error: err.message
    });
  }
});

module.exports = {
  path: "/api/search",
  name: "happymod search",
  type: "search",
  url: `${global.t}/api/search/happymod/search?q=minecraft`,
  logo: "https://ar.happymod.cloud/static/img/logo.webp",
  description: "البحث عن التطبيقات المعدلة في موقع HappyMod",
  router
};