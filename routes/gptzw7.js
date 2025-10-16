

const express = require('express');
const axios = require('axios');
const router = express.Router();

function generateRandomIP() {
  const octet = () => Math.floor(Math.random() * 256);
  return `${octet()}.${octet()}.${octet()}.${octet()}`;
}

async function getgptzw7Response(content) {
  const url = 'http://5awm.gpt.zw7.lol/chat.php';

  const data = {
    id: '3.5',
    web: '1',
    key: '',
    role: '',
    title: [
      { role: 'user', content},
      { role: 'assistant', content: 'You are a helpful assistant.'}
    ],
    text: content,
    stream: '0'
};

  try {
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 11; M2004J19C Build/RP1A.200720.011) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.129 Mobile Safari/537.36 WhatsApp/1.2.3',
        'Referer': 'http://5awm.gpt.zw7.lol/',
        'X-Forwarded-For': generateRandomIP()
}
});

    return response.data;
} catch (error) {
    throw new Error(`فشل الاتصال بـ GPTZW7: ${error.message}`);
}
}

router.get('/gptzw7', async (req, res) => {
  const { text} = req.query;

  if (!text ||!text.trim()) {
    return res.status(400).json({
      code: 1,
      msg: 'يرجى إدخال السؤال عبر?text='
});
}

  try {
    const response = await getgptzw7Response(text);
    const raw = response.html || response.text || '';
    const cleaned = decodeURIComponent(raw)
.replace(/\\n/g, '\n')
.replace(/\n{2,}/g, '\n\n')
.replace(/\*\*(.*?)\*\*/g, '*$1*');

    res.status(200).json({
      code: 0,
      msg: 'success',
      question: text,
      reply: cleaned.trim()
});
} catch (err) {
    res.status(500).json({
      code: 1,
      msg: 'خطأ أثناء توليد الرد',
      error: err.message
});
}
});

module.exports = {
  path: "/api/ai",
  name: "GPTZW7 Assistant",
  type: "ai",
  url: `${global.t}/api/ai/gptzw7?text=ما اسم اب نبي محمد؟`,
  logo: "https://files.catbox.moe/gptzw7.jpg",
  description: "مساعد ذكي يعتمد على GPTZW7 للإجابة على الأسئلة",
  router
};
