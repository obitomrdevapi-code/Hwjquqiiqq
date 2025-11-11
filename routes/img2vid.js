📄 *img2vid.js:*

```js
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
  let lastError = '';
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`المحاولة ${attempt} لإنشاء الفيديو...`);
      
      const gen = await axios.post('https://veo31ai.io/api/pixverse-token/gen', {
        videoPrompt: prompt,
        videoAspectRatio: '16:9',
        videoDuration: 5,
        videoQuality: '540p',
        videoModel: 'v4.5',
        videoImageUrl: imageUrl,
        videoPublic: false
      }, {
        timeout: 30000
      });

      const taskId = gen.data?.taskId;
      if (!taskId) {
        lastError = 'فشل في إنشاء المهمة - لا يوجد taskId';
        continue;
      }

      console.log(`تم إنشاء المهمة: ${taskId}`);

      const timeout = Date.now() + 180000; // 3 دقائق
      let videoUrl;

      while (Date.now() < timeout) {
        try {
          const res = await axios.post('https://veo31ai.io/api/pixverse-token/get', {
            taskId,
            videoPublic: false,
            videoQuality: '540p',
            videoAspectRatio: '16:9',
            videoPrompt: prompt
          }, {
            timeout: 30000
          });

          videoUrl = res.data?.videoData?.url;
          if (videoUrl) {
            console.log(`تم إنشاء الفيديو: ${videoUrl}`);
            return {
              success: true,
              videoUrl: videoUrl,
              taskId: taskId,
              prompt: prompt
            };
          }

          // إذا لم يكن الفيديو جاهزاً بعد
          const status = res.data?.status;
          if (status === 'processing' || status === 'pending') {
            console.log(`الفيديو قيد المعالجة...`);
            await new Promise(r => setTimeout(r, 8000)); // انتظار 8 ثواني
            continue;
          }

        } catch (getError) {
          console.log(`خطأ في جلب النتيجة: ${getError.message}`);
          // نستمر في المحاولة حتى انتهاء الوقت
        }

        await new Promise(r => setTimeout(r, 8000));
      }

      lastError = 'انتهى الوقت دون إنشاء الفيديو';

    } catch (error) {
      lastError = `خطأ في المحاولة ${attempt}: ${error.response?.status || error.code || error.message}`;
      console.log(lastError);
      
      // إذا كان الخطأ 404 أو 500، ننتظر قليلاً قبل إعادة المحاولة
      if (error.response?.status === 404 || error.response?.status === 500) {
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }

  throw new Error(`فشل بعد 3 محاولات. آخر خطأ: ${lastError}`);
}

/**
 * رفع الصورة إلى السيرفر
 * @param {Buffer} imageBuffer - بيانات الصورة
 * @returns {Promise<string>}
 */
async function uploadImage(imageBuffer) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const form = new FormData();
      form.append('files[]', imageBuffer, { 
        filename: `image-${Date.now()}.jpg`, 
        contentType: 'image/jpeg' 
      });

      const upload = await axios.post('https://uguu.se/upload', form, { 
        headers: form.getHeaders(),
        timeout: 30000
      });

      const imageUrl = upload.data?.files?.[0]?.url;
      if (!imageUrl) throw new Error('فشل في رفع الصورة - لا يوجد رابط');

      return imageUrl;
    } catch (error) {
      console.log(`محاولة رفع ${attempt} فشلت: ${error.message}`);
      if (attempt === 3) throw new Error(`فشل رفع الصورة بعد 3 محاولات: ${error.message}`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

/**
 * جلب الصورة من الرابط
 * @param {string} imageUrl - رابط الصورة
 * @returns {Promise<Buffer>}
 */
async function downloadImage(imageUrl) {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
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
  
  router: async (req, res) => {
    const { img, prompt } = req.query;

    if (!img || !prompt) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "⚠️ يرجى تقديم رابط الصورة والوصف المطلوب",
        usage: "/api/ai/img2vid?img=<رابط الصورة>&prompt=<الوصف>",
        example: "/api/ai/img2vid?img=https://f.top4top.io/p_35986irva1.jpg&prompt=اجعله يرقص"
      });
    }

    try {
      console.log(`بدء معالجة الطلب: ${img.substring(0, 50)}...`);
      
      // جلب الصورة من الرابط
      const imageBuffer = await downloadImage(img);
      console.log('تم تحميل الصورة بنجاح');
      
      // رفع الصورة
      const uploadedImageUrl = await uploadImage(imageBuffer);
      console.log('تم رفع الصورة:', uploadedImageUrl);
      
      // إنشاء الفيديو
      const result = await generateVideoFromImage(uploadedImageUrl, prompt);
      console.log('تم إنشاء الفيديو بنجاح');

      res.json({
        status: 200,
        success: true,
        message: "✅ تم إنشاء الفيديو بنجاح",
        data: result
      });

    } catch (err) {
      console.error('الخطأ النهائي:', err.message);
      res.status(500).json({
        status: 500,
        success: false,
        message: "حدث خطأ أثناء معالجة الطلب",
        error: err.message,
        note: "الخدمة قد تكون متقطعة، يرجى المحاولة مرة أخرى"
      });
    }
  }
};
```