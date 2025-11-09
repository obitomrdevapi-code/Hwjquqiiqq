// بسم الله الرحمن الرحيم ✨
// HappyMod Search Scraper API - النسخة المحسنة
// البحث عن التطبيقات في موقع happymod.cloud

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * البحث عن التطبيقات في HappyMod
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

  const downloadBtnText = $(".download-btn").text().trim();
  if (downloadBtnText) {
    const sizeMatch = downloadBtnText.match(/\(([^)]+)\)/);
    if (sizeMatch) {
      appDetails.fileSize = sizeMatch[1];
    }
  }

  const modInfo = $(".info-box .info-desc").text().trim();
  if (modInfo) {
    appDetails.modFeatures = modInfo;
  }

  const rating = $(".cmt-rating-score").text().trim();
  if (rating) {
    appDetails.rating = rating;
  }

  $("a.download-btn").each((index, element) => {
    const link = $(element).attr("href");
    const text = $(element).text().trim();
    if (link && text && link.includes("download.html")) {
      const modifiedLink = link.replace("download.html", "original-downloading.html");
      appDetails.downloadLinks.push({
        text: text,
        url: link.startsWith("http") ? modifiedLink : `https://ar.happymod.cloud${modifiedLink}`,
        type: "main"
      });
    }
  });

  $(".version-item").each((index, element) => {
    const $version = $(element);
    const title = $version.find(".version-title").text().trim();
    const version = $version.find(".version-version").text().trim();
    const size = $version.find(".size").text().trim();
    const date = $version.find(".version-data").text().trim();
    const url = $version.attr("href");

    if (title && version) {
      let modifiedUrl = null;
      if (url) {
        const basePath = url.split('/').slice(0, -1).join('/');
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

  $("a[href*='download']").each((index, element) => {
    const link = $(element).attr("href");
    const text = $(element).text().trim().replace(/\s+/g, " ");
    
    if (link && text && !link.includes("guides") && text.includes("تحميل")) {
      const cleanText = text.split('\n')[0].trim();
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
 * استخراج رابط التحميل المباشر من صفحة original-downloading.html - التركيز على apk_hits
 */
async function getDirectDownloadLink(downloadUrl) {
  try {
    const { data } = await axios.get(downloadUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    let directLink = null;

    // 🔍 الطريقة الأولى: البحث عن apk_hits و apk_url_id وبناء الرابط المطلوب
    const scriptContents = $('script');
    let apkHits = null;
    let apkUrlId = null;
    
    for (let i = 0; i < scriptContents.length; i++) {
      const scriptContent = $(scriptContents[i]).html();
      if (scriptContent) {
        // البحث عن apk_hits
        const apkHitsMatch = scriptContent.match(/var\s+apk_hits\s*=\s*"([^"]+)"/);
        if (apkHitsMatch && apkHitsMatch[1]) {
          apkHits = apkHitsMatch[1];
        }
        
        // البحث عن apk_url_id
        const apkUrlIdMatch = scriptContent.match(/var\s+apk_url_id\s*=\s*"([^"]+)"/);
        if (apkUrlIdMatch && apkUrlIdMatch[1]) {
          apkUrlId = apkUrlIdMatch[1];
        }
      }
    }

    // بناء الرابط المطلوب إذا وجدنا المتغيرات
    if (apkHits && apkUrlId) {
      const cleanApkHits = apkHits.replace(/\/$/, '');
      directLink = `${cleanApkHits}?id=${apkUrlId}&hl=happymoddl_mod`;
    }

    // 🔍 الطريقة الثانية: إذا لم نجد apk_hits، نبحث عن dlink كبديل
    if (!directLink) {
      for (let i = 0; i < scriptContents.length; i++) {
        const scriptContent = $(scriptContents[i]).html();
        if (scriptContent) {
          const dlinkMatch = scriptContent.match(/var\s+dlink\s*=\s*"([^"]+)"/);
          if (dlinkMatch && dlinkMatch[1]) {
            directLink = dlinkMatch[1];
            break;
          }
        }
      }
    }

    // 🔍 الطريقة الثالثة: البحث عن روابط downloadatoz مباشرة
    if (!directLink) {
      $('a[href*="downloadatoz"], a[href*="hits_process"]').each((index, element) => {
        if (directLink) return false;
        
        const href = $(element).attr('href');
        if (href && href.includes('downloadatoz')) {
          directLink = href.startsWith('http') ? href : `https://ar.happymod.cloud${href}`;
          return false;
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
 * نقطة النهاية للبحث
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
 * نقطة النهاية لتفاصيل التطبيق
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
 * نقطة النهاية للحصول على رابط التحميل المباشر - التركيز على apk_hits
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
    let finalUrl = downloadUrl;
    
    if (!downloadUrl.includes("original-downloading.html") && !downloadUrl.includes("download.html")) {
      const basePath = downloadUrl.replace(/\/$/, '');
      finalUrl = `${basePath}/original-downloading.html`;
    } else if (downloadUrl.includes("download.html")) {
      finalUrl = downloadUrl.replace("download.html", "original-downloading.html");
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