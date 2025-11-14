const express = require("express");
const axios = require("axios");
const translate = require("google-translate-api-x");

const router = express.Router();

/**
 * ترجمة النصوص من العربية إلى الإنجليزية
 * @param {string} text - النص المطلوب ترجمته
 * @returns {Promise<string>} - النص المترجم
 */
async function translateToEnglish(text) {
    try {
        const result = await translate(text, { to: 'en'});
        return result.text;
} catch (error) {
        console.error("❌ خطأ أثناء الترجمة:", error.message);
        throw new Error("❌ فشل في ترجمة النص إلى الإنجليزية");
}
}

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

        const { style = 'default', size = '1:1'} = options;

        if (!prompt) throw new Error('⚠️ يرجى إدخال النص المطلوب');
        if (!styleList[style]) throw new Error(`❌ النمط غير مدعوم: ${style}`);
        if (!sizeList[size]) throw new Error(`❌ الحجم غير مدعوم: ${size}`);

        const device_id = Array.from({ length: 32}, () =>
            Math.floor(Math.random() * 16).toString(16)
).join('');

        const { data} = await axios.post(
            'https://api-preview.apirouter.ai/api/v1/deepimg/flux-1-dev',
            {
                device_id,
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
                    'user-agent': 'Mozilla/5.0'
},
                timeout: 60000
}
);

        return {
            success: true,
            prompt,
            style,
            size,
            image_url: data.data.images[0].url,
            generated_at: new Date().toISOString()
};
} catch (error) {
        console.error("DeepImg API Error:", error);
        throw new Error(error.response?.data?.message || error.message || '❌ خطأ غير معروف');
}
}

/**
 * نقطة النهاية لتوليد الصور مع ترجمة النص
 * مثال:
 *   /api/deepimg?txt=قطة جميلة&style=anime&size=3:2
 */
router.get("/deepImg", async (req, res) => {
    const { txt, style = 'default', size = '1:1'} = req.query;

    if (!txt) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: "⚠️ يرجى إدخال النص المطلوب في المعلمة txt"
});
}

    try {
        const translated = await translateToEnglish(txt);
        const result = await generateDeepImage(translated, { style, size});

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
            style,
            size
});
}
});

/**
 * نقطة النهاية البديلة (POST) مع ترجمة
 */
router.post("/deepImg", async (req, res) => {
    const { prompt, style = 'default', size = '1:1'} = req.body;

    if (!prompt) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: "⚠️ يرجى إدخال النص المطلوب في حقل prompt"
});
}
try {
        const translated = await translateToEnglish(prompt);
        const result = await generateDeepImage(translated, { style, size});

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
            prompt,
            style,
            size
});
}
});

module.exports = {
    path: "/api/ai",
    name: "DeepImg AI Image Generator with Translation",
    type: "ai",
    url: `${global.t}/api/ai/deepImg?txt=قطة جميلة&style=anime&size=3:2`,
    logo: "https://cdn-icons-png.flaticon.com/512/3131/3131626.png",
    description: "توليد الصور من النص العربي بعد ترجمته إلى الإنجليزية باستخدام DeepImg AI",
    router
};