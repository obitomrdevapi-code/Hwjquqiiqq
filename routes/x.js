const express = require('express');
const axios = require('axios');
const router = express.Router();

async function fetchTwitterMedia(url) {
  try {
    const res = await axios.post(
      'https://contentstudio.io/.netlify/functions/facebookdownloaderapi',
      { url},
      {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36',
          'Referer': 'https://contentstudio.io/download/x-twitter-video-downloader'
}
}
);
    return res.data;
} catch (error) {
    return { error: 'فشل تحميل الوسائط من تويتر/X.'};
}
}

router.get('/twitter', async (req, res) => {
  const { url} = req.query;

  const regex = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/\d+/;
  if (!url ||!regex.test(url)) {
    return res.status(400).json({
      code: 1,
      msg: 'يرجى إدخال رابط صحيح من تويتر/X عبر?url='
});
}

  try {
    const result = await fetchTwitterMedia(url);

    if (result.error) {
      return res.status(500).json({
        code: 1,
        msg: result.error
});
}

    const medias = [];

    if (result.medias && result.medias.length> 0) {
      for (const media of result.medias) {
        if (media.url) {
          medias.push({
            type: media.type,
            url: media.url
});
}
}
} else if (result.url) {
      medias.push({
        type: result.type || 'unknown',
        url: result.url
});
}

    if (medias.length === 0) {
      return res.status(404).json({
        code: 1,
        msg: 'لم يتم العثور على أي وسائط في هذا الرابط.'
});
}

    res.status(200).json({
      code: 0,
      msg: 'success',
      source: url,
      medias
});
} catch (err) {
    res.status(500).json({
      code: 1,
      msg: 'حدث خطأ أثناء معالجة الطلب',
      error: err.message
});
}
});

module.exports = {
  path: "/api/download",
  name: "Twitter/X Media Downloader",
  type: "scraper",
  url: `${global.t}/api/download/twitter?url=https://twitter.com/example/status/123456789`,
  logo: "https://files.catbox.moe/twitterdl.jpg",
  description: "استخراج روابط الصور والفيديوهات من تغريدات تويتر/X.",
  router
};
