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
    
    // استخراج الإصدار والحجم بشكل صحيح من العناصر المنفصلة
    const versionElement = $item.find(".list-info-text:first-child span:first-child");
    const sizeElement = $item.find(".list-info-text:first-child span:last-child");
    
    const version = versionElement.text().trim() || "غير معروف";
    const size = sizeElement.text().trim() || "غير معروف";
    
    const modFeatures = $item.find(".list-info-text:last-child span").text().trim();
    const icon = $item.find(".list-icon img").attr("data-src") || $item.find(".list-icon img").attr("src");
    const appUrl = $link.attr("href");
    
    if (title) {
      results.push({
        title,
        version: version,
        size: size,
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
 * استخراج تفاصيل التطبيق
 * @param {string} appUrl - رابط التطبيق
 * @returns {Promise<object>}
 */
async function fetchAppDetails(appUrl) {
  const fullUrl = appUrl.startsWith("http") ? appUrl : `https://ar.happymod.cloud${appUrl}`;
  const { data } = await axios.get(fullUrl);
  const $ = cheerio.load(data);

  const appDetails = {
    title: $("h1").first().text().trim() || "غير معروف",
    description: $('meta[name="description"]').attr("content") || "لا يوجد وصف",
    category: "",
    latestVersion: "",
    updatedAt: "",
    developer: "",
    androidRequires: "",
    rating: "",
    fileSize: "",
    modFeatures: "",
    downloadLinks: [],
    versions: [],
    additionalInfo: {}
  };

  // استخراج المعلومات الإضافية
  $(".additional-list dt").each((index, element) => {
    const key = $(element).text().replace("：", "").trim();
    const value = $(element).next(".additional-info").text().trim();
    
    switch(key) {
      case "فئة":
        appDetails.category = value;
        break;
      case "أحدث إصدار":
        appDetails.latestVersion = value;
        break;
      case "تم التحديث في":
        appDetails.updatedAt = value;
        break;
      case "تم الرفع بواسطة":
        appDetails.developer = value;
        break;
      case "يتطلب Android":
        appDetails.androidRequires = value;
        break;
    }
  });

  // استخراج حجم الملف من زر التحميل
  const downloadBtnText = $(".download-btn").text().trim();
  if (downloadBtnText) {
    const sizeMatch = downloadBtnText.match(/\(([^)]+)\)/);
    if (sizeMatch) {
      appDetails.fileSize = sizeMatch[1];
    }
  }

  // استخراج ميزات التعديل
  const modInfo = $(".info-box .info-desc").text().trim();
  if (modInfo) {
    appDetails.modFeatures = modInfo;
  }

  // استخراج التقييم
  const rating = $(".cmt-rating-score").text().trim();
  if (rating) {
    appDetails.rating = rating;
  }

  // استخراج روابط التحميل الرئيسية مع تعديل الرابط
  $("a.download-btn").each((index, element) => {
    const link = $(element).attr("href");
    const text = $(element).text().trim();
    if (link && text && link.includes("download.html")) {
      // تعديل الرابط كما طلبت
      const modifiedLink = link.replace("download.html", "original-downloading.html");
      appDetails.downloadLinks.push({
        text: text,
        url: link.startsWith("http") ? modifiedLink : `https://ar.happymod.cloud${modifiedLink}`,
        type: "main"
      });
    }
  });

  // استخراج الإصدارات القديمة مع تعديل الروابط
  $(".version-item").each((index, element) => {
    const $version = $(element);
    const title = $version.find(".version-title").text().trim();
    const version = $version.find(".version-version").text().trim();
    const size = $version.find(".size").text().trim();
    const date = $version.find(".version-data").text().trim();
    const url = $version.attr("href");

    if (title && version) {
      // تعديل رابط الإصدار لاستخدام original-downloading.html
      let modifiedUrl = null;
      if (url) {
        // استخراج المسار الأساسي من الرابط
        const basePath = url.split('/').slice(0, -1).join('/');
        const appId = url.split('/').filter(Boolean).slice(-2, -1)[0];
        modifiedUrl = `https://ar.happymod.cloud${basePath}/original-downloading.html`;
      }

      appDetails.versions.push({
        title,
        version,
        size,
        date,
        url: modifiedUrl,
        originalUrl: url ? `https://ar.happymod.cloud${url}` : null
      });
    }
  });

  // استخراج روابط التحميل الإضافية مع تعديل الروابط
  $("a[href*='download']").each((index, element) => {
    const link = $(element).attr("href");
    const text = $(element).text().trim().replace(/\s+/g, " ");
    
    if (link && text && !link.includes("guides") && text.includes("تحميل")) {
      // تنظيف النص من التواريخ والمعلومات الزائدة
      const cleanText = text.split('\n')[0].trim();
      
      // تعديل الرابط لاستخدام original-downloading.html
      let modifiedLink = link;
      if (link.includes("download.html")) {
        modifiedLink = link.replace("download.html", "original-downloading.html");
      }

      appDetails.downloadLinks.push({
        text: cleanText,
        url: link.startsWith("http") ? modifiedLink : `https://ar.happymod.cloud${modifiedLink}`,
        type: "additional"
      });
    }
  });

  return appDetails;
}

/**
 * استخراج رابط التحميل المباشر من صفحة original-downloading.html
 * @param {string} downloadUrl - رابط صفحة التحميل
 * @returns {Promise<string>}
 */
async function getDirectDownloadLink(downloadUrl) {
  try {
    const { data } = await axios.get(downloadUrl);
    const $ = cheerio.load(data);

    // البحث عن رابط التحميل المباشر في السكريبت
    let directLink = null;

    // الطريقة الأولى: البحث في السكريبت عن dlink
    const scriptContent = $('script').html();
    if (scriptContent) {
      const dlinkMatch = scriptContent.match(/var dlink="([^"]+)"/);
      if (dlinkMatch && dlinkMatch[1]) {
        directLink = dlinkMatch[1];
      }
    }

    // الطريقة الثانية: البحث عن apk_hits وبناء الرابط
    if (!directLink) {
      const apkUrlIdMatch = scriptContent.match(/var apk_url_id="([^"]+)"/);
      if (apkUrlIdMatch && apkUrlIdMatch[1]) {
        const appId = apkUrlIdMatch[1];
        directLink = `http://topdata.downloadatoz.com/caicai_android_data_hits/proc/hits_process.php?id=${appId}&hl=happymoddl_mod`;
      }
    }

    // الطريقة الثالثة: البحث عن روابط التحميل في الصفحة
    if (!directLink) {
      $('a[href*="download"]').each((index, element) => {
        const href = $(element).attr('href');
        if (href && (href.includes('.apk') || href.includes('downloadatoz'))) {
          directLink = href.startsWith('http') ? href : `https://ar.happymod.cloud${href}`;
          return false; // break the loop
        }
      });
    }

    return directLink;

  } catch (error) {
    console.error('Error fetching direct download link:', error);
    return null;
  }
}

