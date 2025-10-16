

const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

async function writecream(prompt, txt) {
  const url = "https://8pe3nv3qha.execute-api.us-east-1.amazonaws.com/default/llm_chat";
  const query = [
    { role: "system", content: prompt},
    { role: "user", content: txt}
  ];
  const params = new URLSearchParams({
    query: JSON.stringify(query),
    link: "writecream.com"
});

  try {
    const response = await fetch(`${url}?${params.toString()}`);
    const data = await response.json();

    let raw = data.response_content || data.reply || data.result || data.text || '';
    let cleaned = raw
.replace(/\\n/g, '\n')
.replace(/\n{2,}/g, '\n\n')
.replace(/\*\*(.*?)\*\*/g, '*$1*');

    return cleaned.trim();
} catch (error) {
    return `🧞 فشل في الحصول على الرد: ${error.message}`;
}
}

router.get('/writecream', async (req, res) => {
  const { logic, question} = req.query;

  if (!logic ||!question) {
    return res.status(400).json({
      code: 1,
      msg: 'يرجى تقديم وصف الشخصيه بعد ?prompt= وسؤال بعد ?txt='
});
}

  const reply = await writecream(logic, question);

  res.status(200).json({
    code: 0,
    msg: 'success',
    logic,
    question,
    reply
});
});

module.exports = {
  path: "/api/ai",
  name: "Writecream AI Logic",
  type: "ai",
  url: `${global.t}/api/ai/writecream?prompt=أنت مساعد ذكي اسمك اوبيتو&txt=كيفك؟`,
  logo: "https://files.catbox.moe/writecream.jpg",
  description: "استخدام منطق مخصص لتوليد ردود ذكية عبر واجهة Writecream.",
  router
};
