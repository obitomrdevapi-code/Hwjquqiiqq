const express = require("express");
const axios = require("axios");
const https = require("https");

const router = express.Router();

router.get("/mp4upload_vd", async (req, res) => {
  const { url} = req.query;
  if (!url ||!url.endsWith(".mp4")) {
    return res.status(400).json({ success: false, message: "يرجى تقديم رابط mp4 صالح"});
}

  try {
    const agent = new https.Agent({ rejectUnauthorized: false});

    const videoResponse = await axios({
      method: 'GET',
      url,
      responseType: 'stream',
      httpsAgent: agent,
      headers: {
        'user-agent': 'Mozilla/5.0 (Linux; Android 12)',
        'referer': 'https://www.mp4upload.com/'
},
      timeout: 60000
});

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'inline; filename="stream.mp4"');
    videoResponse.data.pipe(res);
} catch (err) {
    res.status(500).json({ success: false, message: "فشل في بث الفيديو", error: err.message});
}
});

module.exports = {
  path: "/api/tst",
  name: "mp4upload video stream",
  type: "tst",
  url: `${global.t}/api/tst/mp4upload_vd?url=https://...mp4`,
  logo: "https://cdn-icons-png.flaticon.com/512/1384/1384060.png",
  description: "بث فيديو mp4 مباشر من رابط mp4upload",
  router
};