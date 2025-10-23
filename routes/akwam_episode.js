const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/search/episode?url=https://ak.sv/series/12345
 */
router.get("/akwam_episode", async (req, res) => {
  const { url} = req.query;
  if (!url) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "📎 أرسل رابط الحلقة أو الفيلم عبر?url="
});
}

  try {
    const { data} = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 10)"}
});

    const $ = cheerio.load(data);
    const isSeriesPage = url.includes("/series/") &&!url.includes("/episode/");
    const isEpisodePage = url.includes("/episode/");

    if (isSeriesPage) return extractSeriesData($, res, url);
    if (isEpisodePage) return extractEpisodeData($, res, url);
    return extractMovieData($, res, url);
} catch (err) {
    console.error(`[ERROR] فشل استخراج الصفحة:`, err.message);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "⚠️ حدث خطأ أثناء استخراج البيانات.",
      error: err.message
});
}
});

/**
 * استخراج بيانات المسلسل
 */
function extractSeriesData($, res, url) {
  const title = $("h1.entry-title").first().text().trim() || "غير معروف";
  const seriesInfo = {};
  $(".col-lg-7.font-size-16.text-white").each((_, el) => {
    const text = $(el).text().trim();
    if (text.includes("اللغة")) seriesInfo.language = text.replace("اللغة:", "").trim();
    if (text.includes("الترجمة")) seriesInfo.translation = text.replace("الترجمة:", "").trim();
    if (text.includes("الجودة")) seriesInfo.quality = text.replace("الجودة:", "").trim();
    if (text.includes("انتاج")) seriesInfo.production = text.replace("انتاج:", "").trim();
    if (text.includes("السنة")) seriesInfo.year = text.replace("السنة:", "").trim();
    if (text.includes("مدة المسلسل")) seriesInfo.duration = text.replace("مدة المسلسل:", "").trim();
});

  const episodes = [];
  $(".bg-primary2").each((i, el) => {
    const episodeTitle = $(el).find("h2 a").text().trim();
    const episodeLink = $(el).find("h2 a").attr("href");
    const episodeDate = $(el).find(".entry-date").text().trim();
    const episodeThumbnail = $(el).find("img").attr("src");
    if (episodeLink) {
      episodes.push({
        title: episodeTitle,
        link: episodeLink,
        date: episodeDate,
        thumbnail: episodeThumbnail,
        episodeNumber: i + 1
});
}
});

  const cast = [];
  $(".entry-box-3").each((_, el) => {
    const actorName = $(el).find(".entry-title").text().trim();
    const actorLink = $(el).find("a").attr("href");
    const actorImage = $(el).find("img").attr("src");
    if (actorName) {
      cast.push({ name: actorName, link: actorLink, image: actorImage});
}
});

  const story = $(".widget-body.text-white").first().text().trim() ||
                $(".text-white.font-size-18").first().text().trim();

  const categories = [];
  $(".badge.badge-pill.badge-light").each((_, el) => {
    const category = $(el).text().trim();
    if (category) categories.push(category);
});

  return res.status(200).json({
    status: 200,
    success: true,
    type: "series",
    title,
    seriesInfo,
    story: story.substring(0, 500) + "...",
    episodes,
    cast: cast.slice(0, 8),
    categories,
    totalEpisodes: episodes.length
});
}

/**
 * استخراج بيانات الحلقة الفردية
 */
function extractEpisodeData($, res, url) {
  const title = $("h1.entry-title").first().text().trim() || "غير معروف";
  const episodeInfo = {};
  $(".font-size-16.text-white").each((_, el) => {
    const text = $(el).text().trim();
    if (text.includes("الجودة")) episodeInfo.quality = text.replace("الجودة:", "").trim();
    if (text.includes("الحجم")) episodeInfo.size = text.replace("الحجم:", "").trim();
    if (text.includes("المدة")) episodeInfo.duration = text.replace("المدة:", "").trim();
});

  const qualities = [];
  $(".tab-content.quality").each((i, el) => {
    const qualityName = $(el).attr("id") || `جودة ${i + 1}`;
    const links = [];
    $(el).find('a[href*="/link/"]').each((_, a) => {
      const href = $(a).attr("href");
      const text = $(a).text().trim();
      const size = $(a).find(".font-size-14").text().trim() ||
                   text.match(/\d+(\.\d+)?\s*(MB|GB)/i)?.[0] || "";
      const server = $(a).find(".font-size-12").text().trim() ||
                     text.replace(size, "").trim() || "خادم غير معروف";
      if (href) links.push({ href, size, server, text});
});
    if (links.length) qualities.push({ quality: qualityName, links});
});

  if (!qualities.length) {
    const allLinks = [];
    $('a[href*="/link/"]').each((_, a) => {
      const href = $(a).attr("href");
      const text = $(a).text().trim();
      if (href) allLinks.push({ href, text, server: "خادم مباشر"});
});
    if (allLinks.length) qualities.push({ quality: "روابط مباشرة", links: allLinks});
}

  if (!qualities.length) {
    return res.status(404).json({
      status: 404,
      success: false,
      error: "❌ لم يتم العثور على روابط تحميل.",
      note: "قد تحتاج إلى زيارة صفحة الحلقة الفردية للحصول على روابط التحميل"
});
}

  return res.status(200).json({
    status: 200,
    success: true,
    type: "episode",
    title,
    episodeInfo,
    qualities,
    totalQualities: qualities.length,
    totalLinks: qualities.reduce((sum, q) => sum + q.links.length, 0)
});
}

/**
 * استخراج بيانات الفيلم
 */
function extractMovieData($, res, url) {
  const title = $("h1.entry-title").first().text().trim() || "غير معروف";
  const movieInfo = {};
  $(".col-lg-7.font-size-16.text-white").each((_, el) => {
    const text = $(el).text().trim();
    if (text.includes("اللغة")) movieInfo.language = text.replace("اللغة:", "").trim();
    if (text.includes("الجودة")) movieInfo.quality = text.replace("الجودة:", "").trim();
    if (text.includes("السنة")) movieInfo.year = text.replace("السنة:", "").trim();
    if (text.includes("المدة")) movieInfo.duration = text.replace("المدة:", "").trim();
});

  const qualities = [];
  $(".tab-content.quality").each((i, el) => {
    const qualityName = $(el).attr("id") || `جودة ${i + 1}`;
    const links = [];
    $(el).find('a[href*="/link/"]').each((_, a) => {
      const href = $(a).attr("href");
      const text = $(a).text().trim();
      const size = $(a).find(".font-size-14").text().trim() ||
                   text.match(/\d+(\.\d+)?\s*(MB|GB)/i)?.[0] || "";
      if (href) links.push({ href, size, text});
});
    if (links.length) qualities.push({ quality: qualityName, links});
});

  if (!qualities.length) {
    return res.status(404).json({
      status: 404,
      success: false,
      error: "❌ لم يتم العثور على روابط تحميل للفيلم."
});
}

  return res.status(200).json({
    status: 200,
    success: true,
    type: "movie",
    title,
    movieInfo,
    qualities,
    totalQualities: qualities.length
});
}

module.exports = {
  path: "/api/search",
  name: "akwam episode",
  type: "search",
  url: `${global.t}/api/search/akwam_episode?url=https://ak.sv/series/2488/fast-furious-spy-racers-الموسم-السادس`,
  logo: "https://qu.ax/obitoajajq.png",
  description:
    "جلب الحلقات و معلومات الفلم/المسلسل من منصة اكوام",
  router,
};
