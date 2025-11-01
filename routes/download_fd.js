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
    throw new Error('Invalid Facebook URL');
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
  if (!cftoken) throw new Error('Failed to get token');

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
  if (status !== 'ok' || !html) throw new Error('Failed to fetch data');

  const $ = cheerio.load(html);
  const thumbnail = $('.image-fb img').attr('src') || '';
  const duration = $('.content p').text().trim();
  const title = $('.content h3').text().trim();

  const links = [];
  $('a.download-link-fb').each((_, el) => {
    const link = $(el).attr('href');
    const quality = $(el).attr('title')?.replace('Download ', '') || 'Unknown';
    const format = link?.includes('.mp4') ? 'mp4' : 'Unknown';
    if (link) links.push({ quality, format, url: link });
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
      message: "المرجو تقديم رابط الفيديو
    });
  }

  if (
    !url.match(/^https:\/\/www\.facebook\.com\/(reel|share\/v|watch)/) &&
    !url.match(/^https:\/\/fb\.watch\//)
  ) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "المرجو تقديم رابط الفيديو"
    });
  }

  try {
    const result = await fbDownloader(url);
    
    if (!result.status || !result.links || result.links.length === 0) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "الرابط غير صالح"
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
    let errorMessage = "Error while downloading video";
    
    if (err.message.includes('Invalid Facebook URL')) {
      errorMessage = "Invalid URL. Make sure it starts with:\nhttps://www.facebook.com/reel/\nor\nhttps://www.facebook.com/share/v/\nor\nhttps://fb.watch/";
    } else if (err.message.includes('Failed to get token')) {
      errorMessage = "Failed to verify URL. Try again later";
    } else if (err.message.includes('Failed to fetch data')) {
      errorMessage = "Failed to fetch data. Make sure the video still exists";
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
  url: `${global.t}/api/download/facebook?url=https://www.facebook.com/reel/829413646209637/?mibextid=Nif5oz`,
  logo: "",
  description: "تحميل الفيديوهات من فيسبوك",
  router
};