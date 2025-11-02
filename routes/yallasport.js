const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const router = express.Router();

/**
 * استخراج المباريات من YallaSport
 * @param {string} day - today | tomorrow | yesterday
 * @returns {Promise<object[]>}
 */
async function fetchMatches(day) {
  const urls = {
    today: "https://m.yallasport.onl/matches-today/",
    tomorrow: "https://m.yallasport.onl/matches-tomorrow/",
    yesterday: "https://m.yallasport.onl/matches-yesterday/"
};

  const url = urls[day] || urls.today;

  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}
});

    const $ = cheerio.load(res.data);
    const matches = [];

    $(".match-container").each((_, el) => {
      const teams = $(el).find(".team-name").map((i, t) => $(t).text().trim()).get();
      const result = $(el).find("#result").text().trim() || "لم تبدأ";
      const time = $(el).find(".matchDate").attr("data-start") || "غير محدد";
      const infoItems = $(el).find(".match-info li").map((i, li) => $(li).text().trim()).get();
      const broadcast_link = $(el).find("a").attr("href") || "";

      matches.push({
        team1: teams[0] || "غير معروف",
        team2: teams[1] || "غير معروف",
        result,
        time: time!== "غير محدد"? new Date(time).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit'}): "غير محدد",
        channel: infoItems[0] || "غير معروف",
        commentator: infoItems[1] || "غير معروف",
        league: infoItems[2] || "غير معروف",
        broadcast_link
});
});

    return matches;
} catch (err) {
    throw new Error("❌ فشل في جلب المباريات: " + err.message);
}
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/yallasport/today
 *   /api/yallasport/tomorrow
 *   /api/yallasport/yesterday
 */
["today", "tomorrow", "yesterday"].forEach(day => {
  router.get(`/yallasport/${day}`, async (req, res) => {
    try {
      const matches = await fetchMatches(day);
      res.json({
        status: 200,
        success: true,
        day,
        count: matches.length,
        matches,
        message: `✅ تم استخراج مباريات ${day} بنجاح`
});
} catch (err) {
      res.status(500).json({
        status: 500,
        success: false,
        message: err.message
});
}
});
});

module.exports = {
  path: "/api/tools",
  name: "YallaSport Match",
  type: "tools",
  url: `${global.t}/api/tools/yallasport/{today|tomorrow|yesterday}`,
  logo: "",
  description: "استخراج مباريات اليوم والغد والأمس من موقع يلا سبورت",
  router
};