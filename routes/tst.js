const express = require("express");
const axios = require("axios");
const FormData = require("form-data");
const router = express.Router();

/**
 * استخراج معلومات الصورة من Pic2Map
 * @param {Buffer} imageBuffer - محتوى الصورة
 * @returns {Promise<object>}
 */
async function extractImageInfo(imageBuffer) {
  const uploadUrl = "https://www.pic2map.com/includes/upload.php";
  const headers = {
    'User-Agent': "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36",
    'Accept': "application/json",
    'X-Requested-With': "XMLHttpRequest",
};

  try {
    const form = new FormData();
    form.append('private', '1');
    form.append('file', imageBuffer, {
      filename: 'image.jpg',
      contentType: 'image/jpeg'
});

    const uploadRes = await axios.post(uploadUrl, form, {
      headers: {
...form.getHeaders(),
...headers
}
});

    const infoUrl = uploadRes.data.trim();
    const infoRes = await axios.get(infoUrl);
    const html = infoRes.data;

    const extract = (regex) => {
      const match = html.match(regex);
      return match? match[1]: null;
};

    const data = {
      brand: extract(/Brand:<\/span><span class="dvalue">(.*?)<\/span>/),
      model: extract(/Model:<\/span><span class="dvalue">(.*?)<\/span>/),
      shutter_speed: extract(/Shutter:<\/span><span class="dvalue">(.*?)<\/span>/)?.split(' ')[0],
      f_number: extract(/F Number:<\/span><span class="dvalue">(.*?)<\/span>/),
      iso: extract(/ISO Speed:<\/span><span class="dvalue">(.*?)<\/span>/),
      focal_length: extract(/Focal Length:<\/span><span class="dvaluex">(.*?)<\/span>/),
      image_size: extract(/Image Size:<\/span><span class="dvalue">(.*?)<\/span>/),
      resolution: extract(/Resolution:<\/span><span class="dvalue">(.*?)<\/span>/),
      date: extract(/Date:<\/span><span class="dvalue">(.*?)<\/span>/),
      time: extract(/Time:<\/span><span class="dvalue">(.*?)<\/span>/),
      gps: html.includes("No GPS information was found")? "❌ لا توجد معلومات GPS": "✅ معلومات GPS متوفرة"
};

    return data;
} catch (err) {
    throw new Error("❌ فشل في استخراج معلومات الصورة: " + err.message);
}
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/image-info_camera?img=<رابط الصورة>
 */
router.get("/image-info_camera", async (req, res) => {
  const imageUrl = req.query.img;

  if (!imageUrl) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى تقديم رابط الصورة عبر?img="
});
}

  try {
    const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer'});
    const imageBuffer = Buffer.from(imageRes.data);

    const info = await extractImageInfo(imageBuffer);
    res.json({
      status: 200,
      success: true,
      data: info,
      message: "✅ تم استخراج معلومات الصورة بنجاح"
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: err.message
});
}
});

module.exports = {
  path: "/api/tools",
  name: "image metadata extractor",
  type: "tools",
  url: `${global.t}/api/tools/image-info_camera?img=<رابط الصورة>`,
  logo: "",
  description: "استخراج معلومات الصوره الملتقطه عبر الكامره",
  router
};