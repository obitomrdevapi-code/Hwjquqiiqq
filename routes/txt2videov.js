
// routes/ai-video.js
const express = require('express');
const axios = require('axios');
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

const deviceId = () =>
  Array.from({ length: 16}, () => Math.floor(Math.random() * 16).toString(16)).join('');

router.get('/txt2videov', async (req, res) => {
  const { txt} = req.query;
  if (!txt ||!txt.trim()) {
    return res.status(400).json({ code: 1, msg: 'يرجى إدخال وصف الفيديو عبر?txt='});
}

  const token = decryptToken();
  const payload = {
    deviceID: deviceId(),
    isPremium: 1,
    prompt: txt,
    used: [],
    versionCode: 59
};

  try {
    const genRes = await axios.post('https://text2video.aritek.app/txt2videov3', payload, {
      headers: {
        'user-agent': 'NB Android/1.0.0',
        'content-type': 'application/json',
        authorization: token
}
});

    const { code, key} = genRes.data;
    if (code!== 0 ||!key) {
      return res.status(500).json({ code: 1, msg: 'فشل في توليد المفتاح'});
}

    // انتظار الفيديو
    const videoPayload = { keys: [key]};
    const maxAttempts = 100;
    const delay = 2000;
    for (let i = 0; i < maxAttempts; i++) {
      const vidRes = await axios.post('https://text2video.aritek.app/video', videoPayload, {
        headers: {
          'user-agent': 'NB Android/1.0.0',
          'content-type': 'application/json',
          authorization: token
},
        timeout: 15000
});

      const { datas} = vidRes.data;
      if (datas?.[0]?.url) {
        return res.status(200).json({
          code: 0,
          msg: 'success',
          prompt: txt,
          video: datas[0].url.trim()
          });
}

      await new Promise(r => setTimeout(r, delay));
}

    res.status(504).json({ code: 1, msg: 'انتهى الوقت دون الحصول على الفيديو'});
} catch (err) {
    res.status(500).json({ code: 1, msg: 'خطأ أثناء توليد الفيديو', error: err.message});
}
});

module.exports = {
  path: "/api/ai",
  name: "AI Video Generator",
  type: "ai",
  url: `${global.t}/api/ai/txt2videov?txt=معركة في الفضاء`,
  logo: "https://files.catbox.moe/aivideo.jpg",
  description: "تحويل وصف نصي إلى فيديو باستخدام نموذج txt2videov3 من aritek.",
  router
};
