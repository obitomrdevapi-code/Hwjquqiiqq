// بسم الله الرحمن الرحيم ✨
// AI Text to Speech API
// API للذكاء الاصطناعي وتحويل النص إلى صوت

const express = require('express');
const fetch = require('node-fetch');
const axios = require('axios');
const router = express.Router();

// دالة الذكاء الاصطناعي
async function writecream(prompt, txt) {
  const url = "https://8pe3nv3qha.execute-api.us-east-1.amazonaws.com/default/llm_chat";
  const query = [
    { role: "system", content: prompt },
    { role: "user", content: txt }
  ];
  const params = new URLSearchParams({
    query: JSON.stringify(query),
    link: "writecream.com"
  });

  try {
    const response = await fetch(`${url}?${params.toString()}`);
    const data = await response.json();

    let raw = data.response_content || data.reply || data.result || data.text || '';
    let cleaned = raw
      .replace(/\\n/g, '\n')
      .replace(/\n{2,}/g, '\n\n')
      .replace(/\*\*(.*?)\*\*/g, '*$1*');

    return cleaned.trim();
  } catch (error) {
    return `❌ فشل في الحصول على الرد: ${error.message}`;
  }
}

// دالة تحويل النص إلى صوت
async function textToSpeech(text) {
  const models = {
    miku: { voice_id: "67aee909-5d4b-11ee-a861-00163e2ac61b", voice_name: "Hatsune Miku" }
  };

  // توليد IP عشوائي
  function getRandomIp() {
    return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join('.');
  }

  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  ];

  const agent = userAgents[Math.floor(Math.random() * userAgents.length)];

  try {
    const payload = {
      raw_text: text,
      url: "https://filme.imyfone.com/text-to-speech/anime-text-to-speech/",
      product_id: "200054",
      convert_data: [{ 
        voice_id: models.miku.voice_id, 
        speed: "1", 
        volume: "50", 
        text: text, 
        pos: 0 
      }]
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

    const response = await axios.post('https://voxbox-tts-api.imyfone.com/pc/v1/voice/tts', payload, config);
    const result = response.data.data.convert_result[0];
    
    return {
      success: true,
      audio_url: result.oss_url,
      voice_name: models.miku.voice_name,
      model: "miku"
    };
  } catch (error) {
    console.error('TTS Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * نقطة النهاية الرئيسية - الذكاء الاصطناعي مع تحويل إلى صوت
 * مثال:
 *   GET /api/ai/speech?prompt=أنت مساعد ذكي&txt=كيف حالك؟
 */
router.get('/speech', async (req, res) => {
  const { prompt, txt } = req.query;

  if (!prompt || !txt) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى تقديم وصف الشخصية بعد ?prompt= والسؤال بعد ?txt="
    });
  }

  // التحقق من طول النص
  if (txt.length > 1000) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "❌ النص طويل جداً. الحد الأقصى 1000 حرف"
    });
  }

  try {
    console.log(`AI Speech Request - Prompt: ${prompt.substring(0, 50)}..., Text: ${txt.substring(0, 50)}...`);

    // الحصول على الرد من الذكاء الاصطناعي
    const aiReply = await writecream(prompt, txt);

    if (aiReply.includes('فشل في الحصول على الرد')) {
      return res.status(500).json({
        status: 500,
        success: false,
        message: "❌ فشل في الحصول على رد من الذكاء الاصطناعي"
      });
    }

    // تحويل الرد إلى صوت
    const ttsResult = await textToSpeech(aiReply);

    if (!ttsResult.success) {
      return res.status(500).json({
        status: 500,
        success: false,
        message: "❌ فشل في تحويل النص إلى صوت",
        error: ttsResult.error
      });
    }

    res.json({
      status: 200,
      success: true,
      data: {
        question: txt,
        prompt: prompt,
        ai_response: aiReply,
        speech: {
          audio_url: ttsResult.audio_url,
          voice_name: ttsResult.voice_name,
          model: ttsResult.model,
          format: "mp3"
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('AI Speech API Error:', err.message);

    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء معالجة الطلب",
      error: err.message
    });
  }
});

/**
 * نقطة النهاية - الذكاء الاصطناعي فقط (نص)
 * مثال:
 *   GET /api/ai/text?prompt=أنت مساعد ذكي&txt=كيف حالك؟
 */
router.get('/text', async (req, res) => {
  const { prompt, txt } = req.query;

  if (!prompt || !txt) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى تقديم وصف الشخصية بعد ?prompt= والسؤال بعد ?txt="
    });
  }

  try {
    console.log(`AI Text Request - Prompt: ${prompt.substring(0, 50)}..., Text: ${txt.substring(0, 50)}...`);

    const aiReply = await writecream(prompt, txt);

    if (aiReply.includes('فشل في الحصول على الرد')) {
      return res.status(500).json({
        status: 500,
        success: false,
        message: "❌ فشل في الحصول على رد من الذكاء الاصطناعي"
      });
    }

    res.json({
      status: 200,
      success: true,
      data: {
        question: txt,
        prompt: prompt,
        response: aiReply,
        timestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('AI Text API Error:', err.message);

    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء معالجة الطلب",
      error: err.message
    });
  }
});

/**
 * نقطة النهاية - تحويل النص إلى صوت فقط
 * مثال:
 *   GET /api/ai/tts?text=مرحبا بك
 */
router.get('/tts', async (req, res) => {
  const text = req.query.text;

  if (!text) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى تقديم النص بعد ?text="
    });
  }

  if (text.length > 500) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "❌ النص طويل جداً. الحد الأقصى 500 حرف"
    });
  }

  try {
    console.log(`TTS Request - Text: ${text.substring(0, 50)}...`);

    const ttsResult = await textToSpeech(text);

    if (!ttsResult.success) {
      return res.status(500).json({
        status: 500,
        success: false,
        message: "❌ فشل في تحويل النص إلى صوت",
        error: ttsResult.error
      });
    }

    res.json({
      status: 200,
      success: true,
      data: {
        original_text: text,
        speech: {
          audio_url: ttsResult.audio_url,
          voice_name: ttsResult.voice_name,
          model: ttsResult.model,
          format: "mp3"
        },
        timestamp: new Date().toISOString()
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
 *   GET /api/ai/voices
 */
router.get('/voices', async (req, res) => {
  const voices = [
    {
      id: "miku",
      name: "Hatsune Miku",
      language: "Japanese",
      type: "anime",
      gender: "female"
    }
  ];

  res.json({
    status: 200,
    success: true,
    data: {
      total_voices: voices.length,
      voices: voices
    }
  });
});

module.exports = {
  path: "/api/ai",
  name: "ai text to speech",
  type: "ai",
  url: `${global.t}/api/ai/speech?prompt=أنت مساعد ذكي&txt=مرحبا بك`,
  logo: "https://cdn-icons-png.flaticon.com/512/2936/2936735.png",
  description: "الذكاء الاصطناعي مع تحويل النص إلى صوت",
  router
};