// بسم الله الرحمن الرحيم ✨
// Anime TTS API
// API لتحويل النص إلى صوت بأنمي

const express = require("express");
const axios = require("axios");

const router = express.Router();

// دالة لتحويل النص إلى حروف مزخرفة
async function generate(text) {
  const xstr = 'abcdefghijklmnopqrstuvwxyz1234567890'.split('');
  const xput = '𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵𝟬'.split('');

  return text.toLowerCase().split('').map(ch => {
    const i = xstr.indexOf(ch);
    return i !== -1 ? xput[i] : ch;
  }).join('');
}

// قائمة الأصوات الكاملة
const models = {
  miku: { voice_id: "67aee909-5d4b-11ee-a861-00163e2ac61b", voice_name: "Hatsune Miku", language: "Japanese" },
  goku: { voice_id: "67aed50c-5d4b-11ee-a861-00163e2ac61b", voice_name: "Goku", language: "Japanese" },
  eminem: { voice_id: "c82964b9-d093-11ee-bfb7-e86f38d7ec1a", voice_name: "Eminem", language: "English" },
  luffy: { voice_id: "67aed6d8-5d4b-11ee-a861-00163e2ac61b", voice_name: "Luffy", language: "Japanese" },
  naruto: { voice_id: "67aed7b4-5d4b-11ee-a861-00163e2ac61b", voice_name: "Naruto", language: "Japanese" },
  sasuke: { voice_id: "67aed87c-5d4b-11ee-a861-00163e2ac61b", voice_name: "Sasuke", language: "Japanese" },
  gojo: { voice_id: "67aed944-5d4b-11ee-a861-00163e2ac61b", voice_name: "Gojo Satoru", language: "Japanese" },
  sukuna: { voice_id: "67aeda0c-5d4b-11ee-a861-00163e2ac61b", voice_name: "Sukuna", language: "Japanese" },
  levi: { voice_id: "67aedad4-5d4b-11ee-a861-00163e2ac61b", voice_name: "Levi Ackerman", language: "Japanese" },
  eren: { voice_id: "67aedb9c-5d4b-11ee-a861-00163e2ac61b", voice_name: "Eren Yeager", language: "Japanese" },
  mikasa: { voice_id: "67aedc64-5d4b-11ee-a861-00163e2ac61b", voice_name: "Mikasa Ackerman", language: "Japanese" },
  kirito: { voice_id: "67aedd2c-5d4b-11ee-a861-00163e2ac61b", voice_name: "Kirito", language: "Japanese" },
  asuna: { voice_id: "67aeddf4-5d4b-11ee-a861-00163e2ac61b", voice_name: "Asuna", language: "Japanese" },
  zenitsu: { voice_id: "67aedebc-5d4b-11ee-a861-00163e2ac61b", voice_name: "Zenitsu", language: "Japanese" },
  tanjiro: { voice_id: "67aedf84-5d4b-11ee-a861-00163e2ac61b", voice_name: "Tanjiro", language: "Japanese" },
  nezuko: { voice_id: "67aee04c-5d4b-11ee-a861-00163e2ac61b", voice_name: "Nezuko", language: "Japanese" },
  itachi: { voice_id: "67aee114-5d4b-11ee-a861-00163e2ac61b", voice_name: "Itachi Uchiha", language: "Japanese" },
  kakashi: { voice_id: "67aee1dc-5d4b-11ee-a861-00163e2ac61b", voice_name: "Kakashi Hatake", language: "Japanese" },
  vegeta: { voice_id: "67aee2a4-5d4b-11ee-a861-00163e2ac61b", voice_name: "Vegeta", language: "Japanese" },
  bulma: { voice_id: "67aee36c-5d4b-11ee-a861-00163e2ac61b", voice_name: "Bulma", language: "Japanese" }
};

// توليد IP عشوائي
function getRandomIp() {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join('.');
}

// قائمة User-Agents
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10; Pixel 4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
];

// دالة لتحويل النص إلى صوت
async function tts(text, specificModel = null) {
  const agent = userAgents[Math.floor(Math.random() * userAgents.length)];

  // إذا طلب نموذج محدد
  const modelsToProcess = specificModel ? 
    [[specificModel, models[specificModel]]].filter(([_, data]) => data) : 
    Object.entries(models);

  const tasks = modelsToProcess.map(async ([key, { voice_id, voice_name, language }]) => {
    const payload = {
      raw_text: text,
      url: "https://filme.imyfone.com/text-to-speech/anime-text-to-speech/",
      product_id: "200054",
      convert_data: [{ voice_id, speed: "1", volume: "50", text, pos: 0 }]
    };

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'X-Forwarded-For': getRandomIp(),
        'User-Agent': agent
      },
      timeout: 30000
    };

    try {
      const res = await axios.post('https://voxbox-tts-api.imyfone.com/pc/v1/voice/tts', payload, config);
      const result = res.data.data.convert_result[0];
      return { 
        model: key, 
        voice_name, 
        language,
        audio_url: result.oss_url,
        status: "success"
      };
    } catch (err) {
      return { 
        model: key, 
        voice_name, 
        language,
        error: err.message,
        status: "error" 
      };
    }
  });

  return Promise.all(tasks);
}

/**
 * نقطة النهاية الرئيسية - تحويل النص إلى صوت
 * مثال:
 *   /api/tts/anime?text=hello&model=miku
 */
router.get("/anime", async (req, res) => {
  const text = req.query.text;
  const model = req.query.model;
  
  if (!text) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى تقديم النص المراد تحويله إلى صوت"
    });
  }

  try {
    const results = await tts(text, model);
    
    const successfulResults = results.filter(r => r.status === "success");
    
    if (successfulResults.length === 0) {
      return res.status(500).json({
        status: 500,
        success: false,
        message: "❌ فشل في تحويل النص إلى صوت"
      });
    }

    res.json({
      status: 200,
      success: true,
      data: {
        original_text: text,
        total_voices: successfulResults.length,
        voices: successfulResults
      }
    });
    
  } catch (err) {
    console.error('TTS API Error:', err.message);
    
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء تحويل النص إلى صوت",
      error: err.message
    });
  }
});

/**
 * نقطة النهاية - قائمة الأصوات المتاحة
 * مثال:
 *   /api/tts/voices
 */
router.get("/voices", async (req, res) => {
  const voicesList = Object.entries(models).map(([key, data]) => ({
    id: key,
    name: data.voice_name,
    language: data.language,
    voice_id: data.voice_id
  }));

  res.json({
    status: 200,
    success: true,
    data: {
      total_voices: voicesList.length,
      voices: voicesList
    }
  });
});

module.exports = {
  path: "/api/tts",
  name: "anime tts",
  type: "tts",
  url: `${global.t}/api/tts/anime?text=hello&model=miku`,
  logo: "https://cdn-icons-png.flaticon.com/512/2936/2936735.png",
  description: "تحويل النص إلى صوت بأنمي مع أصوات متعددة",
  router
};