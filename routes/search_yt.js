const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * استخراج نتائج البحث من YouTube
 * @param {string} query - كلمة البحث
 * @returns {Promise<Array>}
 */
async function fetchYouTubeResults(query) {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const { data} = await axios.get(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept-Language': 'en-US,en;q=0.9'
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
  const videos = items.filter(item => item.videoRenderer).map(item => {
    const video = item.videoRenderer;
    return {
      title: video.title?.runs?.[0]?.text || 'No title',
      videoId: video.videoId,
      url: `https://www.youtube.com/watch?v=${video.videoId}`,
      thumbnails: video.thumbnail?.thumbnails || [],
      channel: video.ownerText?.runs?.[0]?.text || 'Unknown',
      channelUrl: `https://www.youtube.com${video.ownerText?.runs?.[0]?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url || ''}`,
      views: video.viewCountText?.simpleText || 'No views',
      published: video.publishedTimeText?.simpleText || 'No date',
};
});

  return videos;
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/youtube/search?q=cat videos
 */
router.get("/youtube", async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال كلمة للبحث عبر?q="
});
}

  try {
    const results = await fetchYouTubeResults(query);
    if (!results.length) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "🚫 لم يتم العثور على نتائج."
});
}

    res.json({
      status: 200,
      success: true,
      total: results.length,
      query,
      results
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء استخراج نتائج YouTube.",
      error: err.message
});
}
});

module.exports = {
  path: "/api/search",
  name: "youtube search",
  type: "search",
  url: `${global.t}/api/search/youtube?q=obito`,
  logo: "https://qu.ax/obitoyoutube.png",
  description: "البحث في اليوتيوب",
  router
};