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

// دالة تحويل النص إلى صوت باستخدام Google TTS (بديل آمن)
async function textToSpeech(text) {
  try {
    // استخدام Google TTS المجاني والموثوق
    const encodedText = encodeURIComponent(text);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=ar&client=tw-ob`;
    
    const response = await axios.get(url, { 
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    });
    
    if (response.status === 200) {
      // تحويل إلى رابط قاعدة 64
      const base64Audio = Buffer.from(response.data).toString('base64');
      const audioUrl = `data:audio/mp3;base64,${base64Audio}`;
      
      return {
        success: true,
        audio_url: audioUrl,
        voice_name: "Google Arabic Voice",
        model: "google_tts",
        format: "mp3"
      };
    } else {
      throw new Error('Failed to generate audio');
    }
  } catch (error) {
    console.error('Google TTS Error:', error.message);
    
    // محاولة بديلة باستخدام VoiceRSS
    try {
      const voiceRssUrl = `http://api.voicerss.org/?key=demo&hl=ar&src=${encodeURIComponent(text)}&f=48khz_16bit_stereo`;
      const response = await axios.get(voiceRssUrl, { 
        responseType: 'arraybuffer',
        timeout: 30000
      });
      
      if (response.status === 200) {
        const base64Audio = Buffer.from(response.data).toString('base64');
        const audioUrl = `data:audio/mp3;base64,${base64Audio}`;
        
        return {
          success: true,
          audio_url: audioUrl,
          voice_name: "VoiceRSS Arabic",
          model: "voicerss",
          format: "mp3"
        };
      }
    } catch (secondError) {
      console.error('VoiceRSS Error:', secondError.message);
    }
    
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
  if (txt.length > 500) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "❌ النص طويل جداً. الحد الأقصى 500 حرف"
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
      // إذا فشل تحويل الصوت، نعيد النص فقط
      return res.json({
        status: 200,
        success: true,
        data: {
          question: txt,
          prompt: prompt,
          ai_response: aiReply,
          speech: {
            available: false,
            message: "تعذر تحويل النص إلى صوت",
            error: ttsResult.error
          },
          timestamp: new Date().toISOString()
        }
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
          available: true,
          audio_url: ttsResult.audio_url,
          voice_name: ttsResult.voice_name,
          model: ttsResult.model,
          format: ttsResult.format
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

module.exports = {
  path: "/api/ai",
  name: "ai text to speech",
  type: "ai",
  url: `${global.t}/api/ai/speech?prompt=أنت مساعد ذكي&txt=مرحبا بك`,
  logo: "https://cdn-icons-png.flaticon.com/512/2936/2936735.png",
  description: "الذكاء الاصطناعي مع تحويل النص إلى صوت",
  router
};