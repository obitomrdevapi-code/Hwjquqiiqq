// بسم الله الرحمن الرحيم ✨
// Anime Search Scraper API
// البحث عن الأنمي عبر TikTok API

const express = require("express");
const axios = require("axios");
const FormData = require("form-data");

const router = express.Router();

/**
 * البحث عن الأنمي عبر TikTok API (نفس الكود الأصلي)
 * @param {string} query - كلمة البحث
 * @param {number} count - عدد النتائج
 * @returns {Promise<Array>}
 */
const ttSearch = async (query, count = 10) => {
    try {
        let d = new FormData();
        d.append("keywords", query);
        d.append("count", count);
        d.append("cursor", 0);
        d.append("web", 1);
        d.append("hd", 1);

        let h = { headers: { ...d.getHeaders() } };
        let { data } = await axios.post("https://tikwm.com/api/feed/search", d, h);

        if (!data.data || !data.data.videos) return [];
        
        const baseURL = "https://tikwm.com";
        return data.data.videos.map(video => ({
            title: video.title || "بدون عنوان",
            play: baseURL + video.play
        }));
    } catch (e) {
        console.log(e);
        return [];
    }
}

/**
 * نقطة النهاية الرئيسية للبحث عن الأنمي
 * مثال:
 *   /api/anime/search?txt=naruto
 */
router.get("/aydit", async (req, res) => {
    const searchText = req.query.txt;
    
    if (!searchText) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: "⚠️ يرجى إدخال نص للبحث"
        });
    }

    try {
        let searchResults = await ttSearch(searchText, 10);

        if (searchResults.length === 0) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "🚫 لم يتم العثور على نتائج"
            });
        }

        res.json({
            status: 200,
            success: true,
            query: searchText,
            count: searchResults.length,
            results: searchResults
        });
        
    } catch (err) {
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ أثناء البحث",
            error: err.message
        });
    }
});

module.exports = {
  path: "/api/anime",
  name: "aydit anime",
  type: "anime",
  url: `${global.t}/api/anime/aydit?txt=ناروتو`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "البحث عن ايديت الانميات",
  router
};
