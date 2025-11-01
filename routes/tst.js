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
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'X-Requested-With': 'XMLHttpRequest',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://privatephotoviewer.com/',
    'Origin': 'https://privatephotoviewer.com',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin'
  };

  try {
    const response = await axios.post(endpoint, payload, { 
      headers: headers,
      timeout: 30000
    });

    // تحقق من وجود البيانات
    if (!response.data || !response.data.html) {
      throw new Error('No data received from server');
    }

    const html = response.data.html;
    const $ = cheerio.load(html);
    
    // تحقق إذا كان الحساب غير موجود
    if (html.includes('No profile found') || html.includes('not found')) {
      throw new Error('Account not found');
    }
    
    let profilePic = $('#profile-insta').find('.col-md-4 img').attr('src');
    if (profilePic) {
      if (profilePic.startsWith('//')) {
        profilePic = 'https:' + profilePic;
      } else if (profilePic.startsWith('/')) {
        profilePic = 'https://privatephotoviewer.com' + profilePic;
      }
    }
    
    const name = $('#profile-insta').find('.col-md-8 h4.text-muted').text().trim();
    const usernameResult = $('#profile-insta').find('.col-md-8 h5.text-muted').text().trim();
    
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
      username: usernameResult || 'N/A',
      profile_pic: profilePic || null,
      posts: stats.posts || '0',
      followers: stats.followers || '0',
      following: stats.following || '0',
      bio: bio || 'No bio available'
    };
  } catch (error) {
    console.error('Error fetching Instagram profile:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    throw new Error('Failed to fetch Instagram profile: ' + error.message);
  }
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/info/instagram_username?name=noureddine_ouafy
 */
router.get("/instagram_username", async (req, res) => {
  const username = req.query.name;
  
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
    console.error('API Error:', err.message);
    
    let errorMessage = "حدث خطأ أثناء جلب معلومات الحساب";
    let statusCode = 500;
    
    if (err.message.includes('Account not found')) {
      errorMessage = "🚫 لم يتم العثور على حساب انستغرام بهذا الاسم";
      statusCode = 404;
    } else if (err.message.includes('No data received')) {
      errorMessage = "لم يتم استقبال أي بيانات من الخادم";
    } else if (err.message.includes('timeout')) {
      errorMessage = "انتهت مهلة الطلب. حاول مرة أخرى";
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
  name: "instagram username info",
  type: "info",
  url: `${global.t}/api/info/instagram_username?name=noureddine_ouafy`,
  logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/1200px-Instagram_logo_2016.svg.png",
  description: "جلب معلومات حساب انستغرام عبر اسم المستخدم",
  router
};