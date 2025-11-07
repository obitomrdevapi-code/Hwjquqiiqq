// بسم الله الرحمن الرحيم ✨
// Image to Video AI Scraper
// تحويل الصور إلى فيديو باستخدام الذكاء الاصطناعي

const axios = require('axios');
const FormData = require('form-data');

/**
 * تحويل الصورة إلى فيديو باستخدام الذكاء الاصطناعي
 * @param {string} imageUrl - رابط الصورة
 * @param {string} prompt - وصف الفيديو المطلوب
 * @returns {Promise<object>}
 */
async function generateVideoFromImage(imageUrl, prompt) {
  try {
    // أولاً نحتاج للحصول على token
    const tokenResponse = await axios.get('https://veo31ai.io/api/pixverse-token');
    const token = tokenResponse.data?.token;
    
    if (!token) throw new Error('لا يمكن الحصول على token');

    const gen = await axios.post('https://veo31ai.io/api/pixverse-token/gen', {
      videoPrompt: prompt,
      videoAspectRatio: '16:9',
      videoDuration: 5,
      videoQuality: '540p',
      videoModel: 'v4.5',
      videoImageUrl: imageUrl,
      videoPublic: false
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const taskId = gen.data?.taskId;
    if (!taskId) throw new Error('فشل في إنشاء المهمة');

    const timeout = Date.now() + 180000;
    let videoUrl;

    while (Date.now() < timeout) {
      const res = await axios.post('https://veo31ai.io/api/pixverse-token/get', {
        taskId,
        videoPublic: false,
        videoQuality: '540p',
        videoAspectRatio: '16:9',
        videoPrompt: prompt
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      videoUrl = res.data?.videoData?.url;
      if (videoUrl) break;

      await new Promise(r => setTimeout(r, 5000));
    }

    if (!videoUrl) throw new Error('فشل في إنشاء الفيديو');

    return {
      success: true,
      videoUrl: videoUrl,
      taskId: taskId,
      prompt: prompt
    };
  } catch (error) {
    throw new Error(`خطأ في الإنشاء: ${error.message}`);
  }
}

/**
 * رفع الصورة إلى السيرفر
 * @param {Buffer} imageBuffer - بيانات الصورة
 * @returns {Promise<string>}
 */
async function uploadImage(imageBuffer) {
  try {
    const form = new FormData();
    form.append('files[]', imageBuffer, { 
      filename: 'image.jpg', 
      contentType: 'image/jpeg' 
    });

    const upload = await axios.post('https://uguu.se/upload', form, { 
      headers: form.getHeaders() 
    });

    const imageUrl = upload.data?.files?.[0]?.url;
    if (!imageUrl) throw new Error('فشل في رفع الصورة');

    return imageUrl;
  } catch (error) {
    throw new Error(`خطأ في الرفع: ${error.message}`);
  }
}

/**
 * جلب الصورة من الرابط وتحويلها إلى buffer
 * @param {string} imageUrl - رابط الصورة
 * @returns {Promise<Buffer>}
 */
async function downloadImage(imageUrl) {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer'
    });
    return Buffer.from(response.data);
  } catch (error) {
    throw new Error(`فشل في تحميل الصورة: ${error.message}`);
  }
}

module.exports = {
  path: "/api/ai",
  name: "image to video ai", 
  type: "ai",
  url: `${global.t}/api/ai/img2vid?img=<رابط الصورة>&prompt=<الوصف>`,
  logo: "https://cdn-icons-png.flaticon.com/512/5832/5832415.png",
  description: "تحويل الصور إلى فيديو باستخدام الذكاء الاصطناعي",
  
  /**
   * نقطة النهاية الرئيسية
   * مثال:
   *   /api/ai/img2vid?img=https://example.com/image.jpg&prompt=فيديو متحرك
   */
  router: async (req, res) => {
    const { img, prompt } = req.query;

    if (!img || !prompt) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "⚠️ يرجى تقديم رابط الصورة والوصف المطلوب",
        usage: "/api/ai/img2vid?img=<رابط الصورة>&prompt=<الوصف>",
        example: "/api/ai/img2vid?img=https://example.com/photo.jpg&prompt=شخص يرقص"
      });
    }

    try {
      // جلب الصورة من الرابط
      const imageBuffer = await downloadImage(img);
      
      // رفع الصورة
      const imageUrl = await uploadImage(imageBuffer);

      // إنشاء الفيديو
      const result = await generateVideoFromImage(imageUrl, prompt);

      res.json({
        status: 200,
        success: true,
        message: "✅ تم إنشاء الفيديو بنجاح",
        data: result
      });

    } catch (err) {
      console.error('Error:', err);
      res.status(500).json({
        status: 500,
        success: false,
        message: "حدث خطأ أثناء معالجة الطلب",
        error: err.message,
        details: "قد يكون السبب مشكلة في API الخارجي أو انتهاء صلاحية الخدمة"
      });
    }
  }
};