
const express = require("express");
const fetch = require("node-fetch");

const router = express.Router();

/**
 * إنشاء فيديو باستخدام نموذج Sora-2
 * @param {string} prompt
 * @returns {Promise<object>}
 */
async function generateSoraVideo(prompt = "") {
  if (!prompt || prompt.length < 3) {
    return { status: false, message: "يرجى إدخال وصف مناسب للفيديو."};
}

  try {
    // إنشاء المهمة
    const createJob = await fetch("https://omegatech-api.dixonomega.tech/api/ai/sora2-create", {
      method: "POST",
      headers: { "Content-Type": "application/json"},
      body: JSON.stringify({ prompt})
}).then(res => res.json());

    if (!createJob?.checkStatus) {
      return { status: false, message: "فشل إنشاء المهمة."};
}

    const { checkStatus} = createJob;
    let videoUrl = null;

    // التحقق من حالة المهمة (polling)
    for (let i = 0; i < 80; i++) {
      const status = await fetch(checkStatus).then(res => res.json()).catch(() => ({}));

      if (status.status === "done" && status.videoUrl) {
        videoUrl = status.videoUrl;
        break;
}

      if (status.status === "failed") {
        return { status: false, message: "فشل في توليد الفيديو."};
}

      await new Promise(r => setTimeout(r, 5000));
}

    if (!videoUrl) {
      return { status: false, message: "لم يتم توليد الفيديو بعد. حاول لاحقًا."};
}

    return {
      status: true,
      prompt,
      video: videoUrl
};

} catch (err) {
    console.error("[ERROR] فشل توليد الفيديو:", err.message);
    return { status: false, message: "حدث خطأ أثناء توليد الفيديو."};
}
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/sora2?prompt=a cat playing piano
 */
router.get("/sora2", async (req, res) => {
  const { prompt} = req.query;

  const result = await generateSoraVideo(prompt);
  if (!result.status) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: result.message
});
}

  res.json({
    status: 200,
    success: true,
    prompt: result.prompt,
    video: result.video
});
});

module.exports = {
  path: "/api/ai",
  name: "Sora-2 Video",
  type: "ai",
  url: `${global.t}/api/ai/sora2?prompt=a cat playing piano`,
  logo: "",
  description: "إنشاء فيديوهات بالذكاء الاصطناعي باستخدام نموذج Sora-2",
  router
};
