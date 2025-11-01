// بسم الله الرحمن الرحيم ✨
// Anime TTS API
// API لتحويل النص إلى صوت بأنمي

const express = require("express");
const axios = require("axios");

const router = express.Router();

// قائمة الأصوات الكاملة
const models = {
  miku: { voice_id: "67aee909-5d4b-11ee-a861-00163e2ac61b", voice_name: "Hatsune Miku", language: "Japanese" },
  goku: { voice_id: "67aed50c-5d4b-11ee-a861-00163e2ac61b", voice_name: "Goku", language: "Japanese" },
  eminem: { voice_id: "c82964b9-d093-11ee-bfb7-e86f38d7ec1a", voice_name: "Eminem", language: "English" },
  luffy: { voice_id: "67aed6d8-5d4b-11ee-a861-00163e2ac61b", voice_name: "Luffy", language: "Japanese" },
  naruto: { voice_id: "67aed7b4-5d4b-11ee-a861-00163e2ac61b", voice_name: "Naruto", language: "Japanese" }
};

// توليد IP عشوائي
function getRandomIp() {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join('.');
}

// قائمة User-Agents
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
];

// دالة لتحويل النص إلى صوت
async function tts(text, specificModel = null) {
  const agent = userAgents[Math.floor(Math.random() * userAgents.length)];

  // إذا طلب نموذج محدد
  const modelsToProcess = specificModel && models[specificModel] ? 
    [[specificModel, models[specificModel]]] : 
    Object.entries(models);

  const tasks = modelsToProcess.map(async ([key, { voice_id, voice_name, language }]) => {
    const payload = {
      text: text,
      voice_id: voice_id,
      speed: 1,
      volume: 50,
      format: "mp3"
    };

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': agent,
        'X-Forwarded-For': getRandomIp(),
        'Origin': 'https://filme.imyfone.com',
        'Referer': 'https://filme.imyfone.com/text-to-speech/anime-text-to-speech/'
      },
      timeout: 30000
    };

    try {
      // جرب نقاط نهاية مختلفة
      const endpoints = [
        'https://voxbox-tts-api.imyfone.com/pc/v1/voice/tts',
        'https://voxbox-tts-api.imyfone.com/api/v1/voice/tts',
        'https://api.imyfone.com/voxbox/tts'
      ];

      let result = null;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          const res = await axios.post(endpoint, payload, config);
          
          if (res.data && res.data.data) {
            result = res.data.data;
            break;
          }
        } catch (err) {
          lastError = err;
          console.log(`Endpoint ${endpoint} failed: ${err.message}`);
          continue;
        }
      }

      if (!result) {
        throw new Error(lastError?.message || 'All endpoints failed');
      }

      return { 
        model: key, 
        voice_name, 
        language,
        audio_url: result.oss_url || result.audio_url || result.url,
        status: "success"
      };
    } catch (err) {
      console.error(`Error for model ${key}:`, err.message);
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

  // تحقق من الطول
  if (text.length > 500) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "❌ النص طويل جداً. الحد الأقصى 500 حرف"
    });
  }

  try {
    console.log(`Processing TTS request for text: ${text}, model: ${model || 'all'}`);
    
    const results = await tts(text, model);
    
    const successfulResults = results.filter(r => r.status === "success");
    
    if (successfulResults.length === 0) {
      console.log('All TTS attempts failed:', results);
      return res.status(500).json({
        status: 500,
        success: false,
        message: "❌ فشل في تحويل النص إلى صوت. قد يكون الخادم غير متاح حالياً",
        details: results.map(r => ({ model: r.model, error: r.error }))
      });
    }

    console.log(`Successfully generated ${successfulResults.length} audio files`);

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
    success: false,
    data: {
      total_voices: voicesList.length,
      voices: voicesList
    }
  });
});

/**
 * نقطة النهاية - اختبار الخدمة
 * مثال:
 *   /api/tts/test
 */
router.get("/test", async (req, res) => {
  try {
    // اختبار بسيط
    const testText = "Hello world";
    const results = await tts(testText, "miku");
    
    const success = results.some(r => r.status === "success");
    
    res.json({
      status: 200,
      success: success,
      message: success ? "✅ الخدمة تعمل بشكل طبيعي" : "❌ الخدمة لا تعمل",
      test_results: results
    });
  } catch (err) {
    res.json({
      status: 500,
      success: false,
      message: "❌ فشل اختبار الخدمة",
      error: err.message
    });
  }
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