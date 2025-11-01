const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4} = require("uuid");
const { URL} = require("url");

const router = express.Router();

const UPLOAD_URL = "https://access.vheer.com/api/Vheer/UploadByFileNew";
const PARAMS = "2eYfnBtLhGE1cyYwsXjNqgT3y6LwF6W5De2QVtwDJIou9XywW/q3B83MaOQbHJnd5EkPEK96+vNfstY=";
const TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=auto&tl=ar&q=";

async function translate(text) {
  try {
    const res = await axios.get(TRANSLATE_URL + encodeURIComponent(text));
    return res.data[0].map((i) => i[0]).join("");
} catch {
    return text;
}
}

async function uploadToVheer(imageUrl) {
  try {
    const session = axios.create({
      headers: {
        Origin: "https://vheer.com",
        Referer: "https://vheer.com/",
        "User-Agent": "Mozilla/5.0",
},
      responseType: "arraybuffer",
});

    const parsedUrl = new URL(imageUrl);
    const filename = path.basename(parsedUrl.pathname) || `img_${uuidv4()}.jpg`;
    const buffer = await session.get(imageUrl).then((r) => r.data);
    fs.writeFileSync(filename, buffer);

    await session.options(UPLOAD_URL);
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filename), { filename, contentType: "image/jpeg"});
    formData.append("params", PARAMS);

    const response = await axios.post(UPLOAD_URL, formData, {
      headers: formData.getHeaders(),
});

    fs.unlinkSync(filename);

    const data = response.data;
    const caption = data?.data?.caption;
    if (caption) {
      data.data.caption = await translate(caption);
}

    return data;
} catch (error) {
    console.error("[ERROR] فشل رفع الصورة:", error.message);
    return { error: error.message};
}
}

router.get("/vheer", async (req, res) => {
  const { img} = req.query;
  if (!img) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "❌ يرجى إرسال رابط الصورة عبر البارامتر?img=",
});
}

  const result = await uploadToVheer(img);
  res.json({
    status: 200,
    success: true,
    image: img,
    result,
});
});

module.exports = {
  path: "/api/search",
  name: "Vheer Caption Translator",
  type: "search",
  url: `${global.t}/api/search/vheer?img=رابط`,
  logo: "https://vheer.com/favicon.ico",
  description: "تست",
  router,
};