/**
 * نقطة النهاية الرئيسية للبحث
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
    const appDetails = await fetchAppDetails(appUrl);

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

/**
 * نقطة النهاية للحصول على رابط التحميل المباشر
 * مثال:
 *   /api/happymod/app_get?url=/minecraft-original/com.minecraftpe.minecraft.original.free/original-downloading.html
 */
router.get("/happymod/app_get", async (req, res) => {
  const downloadUrl = req.query.url;
  
  if (!downloadUrl) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال رابط صفحة التحميل"
    });
  }

  try {
    // التأكد من أن الرابط يحتوي على original-downloading.html
    let finalUrl = downloadUrl;
    if (!downloadUrl.includes("original-downloading.html")) {
      // إذا كان الرابط الأساسي للتطبيق، نحوله إلى صفحة التحميل
      const basePath = downloadUrl.replace(/\/$/, '');
      finalUrl = `${basePath}/original-downloading.html`;
    }

    const directLink = await getDirectDownloadLink(finalUrl);

    if (!directLink) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "🚫 لم يتم العثور على رابط تحميل مباشر"
      });
    }

    res.json({
      status: 200,
      success: true,
      downloadPage: finalUrl,
      directDownloadLink: directLink,
      message: "✅ تم العثور على رابط التحميل المباشر"
    });
    
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء جلب رابط التحميل المباشر",
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