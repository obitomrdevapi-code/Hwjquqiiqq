// بسم الله الرحمن الرحيم 🎨
// DeepImg AI Image Generator API
// توليد الصور باستخدام الذكاء الاصطناعي من DeepImg

const express = require("express");
const axios = require("axios");

const router = express.Router();

/**
 * توليد الصور باستخدام DeepImg AI
 * @param {string} prompt - النص المطلوب تحويله إلى صورة
 * @param {object} options - الخيارات الإضافية
 * @returns {Promise<object>}
 */
async function generateDeepImage(prompt, options = {}) {
    try {
        const styleList = {
            'default': '-style Realism',
            'ghibli': '-style Ghibli Art',
            'cyberpunk': '-style Cyberpunk',
            'anime': '-style Anime',
            'portrait': '-style Portrait',
            'chibi': '-style Chibi',
            'pixel': '-style Pixel Art',
            'oil': '-style Oil Painting',
            '3d': '-style 3D'
        };
        
        const sizeList = {
            '1:1': '1024x1024',
            '3:2': '1080x720',
            '2:3': '720x1080'
        };

        const { style = 'default', size = '1:1' } = options;
        
        if (!prompt) {
            throw new Error('⚠️ يرجى إدخال النص المطلوب');
        }
        
        if (!styleList[style]) {
            throw new Error(`❌ النمط غير مدعوم. الأنماط المتاحة: ${Object.keys(styleList).join(', ')}`);
        }
        
        if (!sizeList[size]) {
            throw new Error(`❌ الحجم غير مدعوم. الأحجام المتاحة: ${Object.keys(sizeList).join(', ')}`);
        }
        
        const device_id = Array.from({ length: 32 }, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
        
        const { data } = await axios.post(
            'https://api-preview.apirouter.ai/api/v1/deepimg/flux-1-dev',
            {
                device_id: device_id,
                prompt: prompt + ' ' + styleList[style],
                size: sizeList[size],
                n: '1',
                output_format: 'png'
            },
            {
                headers: {
                    'content-type': 'application/json',
                    'origin': 'https://deepimg.ai',
                    'referer': 'https://deepimg.ai/',
                    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
                },
                timeout: 60000 // 60 ثانية
            }
        );
        
        return {
            success: true,
            prompt: prompt,
            style: style,
            size: size,
            image_url: data.data.images[0].url,
            generated_at: new Date().toISOString()
        };
        
    } catch (error) {
        console.error("DeepImg API Error:", error);
        
        if (error.response) {
            throw new Error(`❌ خطأ من الخادم: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
        } else if (error.request) {
            throw new Error('❌ تعذر الاتصال بخادم DeepImg');
        } else {
            throw new Error(`❌ خطأ في المعالجة: ${error.message}`);
        }
    }
}

/**
 * نقطة النهاية الرئيسية لتوليد الصور
 * مثال:
 *   /api/deepimg?txt=فتاة ترتدي نظارات&style=anime&size=3:2
 */
router.get("/img", async (req, res) => {
    const { txt, style = 'default', size = '1:1' } = req.query;
    
    if (!txt) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: "⚠️ يرجى إدخال النص المطلوب في المعلمة txt",
            example: "/api/deepimg/img?txt=فتاة ترتدي نظارات&style=anime&size=3:2",
            available_styles: ['default', 'ghibli', 'cyberpunk', 'anime', 'portrait', 'chibi', 'pixel', 'oil', '3d'],
            available_sizes: ['1:1', '3:2', '2:3']
        });
    }

    try {
        const result = await generateDeepImage(txt, { style, size });
        
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
            prompt: txt,
            style: style,
            size: size
        });
    }
});

/**
 * نقطة النهاية البديلة (POST)
 * مثال:
 *   POST /api/deepimg/img
 *   { 
 *     "prompt": "فتاة ترتدي نظارات",
 *     "style": "anime", 
 *     "size": "3:2" 
 *   }
 */
router.post("/img", async (req, res) => {
    const { prompt, style = 'default', size = '1:1' } = req.body;
    
    if (!prompt) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: "⚠️ يرجى إدخال النص المطلوب في حقل prompt",
            available_styles: ['default', 'ghibli', 'cyberpunk', 'anime', 'portrait', 'chibi', 'pixel', 'oil', '3d'],
            available_sizes: ['1:1', '3:2', '2:3']
        });
    }

    try {
        const result = await generateDeepImage(prompt, { style, size });
        
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
            prompt: prompt,
            style: style,
            size: size
        });
    }
});

/**
 * نقطة النهاية للحصول على المعلومات حول الأنماط والأحجام المتاحة
 */
router.get("/info", async (req, res) => {
    res.json({
        status: 200,
        success: true,
        data: {
            styles: {
                'default': 'الواقعية',
                'ghibli': 'فن غيبلي',
                'cyberpunk': 'سايبربانك',
                'anime': 'أنمي',
                'portrait': 'بورتريه',
                'chibi': 'تشيبي',
                'pixel': 'فن البكسل',
                'oil': 'الرسم الزيتي',
                '3d': 'ثلاثي الأبعاد'
            },
            sizes: {
                '1:1': 'مربع (1024x1024)',
                '3:2': 'أفقي (1080x720)',
                '2:3': 'عمودي (720x1080)'
            },
            usage: {
                get: "/api/deepimg/img?txt=نص&style=نمط&size=حجم",
                post: "POST /api/deepimg/img { prompt: 'نص', style: 'نمط', size: 'حجم' }"
            }
        }
    });
});

/**
 * نقطة النهاية للصحة
 */
router.get("/health", async (req, res) => {
    res.json({
        status: 200,
        success: true,
        message: "🎨 خدمة DeepImg AI تعمل بشكل طبيعي",
        timestamp: new Date().toISOString(),
        provider: "DeepImg AI"
    });
});

module.exports = {
    path: "/api/ai",
    name: "DeepImg AI Image Generator",
    type: "ai",
    url: `${global.t}/api/ai/img?txt=فتاة ترتدي نظارات&style=anime&size=3:2`,
    logo: "https://cdn-icons-png.flaticon.com/512/3131/3131626.png",
    description: "توليد الصور من النص باستخدام DeepImg AI مع أنماط متعددة",
    router
};