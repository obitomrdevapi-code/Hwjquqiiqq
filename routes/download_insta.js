// بسم الله الرحمن الرحيم ✨
// Instagram Downloader API
// API لتحميل منشورات انستغرام

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * جلب محتوى انستغرام من الموقع
 * @param {string} url - رابط المنشور
 * @returns {Promise<object>}
 */
async function fetchInstagramContent(url) {
  const apiUrl = `https://insta-save.net/content.php?url=${encodeURIComponent(url)}`;
  
  const { data } = await axios.get(apiUrl, {
    headers: {
      "accept": "*/*",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    },
  });

  return data;
}

/**
 * استخراج البيانات من HTML
 * @param {string} html - كود HTML
 * @returns {array}
 */
function extractContent(html) {
  const $ = cheerio.load(html);
  const results = [];

  $("#download_content .col-md-4.position-relative").each((index, element) => {
    const el = $(element);
    
    const downloadLink = el.find("a.btn.bg-gradient-success").attr("href") || "";
    const imgSrc = el.find("img.load").attr("src") || el.find("img").attr("src") || "";
    const description = el.find("p.text-sm").text().trim() || "لا يوجد وصف";
    const profileName = el.find("p.text-sm a").text().trim() || "غير معروف";
    const stats = el.find(".stats small").toArray().map((s) => $(s).text().trim());
    const likes = stats[0] || "0";
    const comments = stats[1] || "0";

    if (downloadLink) {
      results.push({
        link_downlod: downloadLink,
        link_img: imgSrc,
        description: description,
        name_profile: profileName,
        like: likes,
        comments: comments,
        content_type: downloadLink.includes('.mp4') ? 'فيديو' : 'صورة'
      });
    }
  });

  return results;
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/download/instagram?url=https://www.instagram.com/p/C...
 */
router.get("/instagram", async (req, res) => {
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى تقديم رابط منشور انستغرام"
    });
  }

  if (!url.match(/instagram\.com\/(p|reel|tv)\//)) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "❌ هذا ليس رابط منشور انستغرام صالح"
    });
  }

  try {
    const result = await fetchInstagramContent(url);
    
    if (!result || !result.html) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "🚫 لم يتم العثور على محتوى قابل للتحميل"
      });
    }

    const content = extractContent(result.html);

    if (content.length === 0) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "🚫 لم يتم العثور على محتوى قابل للتحميل"
      });
    }

    res.json({
      status: 200,
      success: true,
      data: {
        link_insta: url,
        download_number: content.length,
        downloadLink: content
      }
    });
    
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء جلب المحتوى",
      error: err.message
    });
  }
});

module.exports = {
  path: "/api/download",
  name: "instagram downloader",
  type: "downloader",
  url: `${global.t}/api/download/instagram?url=https://www.instagram.com/reel/DKnebqYowTg/?igsh=YzljYTk1ODg3Zg==`,
  logo: "",
  description: "تحميل الفيديوهات من انستا",
  router
};