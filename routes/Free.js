const express = require("express");
const axios = require("axios");

const router = express.Router();

/**
 * Format account info with English keys
 * @param {object} info - Raw API response
 * @returns {object} - Formatted JSON
 */
function formatAccountInfo(info) {
  const { AccountInfo, socialinfo, creditScoreInfo} = info;

  return {
    uid: socialinfo?.AccountID,
    name: AccountInfo?.AccountName,
    region: AccountInfo?.AccountRegion,
    level: AccountInfo?.AccountLevel,
    experience: AccountInfo?.AccountEXP,
    likes: AccountInfo?.AccountLikes,
    br_rank: AccountInfo?.BrRankPoint,
    cs_rank: AccountInfo?.CsRankPoint,
    version: AccountInfo?.ReleaseVersion,
    booyah_badges: AccountInfo?.AccountBPBadges,
    created_at: new Date(AccountInfo?.AccountCreateTime * 1000).toISOString(),
    last_login: new Date(AccountInfo?.AccountLastLogin * 1000).toISOString(),
    avatar_url: AccountInfo?.AccountAvatarId,
    banner_url: AccountInfo?.AccountBannerId,
    title_url: AccountInfo?.Title,
    signature: socialinfo?.AccountSignature,
    honor_score: creditScoreInfo?.creditScore || null
};
}

/**
 * Endpoint: /api/freefire?id=1010493740
 */
router.get("/freefire", async (req, res) => {
  const { id} = req.query;
  if (!id || isNaN(id)) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "الايدي غير صالح او مبند"
});
}

  const url = `https://client-hlgamingofficial.vercel.app/api/free-fire-special-hlg-api/account?uid=${id}&region=cis&key=74b9u988`;

  const headers = {
    "sec-ch-ua-platform": '"Android"',
    "x-recaptcha-token": "your-recaptcha-token-here",
    "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36",
    "accept": "*/*",
    "origin": "https://www.hlgamingofficial.com",
    "referer": "https://www.hlgamingofficial.com/",
    "accept-language": "en-US,en;q=0.9"
};

  try {
    const response = await axios.get(url, { headers});
    const formatted = formatAccountInfo(response.data);

    res.json({
      status: 200,
      success: true,
      uid: id,
      data: formatted
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "Failed to fetch account info",
      error: err.message
});
}
});

module.exports = {
  path: "/api/search",
  name: "Free Fire Info",
  type: "search",
  url: `${global.t}/api/search/freefire?id=1010493744`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "جلب معلومات حسابات فري فاير عبر الايدي",
  router
};
