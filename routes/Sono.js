const express = require("express");
const axios = require("axios");
const { v4: uuidv4} = require("uuid");

const router = express.Router();

/**
 * توليد سلسلة عشوائية لتتبع Suno
 */
function randomHex(length) {
  const chars = "abcdef0123456789";
  return Array.from({ length}, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function gieneticTrace() {
  return `${randomHex(32)}-${randomHex(16)}`;
}

/**
 * تسجيل الدخول إلى Suno API
 */
async function login(deviceId) {
  const res = await axios.post("https://api.sunora.mavtao.com/api/auth/login", {
    device_id: deviceId
}, {
    headers: {
      "user-agent": "Dart/3.4 (gienetic_build)",
      "version": "2.2.2",
      "accept-encoding": "gzip",
      "content-type": "application/json",
      "buildnumber": "105",
      "platform": "android",
      "sentry-trace": gieneticTrace()
}
});
  return res.data?.data?.token || null;
}

/**
 * إرسال طلب توليد الأغنية
 */
async function triggerGeneration(token, payload) {
  const isCustom = 'prompt' in payload;
  const url = isCustom
? "https://api.sunora.mavtao.com/api/music/custom_generate"
: "https://api.sunora.mavtao.com/api/music/advanced_custom_generate";

  await axios.post(url, payload, {
    headers: {
      "user-agent": "Dart/3.4 (gienetic_build)",
      "version": "2.2.2",
      "accept-encoding": "gzip",
      "x-auth": token,
      "content-type": "application/json",
      "buildnumber": "105",
      "platform": "android",
      "sentry-trace": gieneticTrace()
}
});
}

/**
 * انتظار نتيجة التوليد
 */
async function pollForResult(xAuth, maxAttempts = 30, delayMs = 20000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await axios.get("https://api.sunora.mavtao.com/api/music/music_page?page=1&pagesize=50", {
        headers: {
          "user-agent": "Dart/3.4 (gienetic_build)",
          "version": "2.2.2",
          "accept-encoding": "gzip",
          "x-auth": xAuth,
          "buildnumber": "105",
          "platform": "android",
          "sentry-trace": gieneticTrace()
}
});

      const records = res.data?.data?.records || [];
      const doneSongs = records.filter(r => r.status === "complete");

      if (doneSongs.length> 0) {
        return doneSongs.map(r => ({
          id: r.song_id,
          title: r.title || "Untitled",
          tags: r.meta_tags,
          prompt: r.meta_prompt,
          audioUrl: r.audio_url,
          videoUrl: r.video_url,
          imageUrl: r.image_url,
          model: r.model_name
}));
}
} catch (err) {
      console.error(`Polling attempt ${attempt} failed:`, err.response?.data || err.message);
}
    await new Promise(resolve => setTimeout(resolve, delayMs));
}
  throw new Error("Song generation timed out after several attempts.");
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/suno?q=a cinematic pop song about a hero's journey
 */
router.get("/suno", async (req, res) => {
  const { q} = req.query;
  const text = q || "";

  if (!text) {
    return res.status(400).json({
      status: false,
      message: "يرجى إدخال وصف أو صيغة توليد للأغنية."
});
}

  try {
    const deviceId = uuidv4();
    const token = await login(deviceId);
    if (!token) throw new Error("فشل تسجيل الدخول إلى Suno API.");

    let payload;

    if (text.startsWith('--lyrics')) {
      const parts = text.replace('--lyrics', '').trim().split('|');
      if (parts.length < 3) throw new Error("صيغة --lyrics غير صحيحة. استخدم: [STYLE]|[TITLE]|[LYRICS]");
      const [style, title, lyrics] = parts;
      payload = {
        continue_at: null, continue_clip_id: null, mv: null,
        prompt: lyrics,
        title,
        tags: style
};
} else if (text.startsWith('--instrumental')) {
const description = text.replace('--instrumental', '').trim();
      if (!description) throw new Error("يرجى إدخال وصف للموسيقى الآلية.");
      payload = {
        continue_at: null, continue_clip_id: null, mv: null,
        description,
        title: "", mood: "", music_style: "",
        instrumental_only: true
};
} else {
      payload = {
        continue_at: null, continue_clip_id: null, mv: null,
        description: text,
        title: "", mood: "", music_style: "",
        instrumental_only: false
};
}

    await triggerGeneration(token, payload);
    const results = await pollForResult(token);

    if (results.length === 0) {
      return res.status(404).json({
        status: false,
        message: "لم يتم توليد أي أغنية. حاول بوصف مختلف."
});
}

    res.json({
      status: true,
      total: results.length,
      query: text,
      results
});

} catch (err) {
    console.error("[ERROR] Suno AI:", err.message);
    res.status(500).json({
      status: false,
      message: "حدث خطأ أثناء توليد الأغنية.",
      error: err.message
});
}
});

module.exports = {
  path: "/api/ai",
  name: "Suno AI Song",
  type: "ai",
  url: `${global.t}/api/ai/suno?q=a cinematic pop song about a heros journey`,
  logo: "",
  description: "توليد أغاني وموسيقى باستخدام Suno AI من وصف أو كلمات مخصصة",
  router
};
