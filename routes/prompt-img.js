const express = require("express");
const axios = require("axios");

const router = express.Router();

/**
 * ترجمة نص إلى العربية باستخدام Google Translate API
 * @param {string} text
 * @returns {Promise<string>}
 */
async function translateToArabic(text) {
  if (!text.trim()) return "";
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.append("client", "gtx");
  url.searchParams.append("sl", "auto");
  url.searchParams.append("dt", "t");
  url.searchParams.append("tl", "ar");
  url.searchParams.append("q", text);

  try {
    const res = await axios.get(url.href);
    return res.data[0].map(item => item[0].trim()).join(" ");
} catch {
    return text;
}
}

/**
 * استخراج وصف من صورة عبر API
 * @param {string} imageUrl
 * @returns {Promise<object>}
 */
async function fetchImagePrompt(imageUrl) {
  const { data: imageBuffer} = await axios.get(imageUrl, {
    responseType: "arraybuffer"
});

  const mimeType = imageUrl.endsWith(".png")? "image/png": "image/jpeg";
  const base64Img = Buffer.from(imageBuffer).toString("base64");
  const base64Url = `data:${mimeType};base64,${base64Img}`;

  const { data} = await axios.post(
    "https://imageprompt.org/api/ai/prompts/image",
    { base64Url},
    { headers: { accept: "/", "content-type": "application/json"}}
);

  const prompt = data?.prompt || data;
  const translated = await translateToArabic(prompt);

  return {
    prompt_en: prompt,
    prompt_ar: translated
};
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/vision/prompt?url=https://example.com/image.jpg
 */
router.get("/prompt-img", async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl ||!/^https?:\/\/.+\.(jpg|jpeg|png)$/.test(imageUrl)) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "يرجى إدخال رابط صورة صالح بصيغة JPG أو PNG"
});
}

  try {
    const result = await fetchImagePrompt(imageUrl);
    res.json({
      status: 200,
      success: true,
...result
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء تحليل الصورة",
      error: err.message
});
}
});

module.exports = {
  path: "/api/ai",
  name: "image to prompt",
  type: "ai",
  url: `${global.t}/api/ai/prompt-img?url=https://qu.ax/hvyzl.jpg`,
  logo: "",
  description: "جلب وصف الصوره عبر رابطها",
  router
};
`