const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();


async function fetchUserData(userId) {
  const { data} = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
  return {
    id: data.id,
    username: data.name,
    displayName: data.displayName,
    description: data.description || "لا يوجد وصف.",
    created: new Date(data.created).toLocaleDateString(),
    isBanned: data.isBanned,
    verified: data.hasVerifiedBadge
};
}


async function scrapeUserProfile(userId) {
  const url = `https://www.roblox.com/users/${userId}/profile`;
  const { data} = await axios.get(url);
  const $ = cheerio.load(data);

  const avatar = $('meta[property="og:image"]').attr("content");
  const ogDescription = $('meta[property="og:description"]').attr("content")?.trim();

  return { avatar, ogDescription, profileUrl: url};
}


router.get("/roblox", async (req, res) => {
  const userId = req.query.id;
  if (!userId ||!/^\d+$/.test(userId)) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال معرف مستخدم صالح"
});
}

  try {
    const userData = await fetchUserData(userId);
    const profileData = await scrapeUserProfile(userId);

    res.json({
      status: 200,
      success: true,
      user: {
        id: userData.id,
        username: userData.username,
        displayName: userData.displayName,
        description: userData.description,
        created: userData.created,
        isBanned: userData.isBanned,
        verified: userData.verified,
        avatar: profileData.avatar,
        profileUrl: profileData.profileUrl,
        ogDescription: profileData.ogDescription
}
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء استخراج بيانات المستخدم.",
      error: err.message
});
}
});

module.exports = {
  path: "/api/info",
  name: "roblox id info",
  type: "info",
  url: `${global.t}/api/info/roblox?id=1010493740`,
  logo: "https://tr.rbxcdn.com/1c3a4c9c7c3b8c7c3b8c7c3b8c7c3b8c/150/150/Image/Png",
  description: "جلب معلومات حساب Roblox عبر الايدي",
  router
};