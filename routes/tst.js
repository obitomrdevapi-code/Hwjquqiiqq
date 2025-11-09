// بسم الله الرحمن الرحيم ✨
// HappyMod Search Scraper API - النسخة المحسنة مع الانتظار
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
      const modifiedLink = link.replace("download.html", "downloading.html");
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
        modifiedUrl = `https://ar.happymod.cloud${basePath}/downloading.html`;
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
        modifiedLink = link.replace("download.html", "downloading.html");
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
 * الانتظار لمدة محددة
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * استخراج رابط التحميل المباشر مع الانتظار والمحاكاة الكاملة
 */
async function getDirectDownloadLink(downloadUrl) {
  try {
    console.log(`🔍 بدء جلب الرابط من: ${downloadUrl}`);
    
    // إرسال طلب GET الأول لتحفيز عملية التحميل
    const { data: initialData } = await axios.get(downloadUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 12; SM-A217F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Accept-Language': 'ar-AE,ar;q=0.9,fr-MA;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
        'Referer': downloadUrl.replace('downloading.html', 'download.html'),
        'Sec-Ch-Ua': '"Chromium";v="107", "Not=A?Brand";v="24"',
        'Sec-Ch-Ua-Mobile': '?1',
        'Sec-Ch-Ua-Platform': '"Android"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    const $ = cheerio.load(initialData);
    let directLink = null;

    // 🔍 البحث عن رابط happymod.cloud المباشر في السكريبت
    const scriptContents = $('script');
    for (let i = 0; i < scriptContents.length; i++) {
      const scriptContent = $(scriptContents[i]).html();
      if (scriptContent) {
        // البحث عن روابط happymod.cloud التي تحتوي على /data1/apk_file/
        const happymodLinkMatch = scriptContent.match(/(https?:\/\/[^"\']*happymod\.cloud[^"\']*\/data1\/apk_file[^"\']*\.apk[^"\']*)/);
        if (happymodLinkMatch && happymodLinkMatch[1]) {
          directLink = happymodLinkMatch[1];
          console.log(`✅ تم العثور على رابط happymod.cloud مباشر: ${directLink}`);
          break;
        }

        // البحث عن روابط في دوال JavaScript
        const jsLinkMatch = scriptContent.match(/window\.location\.href\s*=\s*['"](https?:\/\/[^"']*happymod\.cloud[^"']*\.apk)['"]/);
        if (jsLinkMatch && jsLinkMatch[1]) {
          directLink = jsLinkMatch[1];
          console.log(`✅ تم العثور على رابط في window.location: ${directLink}`);
          break;
        }

        // البحث عن روابط في setTimeout أو دوال التأخير
        const timeoutLinkMatch = scriptContent.match(/setTimeout\([^,]+,\s*(\d+)\).*?window\.location\.href\s*=\s*['"](https?:\/\/[^"']*happymod\.cloud[^"']*\.apk)['"]/);
        if (timeoutLinkMatch && timeoutLinkMatch[2]) {
          directLink = timeoutLinkMatch[2];
          console.log(`✅ تم العثور على رابط في setTimeout: ${directLink}`);
          break;
        }
      }
    }

    // إذا لم نجد الرابط مباشرة، ننتظر ونحاول مرة أخرى
    if (!directLink) {
      console.log('⏳ لم يتم العثور على الرابط مباشرة، جاري الانتظار وإعادة المحاولة...');
      
      // الانتظار 15 ثانية كما طلبت
      await wait(15000);

      // إرسال طلب ثانٍ بعد الانتظار
      console.log('🔄 إرسال طلب ثان بعد الانتظار...');
      const { data: secondData } = await axios.get(downloadUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 12; SM-A217F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
          'Referer': downloadUrl,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      const $$ = cheerio.load(secondData);

      // البحث مرة أخرى في السكريبت بعد الانتظار
      const secondScriptContents = $$('script');
      for (let i = 0; i < secondScriptContents.length; i++) {
        const scriptContent = $$(secondScriptContents[i]).html();
        if (scriptContent) {
          // البحث عن روابط happymod.cloud المباشرة
          const happymodLinkMatch = scriptContent.match(/(https?:\/\/[^"\']*happymod\.cloud[^"\']*\/data1\/apk_file[^"\']*\.apk[^"\']*)/);
          if (happymodLinkMatch && happymodLinkMatch[1]) {
            directLink = happymodLinkMatch[1];
            console.log(`✅ تم العثور على رابط بعد الانتظار: ${directLink}`);
            break;
          }

          // البحث في meta refresh
          const metaRefresh = $$('meta[http-equiv="refresh"]').attr('content');
          if (metaRefresh) {
            const urlMatch = metaRefresh.match(/url=(.+)/i);
            if (urlMatch && urlMatch[1] && urlMatch[1].includes('happymod.cloud') && urlMatch[1].includes('.apk')) {
              directLink = urlMatch[1];
              console.log(`✅ تم العثور على رابط في meta refresh: ${directLink}`);
              break;
            }
          }
        }
      }
    }

    // إذا لم نجد الرابط بعد كل هذا، نستخدم الطريقة القديمة كبديل
    if (!directLink) {
      console.log('🔄 استخدام الطريقة البديلة...');
      
      // البحث عن apk_hits و apk_url_id
      const scriptContents = $('script');
      let apkHits = null;
      let apkUrlId = null;
      
      for (let i = 0; i < scriptContents.length; i++) {
        const scriptContent = $(scriptContents[i]).html();
        if (scriptContent) {
          const apkHitsMatch = scriptContent.match(/var\s+apk_hits\s*=\s*"([^"]+)"/);
          if (apkHitsMatch && apkHitsMatch[1]) {
            apkHits = apkHitsMatch[1];
          }
          
          const apkUrlIdMatch = scriptContent.match(/var\s+apk_url_id\s*=\s*"([^"]+)"/);
          if (apkUrlIdMatch && apkUrlIdMatch[1]) {
            apkUrlId = apkUrlIdMatch[1];
          }
        }
      }

      if (apkHits && apkUrlId) {
        const cleanApkHits = apkHits.replace(/\/$/, '');
        directLink = `${cleanApkHits}?id=${apkUrlId}&hl=happymoddl_mod`;
        console.log(`✅ تم بناء الرابط من apk_hits: ${directLink}`);
      }
    }

    return directLink;

  } catch (error) {
    console.error('🚫 خطأ في جلب رابط التحميل المباشر:', error.message);
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
 * نقطة النهاية للحصول على رابط التحميل المباشر مع الانتظار
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
    
    // استخدام downloading.html
    if (!downloadUrl.includes("downloading.html") && !downloadUrl.includes("download.html")) {
      const basePath = downloadUrl.replace(/\/$/, '');
      finalUrl = `${basePath}/downloading.html`;
    } else if (downloadUrl.includes("download.html")) {
      finalUrl = downloadUrl.replace("download.html", "downloading.html");
    }

    console.log(`🎯 جاري جلب الرابط المباشر مع الانتظار: ${finalUrl}`);
    
    const directLink = await getDirectDownloadLink(finalUrl);

    if (!directLink) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "🚫 لم يتم العثور على رابط تحميل مباشر بعد الانتظار"
      });
    }

    res.json({
      status: 200,
      success: true,
      downloadPage: finalUrl,
      directDownloadLink: directLink,
      message: "✅ تم العثور على رابط التحميل المباشر بعد الانتظار"
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