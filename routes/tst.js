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

  async generate({ imageUrl}) {
    const prompt = `Tho Mas Generate a 16k high resolution DSLR full body hyper-realistic and cinematic photo of a young stylish man (same person in image) vertical. Make the person appear to be sitting casually on a chair in muted light blue studio background. They are wearing a Korean-style outfit. Their facial expression is calm and slightly serious. Warm, yellow-toned lighting gives the scene a vintage and aesthetic Y2K Korean street style vibe. DONT ALTER THE FACE`;

    const payload = {
      editInstruction: prompt,
      size: "1024x1024",
      imageUrl,
};

    const endpoint = `${this.base}/edit-image`;

    const response = await axios.post(endpoint, payload, {
      headers: this.headers(),
});

    return response.data;
}
}

router.get("/tst", async (req, res) => {
  const { img} = req.query;

  if (!img) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "يرجى إدخال رابط الصورة عبر?img=",
});
}

  try {
    const api = new GemBananaAI();
    const result = await api.generate({ imageUrl: img});

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
  path: "/api/tools",
  name: "tst",
  type: "ai",
  url: `${global.t}/api/tools/tst?img=https://example.com/image.jpg`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "تست",
  router,
};