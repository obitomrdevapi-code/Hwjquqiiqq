

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const router = express.Router();

async function getVerificationToken() {
  const { data: cf} = await axios.get('https://api.nekorinn.my.id/tools/rynn-stuff', {
    params: {
      mode: 'turnstile-min',
      siteKey: '0x4AAAAAAAdJZmNxW54o-Gvd',
      url: 'https://lunaai.video/features/v3-fast',
      accessKey: '5238b8ad01dd627169d9ac2a6c843613d6225e6d77a6753c75dc5d3f23813653'
}
});

  if (!cf.result ||!cf.result.token) {
    throw new Error('فشل في الحصول على رمز التحقق من الخدمة');
}

  return cf.result.token;
}

function generateUID() {
  return crypto.createHash('md5').update(Date.now().toString()).digest('hex');
}

router.get('/lunavideo', async (req, res) => {
  const { prompt} = req.query;

  if (!prompt ||!prompt.trim()) {
    return res.status(400).json({
      code: 1,
      msg: 'يرجى إدخال وصف الفيديو عبر?prompt='
});
}

  try {
    const verifyToken = await getVerificationToken();
    const uid = generateUID();

    const { data: task} = await axios.post('https://aiarticle.erweima.ai/api/v1/secondary-page/api/create', {
      prompt,
      imgUrls: [],
      quality: '720p',
      duration: 8,
      autoSoundFlag: true,
      soundPrompt: '',
      autoSpeechFlag: false,
      speechPrompt: '',
      speakerId: 'Auto',
      aspectRatio: '16:9',
      secondaryPageId: 1811,
      channel: 'VEO3',
      source: 'lunaai.video',
      type: 'features',
      watermarkFlag: true,
      privateFlag: true,
      isTemp: true,
      vipFlag: true,
      model: 'veo-3-fast'
}, {
      headers: {
        'uniqueid': uid,
        'verify': verifyToken
}
});

    if (!task.data ||!task.data.recordId) {
      throw new Error('فشل في إنشاء مهمة توليد الفيديو');
}

    const recordId = task.data.recordId;
    let resultData;

    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 3000));

      const { data: status} = await axios.get(`https://aiarticle.erweima.ai/api/v1/secondary-page/api/${recordId}`, {
        headers: {
          'uniqueid': uid,
          'verify': verifyToken
}
});

      const state = status.data?.state;

      if (state === 'success') {
        resultData = JSON.parse(status.data.completeData);
        break;
} else if (state === 'fail') {
        throw new Error('فشل توليد الفيديو، ربما الوصف غير مناسب أو الخدمة مشغولة');
}
}

    const videoUrl = resultData?.data?.video_url;

    if (videoUrl) {
      return res.status(200).json({
        code: 0,
        msg: 'success',
        prompt,
        video: videoUrl
});
} else {
      return res.status(500).json({
        code: 1,
        msg: 'تم توليد الفيديو ولكن لم يتم العثور على الرابط',
        raw: resultData
});
}

} catch (err) {
    res.status(500).json({
      code: 1,
      msg: 'حدث خطأ أثناء توليد الفيديو',
      error: err.message
});
}
});

module.exports = {
  path: "/api/ai",
  name: "Luna AI Video Generator",
  type: "ai",
  url: `${global.t}/api/ai/lunavideo?prompt=مدينة مستقبلية تطير فيها السيارات`,
  logo: "https://files.catbox.moe/lunavideo.jpg",
  description: "توليد فيديو قصير بصوت باستخدام نموذج Luna AI عبر وصف نصي",
  router
};
