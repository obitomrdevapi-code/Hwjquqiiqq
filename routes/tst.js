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
    const prompt = `A realistic urban portrait of a young man standing confidently in front of a vibrant graffiti wall filled with layered posters, colorful street art, and abstract textures. The background features overlapping paper textures, torn advertisements, and expressive

paint splashes - creating a chaotic yet artistic urban aesthetic

The man wears light beige casual clothes - a stylish overshirt and matching trousers from Dolce & Gabbana (DG) - accessorized with modern black sunglasses and minimal jewelry. His arms are crossed, and his expression is calm yet assertive, radiating confidence and urban coolness

Lighting is soft and cinematic, emphasizing the contours of his face and clothes, with warm tones highlighting his silhouette while the graffiti background remains slightly out of focus for a shallow depth-of-field effect. Subtle shadows and reflections from the

.street environment add realism

Mood: Confident, artistic, mysterious, street-style elegance

Camera Angle: Mid shot (waist-up) from a slightly low perspective

Environment: Urban graffiti-covered wall, layered posters, creative street-art setting

Lighting: Warm ambient tones with natural soft shadows

Style: Realistic cinematic photography, DG fashion urban look, shallow depth of field`;

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