const express = require("express");
const axios = require("axios");
const FormData = require("form-data");

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
      responseType: "stream",
});

    const imageStream = await session.get(imageUrl).then((r) => r.data);

    const form = new FormData();
    form.append("file", imageStream, {
      filename: "image.jpg",
      contentType: "image/jpeg",
});
    form.append("params", PARAMS);

    const response = await axios.post(UPLOAD_URL, form, {
      headers: form.getHeaders(),
});

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