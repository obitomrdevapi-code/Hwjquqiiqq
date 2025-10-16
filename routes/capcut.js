const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

async function extractCapcut(url) {
  const response = await axios.get(url);
  const html = response.data;
  const $ = cheerio.load(html);

  return {
    thumbnail: $('video').attr('poster'),
    video: $('video').attr('src')
};
}

router.get('/capcut', async (req, res) => {
  const { url} = req.query;

  if (!url ||!url.startsWith('https://www.capcut.com/')) {
    return res.status(400).json({
      code: 1,
      msg: 'يرجى إدخال رابط صالح من موقع CapCut عبر?url='
});
}

  try {
    const result = await extractCapcut(url);

    if (!result.video) {
      return res.status(404).json({
        code: 1,
        msg: 'لم يتم العثور على الفيديو، قد يكون الرابط غير صالح أو خاص.'
});
}

    res.status(200).json({
      code: 0,
      msg: 'success',
      source: url,
      video: result.video,
      thumbnail: result.thumbnail
});
} catch (err) {
    res.status(500).json({
      code: 1,
      msg: 'حدث خطأ أثناء استخراج الفيديو',
      error: err.message
});
}
});

module.exports = {
  path: "/api/download",
  name: "CapCut Video Downloader",
  type: "download",
  url: `${global.t}/api/download/capcut?url=https://www.capcut.com/t/Zs8F2jgx7`,
  logo: "https://files.catbox.moe/capcut.jpg",
  description: "تحميل الفيديوهات معا صوره المصغره مم CapCut",
  router
};
