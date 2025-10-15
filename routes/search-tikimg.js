const express = require('express');
const axios = require('axios');
const router = express.Router();

// قائمة النماذج مع بياناتها
const models = {
  'gpt-4.1-nano': {
    name: 'GPT-4.1 Nano',
    model: 'gpt-4.1-nano',
    image: 'https://files.catbox.moe/1gptnano.jpg',
    description: 'نسخة خفيفة من GPT-4.1، مناسبة للردود السريعة والاستخدامات البسيطة.'
},
  'gpt-4.1-mini': {
    name: 'GPT-4.1 Mini',
    model: 'gpt-4.1-mini',
    image: 'https://files.catbox.moe/2gptmini.jpg',
    description: 'نموذج متوسط الأداء من OpenAI، يوازن بين السرعة والدقة.'
},
  'gpt-4.1': {
    name: 'GPT-4.1',
    model: 'gpt-4.1',
    image: 'https://files.catbox.moe/3gpt41.jpg',
    description: 'نموذج قوي من OpenAI يتميز بالدقة العالية في فهم السياق وتوليد النصوص المعقدة.'
},
  'o4-mini': {
    name: 'OpenAI O4 Mini',
    model: 'o4-mini',
    image: 'https://files.catbox.moe/4o4mini.jpg',
    description: 'نسخة مصغرة من OpenAI O4، مخصصة للمهام اليومية السريعة.'
},
  'deepseek-r1': {
    name: 'DeepSeek R1',
    model: 'deepseek-r1',
    image: 'https://files.catbox.moe/5deepseekr1.jpg',
    description: 'نموذج صيني متقدم يركز على التحليل العميق للنصوص والأسئلة التقنية.'
},
  'deepseek-v3': {
    name: 'DeepSeek V3',
    model: 'deepseek-v3',
    image: 'https://files.catbox.moe/6deepseekv3.jpg',
    description: 'الجيل الثالث من DeepSeek، يتميز بفهم لغوي دقيق وسرعة استجابة محسّنة.'
},
  'claude-3.7': {
    name: 'Claude 3.7',
    model: 'claude-3.7',
    image: 'https://files.catbox.moe/7claude37.jpg',
    description: 'من تطوير Anthropic، يركز على الأمان والردود الأخلاقية الدقيقة.'
},
  'gemini-2.0': {
    name: 'Gemini 2.0',
    model: 'gemini-2.0',
    image: 'https://files.catbox.moe/8gemini20.jpg',
    description: 'نموذج من Google يجمع بين الفهم البصري والنصي في تجربة موحدة.'
},
  'grok-3-mini': {
    name: 'Grok 3 Mini',
    model: 'grok-3-mini',
    image: 'https://files.catbox.moe/9grok3mini.jpg',
    description: 'من تطوير xAI، يتميز بسرعة استجابة عالية وتكامل مع منصات التواصل.'
},
  'qwen-qwq-32b': {
    name: 'Qwen QWQ 32B',
    model: 'qwen-qwq-32b',
    image: 'https://files.catbox.moe/10qwen32b.jpg',
    description: 'نموذج ضخم من Alibaba، مخصص للمهام المعقدة والتحليل اللغوي المتقدم.'
},
  'gpt-4o': {
    name: 'GPT-4o',
    model: 'gpt-4o',
    image: 'https://files.catbox.moe/11gpt4o.jpg',
    description: 'نموذج متعدد الوسائط من OpenAI، يجمع بين النص والصوت والصورة.'
},
  'o3': {
    name: 'OpenAI O3',
    model: 'o3',
    image: 'https://files.catbox.moe/12o3.jpg',
    description: 'نموذج تجريبي من OpenAI، يركز على التفاعل الطبيعي والسياقي.'
},
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    model: 'gpt-4o-mini',
    image: 'https://files.catbox.moe/13gpt4omini.jpg',
    description: 'نسخة خفيفة من GPT-4o، مناسبة للتطبيقات السريعة والمحمولة.'
},
  'llama-3.3': {
    name: 'LLaMA 3.3',
    model: 'llama-3.3',
    image: 'https://files.catbox.moe/14llama33.jpg',
    description: 'نموذج مفتوح المصدر من Meta، مثالي للباحثين والمطورين لتخصيصه حسب الحاجة.'
}
};

// إنشاء المسارات لكل موديل
for (const key in models) {
  const { model, name, image} = models[key];

  router.get(`/chatai/${key}`, async (req, res) => {
    const { txt} = req.query;

    if (!txt ||!txt.trim()) {
      return res.status(400).json({
        code: 1,
        msg: 'يرجى إدخال السؤال عبر?txt=',
        model: name,
        image
});
}

    try {
      const response = await axios.post('https://api.appzone.tech/v1/chat/completions', {
        messages: [{
          role: 'user',
          content: [{ type: 'text', text: txt}]
}],
        model,
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

      res.status(200).json({
        code: 0,
        model: name,
        image,
        question: txt,
        think,
        answer
});
} catch (err) {
      res.status(500).json({
        code: 1,
        msg: 'حدث خطأ أثناء المعالجة',
        error: err.message,
        model: name,
        image
});
}
});
}

// تصدير كل موديل كسكراب مستقل
const exportsList = Object.entries(models).map(([key, { name, image, description}]) => ({
  path: `/api/chatai/${key}`,
  name,
  type: 'ai',
  url: `${global.t}/api/chatai/${key}?txt=ما هي عاصمة المغرب`,
  logo: image,
  description,
  router
}));

module.exports = exportsList;
