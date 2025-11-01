// بسم الله الرحمن الرحيم ✨
// TikTok Stalker API
// API لجلب معلومات حساب تيك توك

const express = require("express");
const axios = require("axios");

const router = express.Router();

const headers = {
  "Content-Type": "application/json",
  "Origin": "https://tokviewer.net",
  "Referer": "https://tokviewer.net/id",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
};

/**
 * جلب معلومات حساب تيك توك
 * @param {string} username - اسم المستخدم
 * @param {number} limit - عدد الفيديوهات
 * @returns {Promise<object>}
 */
async function ttStalk(username, limit = 10) {
  if (!username) throw new Error('Username is required');

  try {
    let user = await axios.post('https://tokviewer.net/api/check-profile', {
      username
    }, { headers });

    let video = await axios.post('https://tokviewer.net/api/video', {
      username,
      offset: 0,
      limit
    }, { headers });

    return {
      profile: user.data.data,
      video: video.data.data
    };
  } catch (e) {
    console.error('TikTok Stalk Error:', e.message);
    throw new Error('Failed to fetch TikTok profile: ' + e.message);
  }
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/info/tiktok_username?name=bzrk_killer
 */
router.get("/tiktok_username", async (req, res) => {
  const username = req.query.name;
  const limit = parseInt(req.query.limit) || 10;
  
  if (!username) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى تقديم اسم مستخدم تيك توك"
    });
  }

  try {
    const result = await ttStalk(username, limit);
    
    if (!result.profile || !result.profile.username) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "🚫 لم يتم العثور على حساب تيك توك بهذا الاسم"
      });
    }

    const { profile, video } = result;

    const responseData = {
      username: profile.username,
      user_id: profile.user_id,
      bio: profile.bio || 'No bio',
      followers: profile.follower,
      following: profile.following,
      likes: profile.likes,
      total_videos: profile.video,
      profile_url: `https://tiktok.com/@${profile.username}`,
      videos: video.map((v, index) => ({
        id: v.video_id,
        description: v.desc || '(No description)',
        video_url: `https://www.tiktok.com/@${username}/video/${v.video_id}`,
        index: index + 1
      }))
    };

    res.json({
      status: 200,
      success: true,
      data: responseData
    });
    
  } catch (err) {
    console.error('API Error:', err.message);
    
    let errorMessage = "حدث خطأ أثناء جلب معلومات الحساب";
    let statusCode = 500;
    
    if (err.message.includes('Username is required')) {
      errorMessage = "يرجى تقديم اسم مستخدم";
      statusCode = 400;
    } else if (err.message.includes('not found') || err.message.includes('404')) {
      errorMessage = "لم يتم العثور على حساب تيك توك بهذا الاسم";
      statusCode = 404;
    }

    res.status(statusCode).json({
      status: statusCode,
      success: false,
      message: errorMessage,
      error: err.message
    });
  }
});

module.exports = {
  path: "/api/info",
  name: "tiktok username info",
  type: "info",
  url: `${global.t}/api/info/tiktok_username?name=bzrk_killer`,
  logo: "",
  description: "جلب معلومات حساب تيك توك عبر اسم المستخدم",
  router
};