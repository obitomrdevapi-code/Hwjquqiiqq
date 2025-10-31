const express = require("express");
const axios = require("axios");

const router = express.Router();

class GemBananaAI {
  constructor() {
    this.base = "https://efnlaalbmjngrdoessky.supabase.co/functions/v1";
    this.token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbmxhYWxibWpuZ3Jkb2Vzc2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NzA2MjMsImV4cCI6MjA3NTQ0NjYyM30.1Fk6Fl0RiB5a4h_KBSEqRocK_61vYRN-1v36eeZznbQ";
}

  headers() {
    return {
      accept: "*/*",
      authorization: `Bearer ${this.token}`,
      "content-type": "application/json",
      origin: "https://geminibanana.fun",
      referer: "https://geminibanana.fun/",
      "user-agent": "Mozilla/5.0",
};
}

  async generate({ prompt, imageUrl, size = "768x768"}) {
    const isImg2Img =!!imageUrl;
    const effectiveSize = isImg2Img? "1024x1024": size;
    const payload = isImg2Img
? { editInstruction: prompt, size: effectiveSize, imageUrl}
: { prompt, size: effectiveSize};

    const endpoint = isImg2Img
? `${this.base}/edit-image`
: `${this.base}/generate-image`;

    const response = await axios.post(endpoint, payload, {
      headers: this.headers(),
});

    return response.data;
}
}

router.get("/bananaai", async (req, res) => {
  const { prompt, img} = req.query;

  if (!prompt) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "يرجى إدخال وصف للصورة عبر?prompt=",
});
}

  try {
    const api = new GemBananaAI();
    const result = await api.generate({ prompt, imageUrl: img});

    if (!result ||!result.imageUrl) {
      return res.status(500).json({
        status: 500,
        success: false,
        message: "فشل توليد الصورة.",
});
}

    res.json({
      status: 200,
      success: true,
      prompt,
      imageUrl: result.imageUrl,
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء التوليد.",
      error: err.message,
});
}
});

module.exports = {
  path: "/api/ai",
  name: "Gemini BananaAI",
  type: "ai",
  url: `${global.t}/api/ai/bananaai?prompt=cat%20in%20space&img=https://example.com/cat.jpg`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "تعديل صوره بالذكاء الاصتناعي عبر BananaAI",
  router,
};