const express = require('express');
const axios = require('axios');
const router = express.Router();

// API DeepSeek
router.get('/deepseek-r1', async (req, res) => {
  const { txt} = req.query;

  // التحقق من إدخال السؤال
  if (!txt ||!txt.trim()) {
    return res.status(400).json({
      code: 1,
      msg: 'يرجى إدخال السؤال عبر?txt=',
});
}

  try {
    const { data} = await axios.post('https://ai.clauodflare.workers.dev/chat', {
      model: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
      messages: [{
        role: 'user',
        content: txt
}]
});

    if (!data.success) {
      return res.status(500).json({
        code: 1,
        msg: 'فشل في الحصول على الرد',
        details: data
});
}

    const response = data.data.response.split('</think>').pop().trim();

    res.status(200).json({
      code: 0,
      msg: 'success',
      model: 'DeepSeek R1 Distill Qwen-32B',
      question: txt,
      answer: response
});
} catch (error) {
    res.status(500).json({
      code: 1,
      msg: 'حدث خطأ أثناء المعالجة',
      error: error.message
});
}
});

// تصدير الـ router
module.exports = {
  path: "/api/ai",
  name: "DeepSeek R1 Distill",
  type: "ai",
  url: `${global.t}/api/ai/deepseek-r1?txt=ما هي عاصمة المغرب`,
  logo: "https://files.catbox.moe/5deepseekr1.jpg",
  description: "نموذج DeepSeek R1 Distill Qwen-32B يتميز بسرعة الاستجابة والتحليل الدقيق للنصوص.",
  router,
};
