const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

// كلمات محظورة
const bannedWords = [
  "sex", "porn", "xxx", "nude", "18+", "hot", "adult", "drugs", "hack", "darkweb", "kill", "rape", "terror", "xnxn"
];

// التحقق من الكلمات الآمنة
function isSafeQuery(query = "") {
  const lowered = query.toLowerCase();
  return!bannedWords.some(word => lowered.includes(word));
}

// دالة استخراج المجموعات
async function fetchGroups(query) {
  const url = `https://groupsor.link/group/searchmore/${query.replace(/ /g, "-")}`;
  const result = [];

  try {
    const { data} = await axios.get(url);
    const $ = cheerio.load(data);

    $(".maindiv").each((i, el) => {
      result.push({
        title: $(el).find("img").attr("alt")?.trim(),
        thumb: "https://files.catbox.moe/placeholder.png" // صورة وهمية
});
});

    $("div.post-info-rate-share>.joinbtn").each((i, el) => {
      if (result[i]) {
        result[i].link = $(el).find("a").attr("href")?.trim().replace(
          "https://groupsor.link/group/join/",
          "https://chat.whatsapp.com/"
);
}
});

    $(".post-info").each((i, el) => {
      if (result[i]) {
        result[i].desc = $(el).find(".descri").text()?.replace("... continue reading", ".....").trim();
}
});

    return result;
} catch (err) {
    console.error("❌ خطأ أثناء الجلب:", err.message);
    return [];
}
}

// نقطة النهاية داخل /api/search
router.get("/search/groupsor", async (req, res) => {
  const { query} = req.query;
  if (!query) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "يرجى إدخال كلمة البحث في المعامل 'query'."
});
}

  if (!isSafeQuery(query)) {
    return res.status(403).json({
      status: 403,
      success: false,
      message: "🚫 البحث يحتوي على كلمات غير مسموح بها."
});
}

  const results = await fetchGroups(query);
  if (!results.length) {
    return res.status(404).json({
      status: 404,
      success: false,
      message: "❌ لم يتم العثور على مجموعات تطابق البحث."
});
}

  res.json({
    status: 200,
    success: true,
    total: results.length,
    query,
    results
});
});

module.exports = {
  path: "/api/search",
  name: "WhatsApp Group search",
  type: "search",
  url: `${global.t}/api/search/groupsor?query=تعليم`,
  logo: "https://files.catbox.moe/placeholder.png",
  description: "البحث عن مجموعات واتساب",
  router
};