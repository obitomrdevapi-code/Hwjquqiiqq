const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { URLSearchParams} = require('url');

const router = express.Router();

const baseUrls = [
  'https://elevenlabs-crack.vercel.app',
  'https://elevenlabs-crack-qyb7.vercel.app',
  'https://elevenlabs-crack-f2zu.vercel.app'
];

router.get('/elevenlab', async (req, res) => {
  const { model, text} = req.query;

  if (!model) {
    return res.status(400).json({
      code: 1,
      msg: 'يرجى إدخال اسم النموذج عبر?model=، مثل getList أو bill'
});
}

  for (let i = 0; i < 3; i++) {
    const baseUrl = baseUrls[Math.floor(Math.random() * baseUrls.length)];

    try {
      if (!text && model === 'getList') {
        const { data: html} = await axios.get(baseUrl + '/');
        const $ = cheerio.load(html);
        const options = $('#ttsForm select[name="model"] option')
.map((_, el) => $(el).val())
.get();

        return res.status(200).json({
          code: 0,
          msg: 'success',
          models: options
});
}

      if (!text) {
        return res.status(400).json({
          code: 1,
          msg: 'يرجى إدخال النص المطلوب تحويله إلى صوت عبر?text='
});
}

      const payload = new URLSearchParams();
      payload.append('model', model);
      payload.append('text', text);

      const response = await axios.post(`${baseUrl}/generate-audio`, payload.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
          'Referer': baseUrl + '/'
},
        responseType: 'arraybuffer'
});

      const audioBuffer = Buffer.from(response.data);
      res.setHeader('Content-Type', 'audio/mpeg');
      return res.send(audioBuffer);
} catch (e) {
      console.log(`❌ Error: ${e.message}`);
}
}

  return res.status(500).json({
    code: 1,
    msg: 'النموذج غير متاح أو الخدمة مؤقتًا متوقفة. حاول لاحقًا أو تواصل مع المسؤول.'
});
});

module.exports = {
  path: "/api/ai",
  name: "ElevenLabs TTS",
  type: "ai",
  url: `${global.t}/api/ai/elevenlab?model=bill&text=السلام عليكم`,
  logo: "https://files.catbox.moe/elevenlabs.jpg",
  description: "تحويل النص إلى صوت باستخدام نماذج ElevenLabs ، لجلب قائمة الاصوات ?model=getList",
  router
};
