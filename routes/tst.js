// بسم الله الرحمن الرحيم 🎨
// AI Image Generator API
// توليد الصور باستخدام الذكاء الاصطناعي

const express = require("express");
const axios = require("axios");

const router = express.Router();

/**
 * إنشاء عنوان IP عشوائي
 * @returns {string}
 */
function generateRandomIP() {
  const random = (max) => Math.floor(Math.random() * max);
  return `${random(300)}.${random(300)}.${random(300)}.${random(300)}`;
}

/**
 * توليد الصور من النص باستخدام الذكاء الاصطناعي
 * @param {string} prompt - النص المطلوب تحويله إلى صورة
 * @returns {Promise<object>}
 */
async function generateImageFromText(prompt) {
  try {
    if (!prompt) {
      throw new Error("⚠️ يرجى إدخال نص لإنشاء الصورة");
    }

    const response = await axios.post(
      "https://internal.users.n8n.cloud/webhook/ai_image_generator",
      {
        prompt: prompt
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Zanixon/1.0.0',
          'X-Client-Ip': generateRandomIP()
        },
        timeout: 30000 // 30 ثانية
      }
    );

    const data = response.data;
    
    if (!data.result) {
      throw new Error("❌ فشل في إنشاء الصورة");
    }

    return {
      success: true,
      prompt: prompt,
      images: data.result,
      generated_at: new Date().toISOString()
    };

  } catch (error) {
    console.error("Error generating image:", error);
    
    if (error.response) {
      throw new Error(`❌ خطأ من الخادم: ${error.response.status} - ${error.response.data}`);
    } else if (error.request) {
      throw new Error("❌ تعذر الاتصال بخادم توليد الصور");
    } else {
      throw new Error(`❌ خطأ في المعالجة: ${error.message}`);
    }
  }
}

/**
 * نقطة النهاية الرئيسية لتوليد الصور
 * مثال:
 *   /api/ai/image?txt=قطة لطيفة تمشي على الرصيف
 */
router.get("/img", async (req, res) => {
  const prompt = req.query.txt;
  
  if (!prompt) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال النص المطلوب في المعلمة txt",
      example: "/api/ai/image?txt=قطة لطيفة تمشي على الرصيف"
    });
  }

  try {
    const result = await generateImageFromText(prompt);
    
    res.json({
      status: 200,
      success: true,
      data: result
    });
    
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: err.message,
      prompt: prompt
    });
  }
});

/**
 * نقطة النهاية البديلة (POST)
 * مثال:
 *   POST /api/ai/image
 *   { "prompt": "قطة لطيفة تمشي على الرصيف" }
 */
router.post("/img", async (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال النص المطلوب في حقل prompt"
    });
  }

  try {
    const result = await generateImageFromText(prompt);
    
    res.json({
      status: 200,
      success: true,
      data: result
    });
    
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: err.message,
      prompt: prompt
    });
  }
});

/**
 * نقطة النهاية للصحة
 */
router.get("/health", async (req, res) => {
  res.json({
    status: 200,
    success: true,
    message: "🎨 خدمة توليد الصور تعمل بشكل طبيعي",
    timestamp: new Date().toISOString()
  });
});

module.exports = {
  path: "/api/ai",
  name: "AI Image Generator",
  type: "ai",
  url: `${global.t}/api/ai/img?txt=قطة لطيفة تمشي على الرصيف`,
  logo: "https://cdn-icons-png.flaticon.com/512/3131/3131626.png",
  description: "توليد الصور من النص باستخدام الذكاء الاصطناعي",
  router
};