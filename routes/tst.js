const express = require("express");
const axios = require("axios");

const router = express.Router();

/**
 * إرسال تفاعل إلى منشور في القناة
 * @param {string} channelLink - رابط القناة
 * @param {string} emoji - الإيموجي المطلوب
 * @returns {Promise<object>}
 */
async function sendChannelReaction(channelLink, emoji) {
  const url = "https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/channel/react-to-post";
  
  const headers = {
    'authority': 'foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app',
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'ar-AE,ar;q=0.9,fr-MA;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
    'content-type': 'application/json',
    'cookie': 'jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MGNkODZhMDI0NmVlM2VmN2FlMGFmZiIsImlhdCI6MTc2MjQ1OTA2NCwiZXhwIjoxNzYzMDYzODY0fQ.CuAYqAeMtgLNKNl_SbEOI2mxuyno9xlE0hdje4zAwm4',
    'origin': 'https://asitha.top',
    'referer': 'https://asitha.top/',
    'sec-ch-ua': '"Chromium";v="107", "Not=A?Brand";v="24"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site',
    'user-agent': 'Mozilla/5.0 (Linux; Android 12; SM-A217F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36'
  };
  
  const data = {
    "post_link": channelLink,
    "reacts": emoji
  };
  
  try {
    const response = await axios.post(url, data, { headers });
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 500,
      message: error.message,
      data: error.response?.data
    };
  }
}

/**
 * الحصول على قائمة التفاعلات المتاحة
 * @returns {Array}
 */
function getAvailableReactions() {
  return ["❤️", "😂", "😮", "😥", "👏", "🔥", "⭐", "👍"];
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/telegram/react?link=https://t.me/channel/123&emoji=❤️
 */
router.get("/react", async (req, res) => {
  const channelLink = req.query.link;
  const emoji = req.query.emoji;

  // التحقق من المدخلات
  if (!channelLink || !emoji) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال رابط القناة والإيموجي",
      example: `${global.t}/api/telegram/react?link=https://t.me/channel/123&emoji=❤️`
    });
  }

  // التحقق من صحة الإيموجي
  const availableReactions = getAvailableReactions();
  if (!availableReactions.includes(emoji)) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "🚫 الإيموجي غير مدعوم",
      availableReactions: availableReactions
    });
  }

  try {
    const result = await sendChannelReaction(channelLink, emoji);
    
    if (result.success) {
      res.json({
        status: 200,
        success: true,
        message: "✅ تم إرسال التفاعل بنجاح",
        channel: channelLink,
        emoji: emoji,
        response: result.data
      });
    } else {
      res.status(result.status).json({
        status: result.status,
        success: false,
        message: "❌ فشل في إرسال التفاعل",
        error: result.message,
        channel: channelLink,
        emoji: emoji
      });
    }
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء إرسال التفاعل",
      error: err.message,
      channel: channelLink,
      emoji: emoji
    });
  }
});

/**
 * نقطة نهاية لعرض التفاعلات المتاحة
 */
router.get("/reactions", (req, res) => {
  const reactions = getAvailableReactions();
  
  res.json({
    status: 200,
    success: true,
    message: "📋 قائمة التفاعلات المتاحة",
    total: reactions.length,
    reactions: reactions
  });
});

module.exports = {
  path: "/api/tools",
  name: "رشق لايكات بوسطات واتساب",
  type: "tools",
  url: `${global.t}/api/whatsapp/react?link=رابط_القناة&emoji=❤️`,
  logo: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg",
  description: "لإرسال تفاعلات إلى منشورات قنوات واتساب",
  router
};