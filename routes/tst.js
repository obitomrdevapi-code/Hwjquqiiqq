// DeepInfra Model Scraper API
// بسم الله الرحمن الرحيم ✨
// استخراج قائمة الموديلات والرد على الأسئلة باستخدام DeepInfra

const express = require("express");
const axios = require("axios");

const router = express.Router();

/**
 * جلب قائمة الموديلات من DeepInfra
 * @returns {Promise<Array>}
 */
async function fetchModelList() {
  const { data} = await axios.get("https://app.langdb.ai/provider/deepinfra");
  const models = [];
  const regex = /deepinfra\/([\w\-\/]+)/g;
  const matches = data.match(regex);
  if (matches) {
    const unique = [...new Set(matches)];
    for (let m of unique) {
      models.push(m.replace("deepinfra/", ""));
}
}
  return models;
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
router.get("/model/list", async (req, res) => {
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
  description: "جلب الموديلات من DeepInfra والرد على الأسئلة باستخدامها",
  router
};