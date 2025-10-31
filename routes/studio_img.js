const express = require("express");
const axios = require("axios");

const router = express.Router();

const prompts = {
  1: "A realistic urban portrait of a young man standing confidently in front of a vibrant graffiti wall filled with layered posters, colorful street art, and abstract textures. The background features overlapping paper textures, torn advertisements, and expressive paint splashes - creating a chaotic yet artistic urban aesthetic. The man wears light beige casual clothes - a stylish overshirt and matching trousers from Dolce & Gabbana (DG) - accessorized with modern black sunglasses and minimal jewelry. His arms are crossed, and his expression is calm yet assertive, radiating confidence and urban coolness. Lighting is soft and cinematic, emphasizing the contours of his face and clothes, with warm tones highlighting his silhouette while the graffiti background remains slightly out of focus for a shallow depth-of-field effect. Subtle shadows and reflections from the street environment add realism. Mood: Confident, artistic, mysterious, street-style elegance. Camera Angle: Mid shot (waist-up) from a slightly low perspective. Environment: Urban graffiti-covered wall, layered posters, creative street-art setting. Lighting: Warm ambient tones with natural soft shadows. Style: Realistic cinematic photography, DG fashion urban look, shallow depth of field.",
  2: "A hyper-realistic cinematic photo of a man sitting on top of broken cars in an abandoned junkyard. He’s wearing wide-leg black pants, an oversized beige hoodie, and white sneakers. He’s sitting with one knee up, leaning forward slightly, looking straight at the camera with a confident, relaxed expression. Dust and sunlight cut through the smoky air, graffiti walls behind, cinematic street rap aesthetic.",
  3: "User-uploaded photo Image Size: half body Face & Body: 100% original, no alterations Body Type: messy Hair over eyes 100% original Height: 5'8\" (173 cm) Resolution 7K: Cinematic image of a slim man standing beside the marble archway in the Topkapi Palace Garden, Istanbul. Outfit: oversized cream-colored printed shirt over Brown coat. black trousers, gold-rim sunglasses, wristwatch. Brown boots. Pose: sitting brown sofa slidely under the middle of cinematic arch column, a white bird sitting on his side over sofa looking away thoughtfully; sunlight filtering on body, face.",
  4: "Create a hyper-cinematic portrait using 100% of the face from the uploaded photo. A strikingly handsome young man in his late twenties with jet-black hair and a neatly trimmed black beard stands alone in a desolate snowy forest. He wears a heavy black wool peacoat with the collar sharply popped over a sleek black turtleneck. Round sunglasses conceal his eyes, but his jawline and expression radiate a cold, brooding intensity as he stares straight at the camera. Around him, a flock of black crows erupts into mid-flight, wings blurred with motion, slicing through the misty air and adding raw movement to the stillness of the snow. Soft overcast winter light filters through the barren trees, illuminating the fine textures of his coat and the delicate snowflakes dusting his shoulders. The background falls into a shallow blur, isolating him with cinematic precision. Shot as if on a DSLR with an 85mm prime lens, the image is rendered in 8K ultra-realism, moody and atmospheric, balancing sharp detail with painterly depth. A perfect blend of photorealism and dramatic storytelling keep my face 100% matching.",
  5: "A handsome young Indian man with a well-groomed beard and stylish hair is captured in a dynamic shot, descending an outdoor staircase with metal railings. He is dressed in a casual yet fashionable outfit: a light olive-green quarter-zip sweatshirt over a beige t-shirt, light grey cargo pants, and white sneakers. He holds a pair of sunglasses in his right hand, and his gaze is directed to the right, slightly upwards, suggesting he is looking at something off-camera. The background is a soft blur."
};

class GemBananaAI {
  constructor() {
    this.base = "https://efnlaalbmjngrdoessky.supabase.co/functions/v1";
    this.token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbmxhYWxibWpuZ3Jkb2Vzc2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NzA2MjMsImV4cCI6MjA3NTQ0NjYyM30.1Fk6Fl0RiB5a4h_KBSEqRocK_61vYRN-1v36eeZznbQ";
}

  headers() {
    return {
      accept: " _/_ ",
      authorization: `Bearer ${this.token}`,
      "content-type": "application/json",
      origin: "https://geminibanana.fun",
      referer: "https://geminibanana.fun/",
      "user-agent": "Mozilla/5.0",
};
}

  async generate({ prompt, imageUrl}) {
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

router.get("/studio_img", async (req, res) => {
  const { img, number_prompt} = req.query;

  if (!img ||!number_prompt ||!prompts[number_prompt]) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "يرجى إدخال?img= و?number_prompt= صحيح",
});
}

  try {
    const api = new GemBananaAI();
    const prompt = prompts[number_prompt];
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
      prompt_number: number_prompt,
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

router.get("/studio_img_list", (req, res) => {
  const list = Object.entries(prompts).map(([key, value]) => ({
    number: key,
    title: value.split(".")[0].slice(0, 100) + "...",
}));

  res.json({
    status: 200,
    success: true,
    total: list.length,
    prompts: list,
});
});

module.exports = {
  path: "/api/ai",
  name: "Studio img ai",
  type: "ai",
  url: `${global.t}/api/ai/studio_img?img=https://files.catbox.moe/kxn61f.jpg&number_prompt=1`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "عمل نموذج ل صورتك بإحترافيه",
  router,
};