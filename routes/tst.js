// بسم الله الرحمن الرحيم ✨
// Facebook Downloader API
// API لتحميل فيديوهات فيسبوك

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const qs = require("qs");

const router = express.Router();

/**
 * تحميل فيديو من فيسبوك
 * @param {string} url - رابط الفيديو
 * @returns {Promise<object>}
 */
async function fbDownloader(url) {
  // تعديل الرابط إذا كان يحتوي على /r/ ليصبح /v/
  if (url.includes('/share/r/')) {
    url = url.replace('/share/r/', '/share/v/');
  }

  if (
    !/^https:\/\/www\.facebook\.com\/(reel|share\/v|watch)/.test(url) &&
    !/^https:\/\/fb\.watch\//.test(url)
  ) {
    throw new Error('رابط فيسبوك غير صالح');
  }

  const verifyPayload = qs.stringify({ url });
  const verifyRes = await axios.post('https://fdownloader.net/api/userverify', verifyPayload, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Accept': '/',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });

  const cftoken = verifyRes.data?.token;
  if (!cftoken) throw new Error('فشل في الحصول على التوكن');

  const ajaxPayload = qs.stringify({
    k_exp: Math.floor(Date.now() / 1000) + 1800,
    k_token: '4901a847f621da898b5429bf38df6f3a0959738cd4eb52a2bf0cf44b3eb44cad',
    q: url,
    lang: 'id',
    web: 'fdownloader.net',
    v: 'v2',
    w: '',
    cftoken
  });

  const ajaxRes = await axios.post('https://v3.fdownloader.net/api/ajaxSearch', ajaxPayload, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Accept': '/'
    }
  });

  const { status, data: html } = ajaxRes.data;
  if (status !== 'ok' || !html) throw new Error('فشل في جلب البيانات');

  const $ = cheerio.load(html);
  const thumbnail = $('.image-fb img').attr('src') || '';
  const duration = $('.content p').text().trim();
  const title = $('.content h3').text().trim();

  const links = [];
  $('a.download-link-fb').each((_, el) => {
    const link = $(el).attr('href');
    const quality = $(el).attr('title')?.replace('Download ', '') || 'غير معروف';
    const format = link?.includes('.mp4') ? 'mp4' : 'غير معروف';
    if (link) links.push({ quality: quality, format: format, url: link });
  });

  return {
    status: true,
    title: title,
    duration: duration,
    thumbnail: thumbnail,
    links: links
  };
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/download/facebook?url=https://www.facebook.com/share/v/17VdF8kuf5/
 */
router.get("/facebook", async (req, res) => {
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى تقديم رابط فيديو فيسبوك"
    });
  }

  if (
    !url.match(/^https:\/\/www\.facebook\.com\/(reel|share\/v|watch)/) &&
    !url.match(/^https:\/\/fb\.watch\//)
  ) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "❌ هذا ليس رابط فيسبوك صالح"
    });
  }

  try {
    const result = await fbDownloader(url);
    
    if (!result.status || !result.links || result.links.length === 0) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "🚫 لم يتم العثور على روابط تحميل في هذا الرابط"
      });
    }

    res.json({
      status: 200,
      success: true,
      data: {
        original_url: url,
        modified_url: url.includes('/share/r/') ? url.replace('/share/r/', '/share/v/') : url,
        title: result.title,
        duration: result.duration,
        thumbnail: result.thumbnail,
        total_links: result.links.length,
        download_links: result.links
      }
    });
    
  } catch (err) {
    let errorMessage = "حدث خطأ أثناء تحميل الفيديو";
    
    if (err.message.includes('رابط فيسبوك غير صالح')) {
      errorMessage = "الرابط غير صالح. تأكد أنه يبدأ بـ:\nhttps://www.facebook.com/reel/\nأو\nhttps://www.facebook.com/share/v/\nأو\nhttps://fb.watch/";
    } else if (err.message.includes('فشل في الحصول على التوكن')) {
      errorMessage = "فشل في التحقق من الرابط. حاول مرة أخرى بعد قليل";
    } else if (err.message.includes('فشل في جلب البيانات')) {
      errorMessage = "تعذر جلب البيانات. تأكد أن الفيديو لا يزال موجودًا";
    }

    res.status(500).json({
      status: 500,
      success: false,
      message: errorMessage,
      error: err.message
    });
  }
});

module.exports = {
  path: "/api/download",
  name: "facebook downloader",
  type: "downloader",
  url: `${global.t}/api/download/facebook?url=https://www.facebook.com/share/v/17VdF8kuf5/`,
  logo: "",
  description: "تحميل فيديوهات فيسبوك عبر الرابط",
  router
};