

const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

async function postData(url, payload) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
},
      body: JSON.stringify(payload)
});
    return await response.json();
} catch (error) {
    throw new Error(`فشل الاتصال بـ ToolBot: ${error.message}`);
}
}

async function SmartAI(text) {
  const gen = await postData("https://www.toolbot.ai/api/generate", {
    desire: text
});

  const { description, prompt} = gen.result[0];

  const query = await postData("https://www.toolbot.ai/api/query", {
    toolDescription: description,
    query: prompt
});

  return query;
}

router.get('/smartai', async (req, res) => {
  const { text} = req.query;

  if (!text ||!text.trim()) {
    return res.status(400).json({
      code: 1,
      msg: 'يرجى إدخال نص عبر?text='
});
}

  try {
    const result = await SmartAI(text);
    res.status(200).json({
      code: 0,
      msg: 'success',
      input: text,
      reply: result.result
});
} catch (err) {
    res.status(500).json({
      code: 1,
      msg: 'حدث خطأ أثناء توليد الرد',
      error: err.message
});
}
});

module.exports = {
  path: "/api/ai",
  name: "Smart AI",
  type: "ai",
  url: `${global.t}/api/ai/smartai?text=ما هي فوائد النوم المبكر؟`,
  logo: "https://files.catbox.moe/smartai.jpg",
  description: "مساعد ذكي يعتمد على Tool Bot لتوليد ردود بناءً على النص المدخل.",
  router
};
