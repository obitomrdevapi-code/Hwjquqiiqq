const express = require("express");
const fetch = require("node-fetch");

const router = express.Router();

/**
 * توليد فيديو باستخدام Sora-2 API
 * @param {string} prompt
 * @returns {Promise<object>}
 */
async function generateVideo(prompt) {
  if (!prompt || prompt.length < 3) {
    return { status: false, message: "يرجى إدخال وصف نصي مناسب."};
}

  try {
    const createJob = await fetch("https://omegatech-api.dixonomega.tech/api/ai/sora2-create", {
      method: "POST",
      headers: { "Content-Type": "application/json"},
      body: JSON.stringify({ prompt})
}).then(r => r.json());

    if (!createJob?.checkStatus) {
      return { status: false, message: "فشل في إنشاء المهمة."};
}

    const { checkStatus} = createJob;
    let videoUrl, done = false;

    for (let i = 0; i < 80; i++) {
      const status = await fetch(checkStatus).then(r => r.json()).catch(() => ({}));
      if (status.status === "done" && status.videoUrl) {
        videoUrl = status.videoUrl;
        done = true;
        break;
}
      if (status.status === "failed") break;
      await new Promise(r => setTimeout(r, 5000));
}

    if (!done) {
      return { status: false, message: "المهمة لم تكتمل أو فشلت."};
}

    return {
      status: true,
      prompt,
      video: videoUrl
};

} catch (err) {
    console.error("[ERROR] أثناء توليد الفيديو:", err.message);
    return { status: false, message: "حدث خطأ أثناء توليد الفيديو."};
}
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/sora?q=a cat playing piano
 */
router.get("/sora", async (req, res) => {
  const { q} = req.query;
  const prompt = q || "";

  const result = await generateVideo(prompt);
  if (!result.status) {
    return res.status(500).json({
      status: false,
      message: result.message
});
}

  res.json({
    status: true,
    prompt: result.prompt,
    video: result.video
});
});

module.exports = {
  path: "/api/tst",
  name: "Sora Video",
  type: "tst",
  url: `${global.t}/api/tst/sora?q=a cat playing piano`,
  logo: "",
  description: "توليد فيديوهات بالذكاء الاصطناعي باستخدام Sora-2",
  router
};
