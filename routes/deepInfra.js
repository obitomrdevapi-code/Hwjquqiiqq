const express = require("express");
const axios = require("axios");

const router = express.Router();

/**
 * قائمة الموديلات الثابتة
 */
const staticModels = [
  "deepseek-ai/DeepSeek-V3.2-Exp",
  "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
  "mistralai/Devstral-Small-2507",
  "mistralai/Devstral-Small-2505",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "meta-llama/Llama-3-8B-Instruct",
  "meta-llama/Llama-3-70B-Instruct",
  "google/gemma-7b-it",
  "google/gemma-2b-it"
];

/**
 * جلب قائمة الموديلات من القائمة الثابتة
 * @returns {Promise<Array>}
 */
async function fetchModelList() {
  return staticModels;
}

/**
 * إرسال سؤال إلى موديل معين
 * @param {string} model
 * @param {string} txt
 * @returns {Promise<string>}
 */
async function askModel(model, txt) {
  const payload = {
    model: model,
    messages: [{ role: "user", content: txt}]
};

  const headers = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K)",
    "Content-Type": "application/json"
};

  const res = await axios.post("https://api.deepinfra.com/v1/openai/chat/completions", payload, { headers});
  const out = res.data.choices?.[0]?.message?.content;
  return out || "❌ لا يوجد رد من الموديل.";
}

/**
 * نقطة النهاية لجلب الموديلات
 * مثال: /api/deepinfra/model/list
 */
router.get("/model_deepInfra/list", async (req, res) => {
  try {
    const models = await fetchModelList();
    res.json({
      status: 200,
      success: true,
      total: models.length,
      models
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "❌ حدث خطأ أثناء جلب الموديلات.",
      error: err.message
});
}
});

/**
 * نقطة النهاية للسؤال
 * مثال: /api/deepinfra?model=deepseek-ai/DeepSeek-V3.2-Exp&txt=ما هو الذكاء الاصطناعي؟
 */
router.get("/deepInfra", async (req, res) => {
  const { model, txt} = req.query;
  if (!model ||!txt) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال اسم الموديل والسؤال."
});
}

  try {
    const answer = await askModel(model, txt);
    res.json({
      status: 200,
      success: true,
      model,
      question: txt,
      answer
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "❌ حدث خطأ أثناء إرسال السؤال.",
      error: err.message
});
}
});

module.exports = {
  path: "/api/ai",
  name: "DeepInfra Model API",
  type: "ai",
  url: `${global.t}/api/ai/deepInfra?model=deepseek-ai/DeepSeek-V3.2-Exp&txt=ما هو الذكاء الاصطناعي؟`,
  logo: "https://qu.ax/obitodeepinfra.png",
  description: "ذكاء اصطناعي متخصص الموديلات الخاص ب DeepInfra لجلب الموديلات /model_deepInfra/list",
  router
};