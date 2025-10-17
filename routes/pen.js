const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

const base = "https://www.pinterest.com";
const searchEndpoint = "/resource/BaseSearchResource/get/";

const headers = {
  'accept': 'application/json, text/javascript, */*, q=0.01',
  'referer': base,
  'user-agent': 'Mozilla/5.0',
  'x-app-version': 'a9522f',
  'x-pinterest-appstate': 'active',
  'x-requested-with': 'XMLHttpRequest'
};

/**
 * جلب الكوكيز من Pinterest
 * @returns {Promise<string|null>}
 */
async function getCookies() {
  try {
    const response = await axios.get(base);
    const setHeaders = response.headers['set-cookie'];
    if (setHeaders) {
      return setHeaders.map(c => c.split(';')[0].trim()).join('; ');
}
    return null;
} catch (err) {
    console.error("[ERROR] فشل جلب الكوكيز:", err.message);
    return null;
}
}

/**
 * البحث في Pinterest عن صور
 * @param {string} query - كلمة البحث
 * @returns {Promise<object>}
 */
async function searchPinterest(query) {
  if (!query) return { status: false, message: "يرجى إدخال كلمة بحث."};

  const cookies = await getCookies();
  if (!cookies) return { status: false, message: "فشل في استرجاع الكوكيز."};

  const params = {
    source_url: `/search/pinterest/?q=${query}`,
    data: JSON.stringify({
      options: { isPrefetch: false, query, scope: "pins", bookmarks: [""], page_size: 10},
      context: {}
}),
    _: Date.now()
};

  try {
    const { data} = await axios.get(`${base}${searchEndpoint}`, {
      headers: {...headers, cookie: cookies},
      params
});

    const results = data.resource_response.data.results.filter(v => v.images?.orig);
    if (!results.length) return { status: false, message: "لا توجد نتائج."};

    return {
      status: true,
      total: results.length,
      pins: results.map(pin => ({
        id: pin.id,
        title: pin.title || "بدون عنوان",
        description: pin.description || "بدون وصف",
        image: pin.images.orig.url,
        pin_url: `https://pinterest.com/pin/${pin.id}`,
        uploader: {
          username: pin.pinner.username,
          full_name: pin.pinner.full_name,
          profile_url: `https://pinterest.com/${pin.pinner.username}`
}
}))
};
} catch (err) {
    console.error("[ERROR] أثناء البحث:", err.message);
    return { status: false, message: "حدث خطأ أثناء البحث."};
}
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/pinterest/search?q=cat
 */
router.get("/pinterest", async (req, res) => {
  const { q} = req.query;
  const query = q || "";

  const result = await searchPinterest(query);
  if (!result.status) {
    return res.status(404).json({
      status: 404,
      success: false,
      message: result.message
});
}

  res.json({
    status: 200,
    success: true,
    total: result.total,
    query,
    pins: result.pins
});
});

module.exports = {
  path: "/api/search",
  name: "Pinterest Image Search",
  type: "search",
  url: `${global.t}/api/search/pinterest?q=cat`,
  logo: "",
  description: "البحث عن صور من Pinterest.",
  router
};