const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * استخراج قائمة الترند من صفحة نتفليكس
 * @returns {Promise<Array>}
 */
async function fetchTrendingList() {
  const { data} = await axios.get("https://www.netflix.com/ar");
  const $ = cheerio.load(data);
  const result = [];

  $('script').each((_, el) => {
    const scriptText = $(el).html();
    const match = scriptText?.match(/reactContext = (.*?);/);
    if (match) {
      try {
        const raw = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) =>
          String.fromCharCode(parseInt(hex, 16))
);
        const json = JSON.parse(raw);
        const entries = Object.entries(json.models.graphql.data).filter(
          ([_, v]) =>!v?.__typename?.match(/Genre|Query/)
);

        for (const [_, v] of entries) {
          const genres = v.coreGenres?.edges?.map(e => json.models.graphql.data[e.node.__ref]?.name).join(', ');
          result.push({
            title: v.title,
            year: v.latestYear,
            synopsis: v.shortSynopsis,
            advisory: v.contentAdvisory?.certificationValue,
            type: v.__typename,
            genres,
            url: `https://www.netflix.com/ar/title/${v.videoId}`,
            poster: v['artwork({"params":{"artworkType":"BOXSHOT","dimension":{"width":200},"features":{"performNewContentCheck":false,"suppressTop10Badge":true},"format":"JPG"}})']?.url
});
}
} catch (err) {
        console.error("Parsing error:", err.message);
}
}
});

  return result;
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/netflix/trending
 */
router.get("/netflix", async (req, res) => {
  try {
    const list = await fetchTrendingList();
    res.json({
      status: 200,
      success: true,
      total: list.length,
      data: list
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء استخراج الترند.",
      error: err.message
});
}
});

module.exports = {
  path: "/api/search",
  name: "netflix trending",
  type: "search",
  url: `${global.t}/api/search/netflix`,
  logo: "",
  description: "جلب ترند الأفلام والمسلسلات من نتفليكس",
  router
};