// بسم الله الرحمن الرحيم ✨
// Instagram Stalker API
// API لجلب معلومات حساب انستغرام

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * جلب معلومات حساب انستغرام
 * @param {string} username - اسم المستخدم
 * @returns {Promise<object>}
 */
async function igstalkv2(username) {
  const endpoint = 'https://privatephotoviewer.com/wp-json/instagram-viewer/v1/fetch-profile';
  const payload = { find: username };
  const headers = {
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'X-Requested-With': 'XMLHttpRequest',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36',
    'Referer': 'https://privatephotoviewer.com/'
  };

  try {
    const { data } = await axios.post(endpoint, payload, { headers });
    const html = data.html;
    const $ = cheerio.load(html);
    
    let profilePic = $('#profile-insta').find('.col-md-4 img').attr('src');
    if (profilePic && profilePic.startsWith('//')) {
      profilePic = 'https:' + profilePic;
    }
    
    const name = $('#profile-insta').find('.col-md-8 h4.text-muted').text().trim();
    const username = $('#profile-insta').find('.col-md-8 h5.text-muted').text().trim();
    
    const stats = {};
    $('#profile-insta')
      .find('.col-md-8 .d-flex.justify-content-between.my-3 > div')
      .each((i, el) => {
        const statValue = $(el).find('strong').text().trim();
        const statLabel = $(el).find('span.text-muted').text().trim().toLowerCase();
        if (statLabel.includes('posts')) {
          stats.posts = statValue;
        } else if (statLabel.includes('followers')) {
          stats.followers = statValue;
        } else if (statLabel.includes('following')) {
          stats.following = statValue;
        }
      });
    
    const bio = $('#profile-insta').find('.col-md-8 p').text().trim();
    
    return {
      name: name || 'N/A',
      username: username || 'N/A',
      profile_pic: profilePic || null,
      posts: stats.posts || '0',
      followers: stats.followers || '0',
      following: stats.following || '0',
      bio: bio || 'No bio available'
    };
  } catch (error) {
    console.error('Error fetching Instagram profile:', error.message);
    throw new Error('Failed to fetch Instagram profile');
  }
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/stalk/instagram?username=noureddine_ouafy
 */
router.get("/instagram", async (req, res) => {
  const username = req.query.username;
  
  if (!username) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى تقديم اسم مستخدم انستغرام"
    });
  }

  try {
    const result = await igstalkv2(username);
    
    if (!result.username || result.username === 'N/A') {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "🚫 لم يتم العثور على حساب انستغرام بهذا الاسم"
      });
    }

    res.json({
      status: 200,
      success: true,
      data: {
        username: result.username,
        name: result.name,
        profile_picture: result.profile_pic,
        posts: result.posts,
        followers: result.followers,
        following: result.following,
        bio: result.bio,
        profile_url: `https://www.instagram.com/${result.username}/`
      }
    });
    
  } catch (err) {
    let errorMessage = "حدث خطأ أثناء جلب معلومات الحساب";
    
    if (err.message.includes('Failed to fetch Instagram profile')) {
      errorMessage = "فشل في جلب معلومات الحساب. حاول مرة أخرى بعد قليل";
    }

    res.status(500).json({
      status: 500,
      success: false,
      message: errorMessage,
      error: err.message
    });
  }
});

module.exports = {
  path: "/api/stalk",
  name: "instagram stalker",
  type: "stalker",
  url: `${global.t}/api/stalk/instagram?username=noureddine_ouafy`,
  logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/1200px-Instagram_logo_2016.svg.png",
  description: "جلب معلومات حساب انستغرام عبر اسم المستخدم",
  router
};