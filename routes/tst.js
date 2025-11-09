// بسم الله الرحمن الرحيم ✨
// HappyMod Search Scraper API - النسخة المحسنة مع محاكاة المتصفح الكاملة
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
 * محاكاة عملية التحميل الكاملة مع تتبع التوجيهات
 */
async function simulateDownloadProcess(downloadUrl) {
  try {
    console.log(`🔍 بدء محاكاة التحميل من: ${downloadUrl}`);
    
    // إرسال الطلب الأول لبدء عملية التحميل
    const response = await axios.get(downloadUrl, {
      timeout: 30000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 12; SM-A217F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Accept-Language': 'ar-AE,ar;q=0.9,en-US;q=0.8,en;q=0.7',
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

    const $ = cheerio.load(response.data);
    let directLink = null;

    // 🔍 البحث في السكريبت عن عملية التحميل الحقيقية
    const scriptContents = $('script');
    
    for (let i = 0; i < scriptContents.length; i++) {
      const scriptContent = $(scriptContents[i]).html();
      if (scriptContent) {
        console.log(`🔍 البحث في السكريبت ${i + 1}...`);
        
        // البحث عن روابط happymod.cloud المباشرة مع /data1/apk_file/
        const happymodDirectMatch = scriptContent.match(/(https?:\/\/[a-zA-Z0-9-]+\.happymod\.cloud\/data1\/apk_file\/[a-zA-Z0-9]+\/[a-zA-Z0-9]+\/[a-zA-Z0-9]+\/[^"'\s]+\.apk)/g);
        if (happymodDirectMatch) {
          directLink = happymodDirectMatch[0];
          console.log(`✅ تم العثور على رابط مباشر: ${directLink}`);
          return directLink;
        }

        // البحث عن دوال JavaScript التي تقوم بالتوجيه بعد الانتظار
        const redirectPatterns = [
          /setTimeout\(function\(\)\s*\{[^}]*window\.location\.href\s*=\s*['"](https?:\/\/[^"']+\.happymod\.cloud[^"']*\.apk)['"][^}]*\},\s*(\d+)\)/,
          /setTimeout\([^,]+,\s*(\d+)\)[^;]*;?[^;]*window\.location\.href\s*=\s*['"](https?:\/\/[^"']+\.happymod\.cloud[^"']*\.apk)['"]/,
          /window\.location\.href\s*=\s*['"](https?:\/\/[^"']+\.happymod\.cloud[^"']*\.apk)['"]\s*;\s*\/\/\s*Count\s*down/,
          /var\s+downloadUrl\s*=\s*['"](https?:\/\/[^"']+\.happymod\.cloud[^"']*\.apk)['"]/
        ];

        for (const pattern of redirectPatterns) {
          const match = scriptContent.match(pattern);
          if (match && match[1]) {
            const waitTime = match[2] ? parseInt(match[2]) : 15000;
            console.log(`⏳ تم العثور على رابط مع وقت انتظار: ${waitTime}ms`);
            
            // الانتظار للمدة المحددة
            await wait(waitTime);
            
            directLink = match[1];
            console.log(`✅ تم العثور على رابط بعد الانتظار: ${directLink}`);
            return directLink;
          }
        }

        // البحث عن process.php الذي يقوم بالتوجيه
        const processPhpMatch = scriptContent.match(/(https?:\/\/[^"']+downloadatoz[^"']+hits_process\.php[^"']*)/);
        if (processPhpMatch) {
          console.log(`🔄 تم العثور على process.php، جاري تتبع التوجيه...`);
          const processUrl = processPhpMatch[1];
          
          // الانتظار 15 ثانية كما في المتصفح
          await wait(15000);
          
          // تتبع التوجيه من process.php
          try {
            const redirectResponse = await axios.get(processUrl, {
              timeout: 30000,
              maxRedirects: 10,
              validateStatus: null,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 12; SM-A217F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36',
                'Referer': downloadUrl
              }
            });

            // البحث عن رابط happymod.cloud في الاستجابة
            if (redirectResponse.data && typeof redirectResponse.data === 'string') {
              const happymodMatch = redirectResponse.data.match(/(https?:\/\/[a-zA-Z0-9-]+\.happymod\.cloud\/data1\/apk_file\/[^"'\s]+\.apk)/);
              if (happymodMatch) {
                directLink = happymodMatch[1];
                console.log(`✅ تم العثور على رابط عبر process.php: ${directLink}`);
                return directLink;
              }
            }

            // إذا كان هناك توجيه في الرأس
            if (redirectResponse.headers.location) {
              const location = redirectResponse.headers.location;
              if (location.includes('happymod.cloud') && location.includes('.apk')) {
                directLink = location;
                console.log(`✅ تم العثور على رابط في التوجيه: ${directLink}`);
                return directLink;
              }
            }
          } catch (error) {
            console.log('⚠️ خطأ في تتبع process.php:', error.message);
          }
        }
      }
    }

    // 🔍 إذا لم نجد في السكريبت، نبحث في meta refresh
    const metaRefresh = $('meta[http-equiv="refresh"]').attr('content');
    if (metaRefresh) {
      const urlMatch = metaRefresh.match(/url=(.+)/i);
      if (urlMatch && urlMatch[1]) {
        const redirectUrl = urlMatch[1].startsWith('http') ? urlMatch[1] : `https:${urlMatch[1]}`;
        console.log(`🔄 توجيه meta refresh إلى: ${redirectUrl}`);
        
        if (redirectUrl.includes('happymod.cloud') && redirectUrl.includes('.apk')) {
          return redirectUrl;
        } else {
          // تتبع التوجيه من meta refresh
          await wait(5000);
          const metaResponse = await axios.get(redirectUrl, {
            timeout: 30000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Linux; Android 12; SM-A217F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36',
              'Referer': downloadUrl
            }
          });
          
          if (metaResponse.headers.location && metaResponse.headers.location.includes('.apk')) {
            return metaResponse.headers.location;
          }
        }
      }
    }

    return directLink;

  } catch (error) {
    console.error('🚫 خطأ في محاكاة التحميل:', error.message);
    return null;
  }
}

/**
 * استخراج رابط التحميل المباشر - النسخة النهائية
 */
async function getDirectDownloadLink(downloadUrl) {
  // محاولة المحاكاة الكاملة أولاً
  let directLink = await simulateDownloadProcess(downloadUrl);
  
  // إذا فشلت المحاكاة، نستخدم الطريقة التقليدية مع الانتظار
  if (!directLink) {
    console.log('🔄 استخدام الطريقة التقليدية مع الانتظار...');
    await wait(15000);
    
    try {
      const response = await axios.get(downloadUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 12; SM-A217F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36',
          'Referer': downloadUrl
        }
      });

      const $ = cheerio.load(response.data);
      
      // البحث النهائي في كل المحتوى
      const pageContent = response.data;
      const finalMatch = pageContent.match(/(https?:\/\/[a-zA-Z0-9-]+\.happymod\.cloud\/data1\/apk_file\/[^"'\s]+\.apk)/);
      if (finalMatch) {
        directLink = finalMatch[1];
        console.log(`✅ تم العثور على رابط في المحاولة النهائية: ${directLink}`);
      }
    } catch (error) {
      console.error('🚫 خطأ في المحاولة النهائية:', error.message);
    }
  }

  return directLink;
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
 * نقطة النهاية للحصول على رابط التحميل المباشر - النسخة النهائية
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

    console.log(`🎯 جاري محاكاة عملية التحميل الكاملة: ${finalUrl}`);
    
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
      message: "✅ تم العثور على رابط التحميل المباشر الحقيقي"
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