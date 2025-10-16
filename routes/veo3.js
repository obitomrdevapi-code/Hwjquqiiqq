const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const router = express.Router();

async function getVerificationToken() {
  const { data} = await axios.get('https://api.nekorinn.my.id/tools/rynn-stuff', {
    params: {
      mode: 'turnstile-min',
      siteKey: '0x4AAAAAAANuFg_hYO9YJZqo',
      url: 'https://aivideogenerator.me/features/g-ai-video-generator',
      accessKey: 'e2ddc8d3ce8a8fceb9943e60e722018cb23523499b9ac14a8823242e689eefed'
}
});

  if (!data.result?.token) {
    throw new Error('فشل في الحصول على رمز التحقق من الخدمة');
}

  return data.result.token;
}

function generateUID() {
  return crypto.createHash('md5').update(Date.now().toString()).digest('hex');
}

router.get('/veo3', async (req, res) => {
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
      source: 'aivideogenerator.me',
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

    if (!task.data?.recordId) {
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
  name: "VEO3 AI Video Generator",
  type: "ai",
  url: `${global.t}/api/ai/veo3?prompt=a majestic lion walking in the savanna`,
  logo: "https://files.catbox.moe/veo3ai.jpg",
  description: "توليد فيديو قصير بصوت باستخدام نموذج VEO3 من aivideogenerator.me.",
  router
};
