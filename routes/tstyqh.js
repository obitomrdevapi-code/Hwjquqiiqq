// بسم الله الرحمن الرحيم ✨
// YouTube Edit Search Scraper API
// البحث عن ايديت في اليوتيوب

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * البحث عن ايديت في اليوتيوب والحصول على 10 نتائج
 * @param {string} query - كلمة البحث
 * @returns {Promise<Array>}
 */
async function searchYouTubeTop10(query) {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=ايديت+${encodeURIComponent(query)}`;
    const { data } = await axios.get(searchUrl, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(data);
    const scriptTags = $('script');
    const scriptTag = scriptTags.get().find(tag => $(tag).html().includes('var ytInitialData ='));
    if (!scriptTag) throw new Error('ytInitialData script tag not found.');

    const ytInitialDataRaw = $(scriptTag).html().match(/var ytInitialData = (.*?});/);
    if (!ytInitialDataRaw || ytInitialDataRaw.length < 2) throw new Error('Failed to extract ytInitialData.');

    const ytInitialData = JSON.parse(ytInitialDataRaw[1]);
    const contents = ytInitialData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    if (!contents) throw new Error('Search results not found.');

    const items = contents.find(x => x.itemSectionRenderer)?.itemSectionRenderer?.contents || [];
    const videos = items.filter(item => item.videoRenderer).slice(0, 10).map(item => {
      const video = item.videoRenderer;
      return {
        title: video.title?.runs?.[0]?.text || 'No title',
        url: `https://www.youtube.com/watch?v=${video.videoId}`
      };
    });
    return videos;
  } catch (error) {
    console.error('Error during YouTube scraping:', error.message);
    return null;
  }
}

/**
 * نقطة النهاية الرئيسية للبحث عن ايديت في اليوتيوب
 * مثال:
 *   /api/anime/aydit_yt?txt=naruto
 */
router.get("/aydit_yt", async (req, res) => {
    const searchText = req.query.txt;
    
    if (!searchText) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: "⚠️ يرجى إدخال نص للبحث في youtube"
        });
    }

    try {
        let searchResults = await searchYouTubeTop10(searchText);

        if (!searchResults || searchResults.length === 0) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "🚫 لم يتم العثور على نتائج في youtube"
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
            message: "حدث خطأ أثناء البحث في youtube",
            error: err.message
        });
    }
});

module.exports = {
  path: "/api/anime",
  name: "aydit anime 2 yt",
  type: "ainme",
  url: `${global.t}/api/anime/aydit_yt?txt=ناروتو`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "جلب ايديات انمي من يوتيوب",
  router
};
