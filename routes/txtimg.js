const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const router = express.Router();

const decryptToken = () => {
  const cipher = 'hbMcgZLlzvghRlLbPcTbCpfcQKM0PcU0zhPcTlOFMxBZ1oLmruzlVp9remPgi0QWP0QW';
  const shift = 3;
  return [...cipher].map(c =>
    /[a-z]/.test(c)
? String.fromCharCode((c.charCodeAt(0) - 97 - shift + 26) % 26 + 97)
: /[A-Z]/.test(c)
? String.fromCharCode((c.charCodeAt(0) - 65 - shift + 26) % 26 + 65)
: c
).join('');
};

router.get('/txt2img', async (req, res) => {
  const { txt} = req.query;
  if (!txt ||!txt.trim()) {
    return res.status(400).json({ code: 1, msg: 'يرجى إدخال وصف الصورة عبر?txt='});
}

  const token = decryptToken();
  const form = new FormData();
  form.append('prompt', txt);
  form.append('token', token);

  try {
    const response = await axios.post('https://text2video.aritek.app/text2img', form, {
      headers: {
        'user-agent': 'NB Android/1.0.0',
...form.getHeaders()
}
});

    const { code, url} = response.data;
    if (code!== 0 ||!url) {
      return res.status(500).json({ code: 1, msg: 'فشل في توليد الصورة'});
}

    res.status(200).json({
      code: 0,
      msg: 'success',
      prompt: txt,
      image: url.trim()
});
} catch (err) {
    res.status(500).json({ code: 1, msg: 'خطأ أثناء الاتصال', error: err.message});
}
});

module.exports = {
  path: "/api/ai",
  name: "AI Image Generator",
  type: "ai",
  url: `${global.t}/api/ai/txt2img?txt=قصر في السماء`,
  logo: "https://h.uguu.se/RlyKrhlZ.jpg",
  description: "تحويل وصف نصي إلى صورة باستخدام نموذج text2img من aritek.",
  router
};
