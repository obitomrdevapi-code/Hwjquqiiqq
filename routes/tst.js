// بسم الله الرحمن الرحيم ✨
// Episode JSON Scraper API
// جلب بيانات الحلقة من API مباشرة

const express = require("express");
const axios = require("axios");

const router = express.Router();

const API_URL = "http://217.154.201.164:7763/api/witanime";
const TIMEOUT = 15000;

/**
 * جلب بيانات الحلقة من API
 * @param {string} url - رابط الحلقة
 * @returns {Promise<object>}
 */
async function fetchEpisodeData(url) {
  const apiUrl = `${API_URL}?url=${encodeURIComponent(url)}`;
  
  const response = await axios.get(apiUrl, { 
    timeout: TIMEOUT 
  });

  return response.data;
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/episode/json?url=https://witanime.you/episode/naruto-1
 */
router.get("/json", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ الرجاء إرسال رابط الحلقة (url) كمعامل استعلام"
    });
  }

  try {
    const episodeData = await fetchEpisodeData(url);

    res.json({
      status: 200,
      success: true,
      episodeUrl: url,
      data: episodeData
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "فشل في جلب البيانات من API",
      error: err.message
    });
  }
});

/**
 * نقطة النهاية البديلة للتحقق من صحة الرابط
 * مثال:
 *   /api/episode/validate?url=https://witanime.you/episode/naruto-1
 */
router.get("/validate", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ الرجاء إرسال رابط الحلقة (url) كمعامل استعلام"
    });
  }

  try {
    const episodeData = await fetchEpisodeData(url);
    
    // التحقق من وجود البيانات الأساسية
    const isValid = episodeData && 
                   (episodeData.sources || episodeData.streams || episodeData.video);

    res.json({
      status: 200,
      success: true,
      episodeUrl: url,
      isValid: isValid,
      hasSources: !!episodeData.sources,
      hasStreams: !!episodeData.streams,
      hasVideo: !!episodeData.video,
      dataType: typeof episodeData
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "فشل في التحقق من الرابط",
      error: err.message
    });
  }
});

module.exports = {
  path: "/api/anime",
  name: "episode data",
  type: "anime",
  url: `${global.t}/api/anime/json?url=https://witanime.you/episode/naruto-1`,
  logo: "https://cdn-icons-png.flaticon.com/512/1532/1532556.png",
  description: "جلب بيانات الحلقة من API مباشرة عبر الرابط",
  router
};