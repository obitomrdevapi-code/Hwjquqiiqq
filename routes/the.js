const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();
const base = "https://en.tgramsearch.com";

/**
 * البحث في TgramSearch عن قنوات تيليجرام
 * @param {string} query
 * @returns {Promise<object>}
 */
async function searchTelegram(query) {
  if (!query) return { status: false, message: "يرجى إدخال كلمة بحث."};

  try {
    const searchUrl = `${base}/search?query=${encodeURIComponent(query)}`;
    const { data: html} = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
},
});

    const $ = cheerio.load(html);
    const results = [];

    $(".tg-channel-wrapper").each((i, el) => {
      const name = $(el).find(".tg-channel-link a").text().trim();
      let link = $(el).find(".tg-channel-link a").attr("href");
      const image = $(el).find(".tg-channel-img img").attr("src");
      const members = $(el).find(".tg-user-count").text().trim();
      const description = $(el).find(".tg-channel-description").text().trim();
      const category = $(el).find(".tg-channel-categories a").text().trim();

      if (link?.startsWith("/join/")) {
        link = `${base}${link}`;
} else if (link?.startsWith("tg://resolve?domain=")) {
        const username = link.split("tg://resolve?domain=")[1];
        link = `https://t.me/${username}`;
}

      results.push({
        name: name || "بدون اسم",
        link: link || "غير متوفر",
        image: image || null,
        members: members || "غير معروف",
        description: description || "لا يوجد وصف",
        category: category || "غير مصنف",
});
});

    return {
      status: true,
      total: results.length,
      query,
      results,
};
} catch (err) {
    console.error("[ERROR] أثناء البحث:", err.message);
    return { status: false, message: "حدث خطأ أثناء البحث."};
}
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/telegram?q=android
 */
router.get("/telegram", async (req, res) => {
  const { q} = req.query;
  const query = q || "";

  const result = await searchTelegram(query);
  if (!result.status) {
    return res.status(404).json({
      status: 404,
      success: false,
      message: result.message,
});
}

  res.json({
    status: 200,
    success: true,
    total: result.total,
    query,
    results: result.results,
});
});

module.exports = {
  path: "/api/search",
  name: "Telegram Channel search",
  type: "search",
  url: `${global.t}/api/search/telegram?q=android`,
  logo: "",
  description: "البحث عن قنوات تليجرام",
  router,
};
