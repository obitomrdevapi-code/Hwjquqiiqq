// بسم الله الرحمن الرحيم ✨
// Pinterest Image Scraper API
// البحث عن الصور من موقع pinterest.com

const express = require("express");
const axios = require("axios");

const router = express.Router();

/**
 * البحث عن الصور في Pinterest
 * @param {string} query - كلمة البحث
 * @returns {Promise<Array>}
 */
async function searchPinterestImages(query) {
  try {
    const response = await axios.get(`https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(query)}`);
    
    if (!response.data.status || !response.data.data) {
      return [];
    }

    // تصفية النتائج للحصول على الصور فقط
    const images = response.data.data
      .filter(item => item.type === "image" && item.image_url)
      .map(item => ({
        url_pint: item.pin,
        image_url: item.image_url,
        title: item.grid_title || item.description || "No Title"
      }));

    return images;
  } catch (error) {
    console.error("Error fetching Pinterest data:", error);
    return [];
  }
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/pinterest/search?q=obito uchiha
 */
router.get("/pinterest_img", async (req, res) => {
  const query = req.query.q;
  
  if (!query) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال كلمة البحث في المعامل ?q="
    });
  }

  try {
    const images = await searchPinterestImages(query);
    
    if (images.length === 0) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "🚫 لم يتم العثور على أي صور للبحث المطلوب."
      });
    }

    res.json({
      status: 200,
      success: true,
      query: query,
      total_images: images.length,
      images: images
    });
    
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء البحث عن الصور.",
      error: err.message
    });
  }
});

module.exports = {
  path: "/api/search",
  name: "pinterest images search",
  type: "search",
  url: `${global.t}/api/search/pinterest_img?q=obito uchiha`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "البحث عن الصور من موقع Pinterest",
  router
};