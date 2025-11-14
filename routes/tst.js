const express = require("express");
const axios = require("axios");
const translate = require("google-translate-api-x");

const router = express.Router();

/**
 * دالة لترجمة النصوص باستخدام Google Translate API غير الرسمية
 * @param {string} text - النص المطلوب ترجمته
 * @param {string} to - رمز اللغة الهدف
 * @returns {Object} - كائن يحتوي على النص الأصلي والمترجم ولغات الترجمة
 */
async function translateText(text, to) {
    try {
        console.log(`🔍 جاري ترجمة النص: "${text}" إلى اللغة: "${to}"`);
        const result = await translate(text, { to });
        
        return {
            original_text: text,
            translated_text: result.text,
            from_language: result.from.language.iso,
            to_language: to,
        };
    } catch (error) {
        console.error(`❌ خطأ أثناء الترجمة: ${error.message}`);
        return { error: "حدث خطأ أثناء الترجمة. حاول مرة أخرى لاحقًا." };
    }
}

/**
 * نقطة نهاية لترجمة النصوص
 */
router.get("/translate", async (req, res) => {
    try {
        const { text, to } = req.query;

        if (!text || !to) {
            return res.status(400).json({
                error: "❌ يرجى تقديم النص المطلوب ترجمته (?text=) واللغة الهدف (?to=).",
            });
        }

        const data = await translateText(text, to);

        if (data.error) {
            return res.status(500).json({
                error: `❌ ${data.error}`,
            });
        }

        res.status(200).json({
            message: "📥 تم ترجمة النص بنجاح",
            results: data,
        });
    } catch (error) {
        console.error(`❌ خطأ أثناء معالجة الطلب: ${error.message}`);
        res.status(500).json({
            error: `❌ حدث خطأ: ${error.message}`,
        });
    }
});

// تصدير الـ API بالصيغة الموحدة
module.exports = {
  path: "/api/tools",
  name: "ترجمة",
  type: "tools",
  url: `${global.t}/api/tools/translate?txt=مرحبا&to=ar`,
  logo: "",
  description: "ترجمة الجمل و الكلمات",
  router
};