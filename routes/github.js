const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

const regex = /(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/(.+)/i;

router.get('/gitclone', async (req, res) => {
  const { url} = req.query;

  if (!url ||!regex.test(url)) {
    return res.status(400).json({
      code: 1,
      msg: 'يرجى إدخال رابط مستودع GitHub صالح عبر?url='
});
}

  try {
    let [_, user, repo] = url.match(regex) || [];
    repo = repo.replace(/.git$/, '');

    const zipUrl = `https://api.github.com/repos/${user}/${repo}/zipball`;
    const response = await fetch(zipUrl, { method: 'HEAD'});

    const filename = response.headers
.get('content-disposition')
?.match(/attachment; filename=(.*)/)?.[1];

    if (!filename) {
      return res.status(500).json({
        code: 1,
        msg: 'فشل في استخراج اسم الملف من المستودع'
});
}

    res.status(200).json({
      code: 0,
      msg: 'success',
      repo: `${user}/${repo}`,
      filename,
      download: zipUrl
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
  name: "GitHub Downloader",
  type: "download",
  url: `${global.t}/api/download/gitclone?url=https://github.com/GataNina-Li/GataBot-MD`,
  logo: "https://files.catbox.moe/githubclone.jpg",
  description: "تحميل مستودع/مشاريع GitHub بصيغة ZIP مباشرة عبر رابط المستودع/مشروع",
  router
};
