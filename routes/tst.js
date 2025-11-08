// بسم الله الرحمن الرحيم ✨
// Wattpad Story Scraper API
// استخراج الروايات والفصول من موقع wattpad.com

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * البحث عن روايات في Wattpad
 * @param {string} query - كلمة البحث
 * @returns {Promise<Array>}
 */
async function searchWattpad(query) {
  try {
    const formattedQuery = encodeURIComponent(query);
    const url = `https://www.wattpad.com/search/${formattedQuery}`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const results = [];

    $(".title").each((index, element) => {
      const title = $(element).text().trim();
      const link = $(element).closest("a").attr("href");
      if (title && link) {
        results.push({ 
          index: index + 1, 
          title, 
          link: `https://www.wattpad.com${link}` 
        });
      }
    });
    return results;
  } catch (error) {
    throw new Error(`Error fetching search results: ${error.message}`);
  }
}

/**
 * جلب تفاصيل الرواية وفصولها
 * @param {string} storyUrl - رابط الرواية
 * @returns {Promise<object>}
 */
async function getWattpadStoryDetails(storyUrl) {
  try {
    const { data } = await axios.get(storyUrl);
    const $ = cheerio.load(data);

    const title = $("h1").text().trim();
    const author = $(".author a").text().trim();
    const description = $("meta[name='description']").attr("content");
    const image = $("meta[property='og:image']").attr("content") || 
                  $(".cover__BlyZa").attr("src") || 
                  "https://raw.githubusercontent.com/Adamjjjw614/Adam/main/uploads/1747198091100.jpg";
    
    const chapters = [];
    $("a._6qJpE").each((index, element) => {
      const chapterTitle = $(element).text().trim();
      const rawLink = $(element).attr("href");
      const chapterLink = rawLink.startsWith("https://www.wattpad.com") ? 
                         rawLink : 
                         `https://www.wattpad.com${rawLink}`;
      if (chapterTitle && chapterLink) {
        chapters.push({ 
          index: index + 1, 
          title: chapterTitle, 
          link: chapterLink 
        });
      }
    });
    
    return { title, author, description, image, chapters };
  } catch (error) {
    throw new Error(`Error fetching story details: ${error.message}`);
  }
}

/**
 * جلب محتوى الفصل
 * @param {string} chapterUrl - رابط الفصل
 * @returns {Promise<string>}
 */
async function getChapterContent(chapterUrl) {
  try {
    const { data } = await axios.get(chapterUrl);
    const $ = cheerio.load(html);
    
    let content = "";
    $(".panel-reading p, .panel-reading div").each((index, element) => {
      let paragraph = $(element).text().trim();
      if (paragraph) content += paragraph + "\n\n";
    });
    
    return content.trim();
  } catch (error) {
    throw new Error(`Error fetching chapter content: ${error.message}`);
  }
}

/**
 * نقطة النهاية للبحث
 * مثال:
 *   /api/wattpad/search?q=romance
 */
router.get("/wattpad/search", async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال كلمة للبحث عنها"
    });
  }

  try {
    const results = await searchWattpad(query);
    
    if (!results.length) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "❌ لم يتم العثور على نتائج"
      });
    }

    res.json({
      status: 200,
      success: true,
      query,
      totalResults: results.length,
      results
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

/**
 * نقطة النهاية لجلب تفاصيل الرواية
 * مثال:
 *   /api/wattpad/get?link=https://www.wattpad.com/story/123456
 */
router.get("/wattpad/get", async (req, res) => {
  const link = req.query.link;
  if (!link) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال رابط الرواية"
    });
  }

  try {
    const details = await getWattpadStoryDetails(link);
    
    if (!details) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "❌ لم يتم العثور على معلومات الرواية"
      });
    }

    res.json({
      status: 200,
      success: true,
      story: details
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء جلب معلومات الرواية",
      error: err.message
    });
  }
});

/**
 * نقطة النهاية لجلب محتوى الفصل
 * مثال:
 *   /api/wattpad/download?link=https://www.wattpad.com/123456-chapter-1
 */
router.get("/wattpad/download", async (req, res) => {
  const link = req.query.link;
  if (!link) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال رابط الفصل"
    });
  }

  try {
    const content = await getChapterContent(link);
    
    if (!content) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "❌ لم يتم العثور على محتوى الفصل"
      });
    }

    res.json({
      status: 200,
      success: true,
      content
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء جلب محتوى الفصل",
      error: err.message
    });
  }
});

module.exports = {
  path: "/api/search",
  name: "wattpad search",
  type: "search",
  url: `${global.t}/api/search/wattpad/search?q=romance`,
  logo: "https://raw.githubusercontent.com/Adamjjjw614/Adam/main/uploads/1747198091100.jpg",
  description: "البحث عن روايات Wattpad وجلب الفصول والمحتوى",
  router
};