
const express = require('express');
const axios = require('axios');
const router = express.Router();

// API الذكاء الاصطناعي
router.get('/ai-gpt4', async (req, res) => {
  const { txt} = req.query;

  // التحقق من إدخال السؤال
  if (!txt ||!txt.trim()) {
    return res.status(400).json({
      code: 1,
      msg: 'Missing txt parameter (السؤال مطلوب)',
});
}

  try {
    // استدعاء API الخارجي
    const response = await axios.post('https://api.appzone.tech/v1/chat/completions', {
      messages: [{
        role: 'user',
        content: [{ type: 'text', text: txt}]
}],
      model: 'gpt-4.1',
      isSubscribed: true
}, {
      headers: {
        authorization: 'Bearer az-chatai-key',
        'content-type': 'application/json',
        'user-agent': 'okhttp/4.9.2',
        'x-app-version': '3.0',
        'x-requested-with': 'XMLHttpRequest',
        'x-user-id': '$RCAnonymousID:84947a7a4141450385bfd07a66c3b5c4'
}
});

    // معالجة الرد
    let fullText = '';
    const lines = response.data.split('\n\n').map(line => line.substring(6));
    for (const line of lines) {
      if (line === '[DONE]') continue;
      try {
        const d = JSON.parse(line);
        fullText += d.choices[0].delta.content;
} catch {}
}

    const thinkMatch = fullText.match(/<think>([\s\S]*?)<\/think>/);
    const think = thinkMatch? thinkMatch[1].trim(): '';
    const answer = fullText.replace(/<think>[\s\S]*?<\/think>/, '').trim();

    // إعادة النتائج إلى المستخدم
    res.status(200).json({
      code: 0,
      msg: 'success',
      model: 'GPT-4.1',
      question: txt,
      think,
      answer
});
} catch (error) {
    res.status(500).json({
      code: 1,
      msg: 'An error occurred',
      error: error.message,
});
}
});

// تصدير الـ router
module.exports = {
  path: "/api/ai",
  name: "GPT-4.1 AI",
  type: "ai",
  url: `${global.t}/api/ai/ai-gpt4?txt=ما هي عاصمة المغرب`,
  logo: "https://files.catbox.moe/3gpt41.jpg",
  description: "نموذج GPT-4.1 من OpenAI يتميز بالدقة العالية في فهم السياق وتوليد النصوص المعقدة.",
  router,
};
