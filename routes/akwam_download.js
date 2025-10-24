const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * استخراج رابط الفيديو النهائي من صفحة أكوام
 * @param {string} url - رابط الصفحة الأصلية
 * @returns {Promise<string|null>}
 */
async function extractVideoLink(url) {
  const headers = { 
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "ar,en-US;q=0.7,en;q=0.3",
    "Referer": "https://ak.sv/",
    "Connection": "keep-alive"
  };

  try {
    // الخطوة 1: جلب الصفحة الأصلية
    const page1 = await axios.get(url, { headers, timeout: 20000 });
    const $ = cheerio.load(page1.data);

    // البحث عن رابط التحميل الأول
    let downloadPage = $("a.download-link").first().attr("href") ||
                       $('a.link-download').first().attr("href") ||
                       $('a:contains("تحميل")').first().attr("href") ||
                       $('a:contains("اضغط هنا")').first().attr("href") ||
                       $('a:contains("Click here")').first().attr("href");

    console.log("رابط التحميل الأول:", downloadPage);

    if (!downloadPage) {
      console.log("لم يتم العثور على رابط التحميل في الصفحة الأولى");
      return null;
    }

    // التأكد من أن الرابط مطلق
    try {
      downloadPage = new URL(downloadPage, page1.request.res.responseUrl || url).toString();
    } catch (err) {
      console.log("خطأ في تحويل الرابط:", err.message);
    }

    // الخطوة 2: جلب صفحة التحميل الثانية
    const page2 = await axios.get(downloadPage, { headers, timeout: 20000 });
    const $$ = cheerio.load(page2.data);

    console.log("تم جلب صفحة التحميل الثانية بنجاح");

    // البحث عن رابط التحميل النهائي
    let videoLink = null;

    // الطريقة 1: البحث في روابط التحميل المباشرة
    $$("a").each((_, el) => {
      const href = $$(el).attr("href");
      if (href && href.includes("downet.net") && href.endsWith(".mp4")) {
        videoLink = href;
        console.log("تم العثور على الرابط عبر downet.net:", videoLink);
        return false; // إيقاف التكرار
      }
    });

    // الطريقة 2: إذا لم يتم العثور، البحث في جميع الروابط التي تحتوي على mp4
    if (!videoLink) {
      $$("a").each((_, el) => {
        const href = $$(el).attr("href");
        if (href && href.endsWith(".mp4")) {
          videoLink = href;
          console.log("تم العثور على الرابط عبر mp4:", videoLink);
          return false;
        }
      });
    }

    // الطريقة 3: البحث باستخدام regex في كود HTML
    if (!videoLink) {
      const regex = /(https?:\/\/s\d+\.downet\.net\/download\/[A-Za-z0-9\/._%-]+\.mp4)/g;
      const matches = page2.data.match(regex);
      if (matches && matches.length > 0) {
        videoLink = matches[0];
        console.log("تم العثور على الرابط عبر regex:", videoLink);
      }
    }

    // الطريقة 4: البحث في الأزرار والروابط التي تحتوي على كلمة "تحميل"
    if (!videoLink) {
      $$('a[href*=".mp4"], a[download], .btn-loader a, .download-link').each((_, el) => {
        const href = $$(el).attr("href");
        if (href && href.includes(".mp4")) {
          videoLink = href;
          console.log("تم العثور على الرابط عبر عناصر التحميل:", videoLink);
          return false;
        }
      });
    }

    // التأكد من أن الرابط مطلق
    if (videoLink && !videoLink.startsWith('http')) {
      try {
        videoLink = new URL(videoLink, page2.request.res.responseUrl || downloadPage).toString();
      } catch (err) {
        console.log("خطأ في تحويل الرابط النهائي:", err.message);
      }
    }

    return videoLink || null;

  } catch (err) {
    console.error("خطأ في استخراج الرابط:", err.message);
    throw new Error(`فشل في استخراج الرابط: ${err.message}`);
  }
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/search/link?url=https://ak.sv/episode/12345
 */
router.get("/akwam_link", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "❌ يرجى إرسال رابط الصفحة عبر ?url="
    });
  }

  // التحقق من أن الرابط صالح
  if (!url.includes("ak.sv") && !url.includes("akwam")) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "❌ الرابط غير صالح، يجب أن يكون من موقع أكوام"
    });
  }

  try {
    console.log("بدء استخراج الرابط من:", url);
    const videoLink = await extractVideoLink(url);

    if (!videoLink) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "❌ لم يتم العثور على رابط الفيديو في صفحة التحميل."
      });
    }

    res.status(200).json({
      status: 200,
      success: true,
      source: url,
      videoLink: videoLink
    });

  } catch (err) {
    console.error("خطأ في API:", err.message);
    res.status(500).json({
      status: 500,
      success: false,
      message: "⚠️ حدث خطأ أثناء استخراج الرابط.",
      error: err.message
    });
  }
});

// نقطة نهاية للتحقق من صحة السكريبت
router.get("/test", async (req, res) => {
  res.json({
    status: 200,
    message: "السكريبت يعمل بشكل صحيح",
    timestamp: new Date().toISOString()
  });
});

module.exports = {
  path: "/api/download",
  name: "akwam download link",
  type: "download",
  url: `${global.t}/api/download/akwam_link?url=https://ak.sv/episode/12345`,
  logo: "",
  description: "استخراج رابط الفيديو النهائي من صفحة أكوام",
  router
