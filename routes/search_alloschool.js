const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

async function searchAlloschool(query) {
  try {
    const response = await axios.get("https://www.alloschool.com/search?q=" + encodeURIComponent(query));
    const $ = cheerio.load(response.data);
    const elements = $("ul.list-unstyled li");
    const result = elements
.map((i, el) => {
        const title = $("a", el).text().trim();
        const url = $("a", el).attr("href");
        if (/^https?:\/\/www\.alloschool\.com\/element\/\d+$/.test(url)) {
          return {
            index: i + 1,
            title,
            url,
};
}
})
.get()
.filter((item) => item);
    return result;
} catch (error) {
    console.error("[ERROR] فشل البحث في AlloSchool:", error.message);
    return [];
}
}

router.get("/alloschool", async (req, res) => {
  const { q} = req.query;
  if (!q) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "❌ يرجى إدخال كلمة البحث عبر البارامتر?q=",
});
}

  const results = await searchAlloschool(q);
  res.json({
    status: 200,
    success: true,
    query: q,
    count: results.length,
    results,
});
});

module.exports = {
  path: "/api/search",
  name: "AlloSchool Search",
  type: "search",
  url: `${global.t}/api/search/alloschool?q=كلمة`,
  logo: "",
  description: "بحث في موقع AlloSchool",
  router,
};