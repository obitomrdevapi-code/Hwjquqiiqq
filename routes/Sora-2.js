
const express = require("express");
const { createServer} = require("@ansonzeng/sora-video-mcp-server");

const router = express.Router();

/**
 * توليد فيديو باستخدام مكتبة Sora MCP
 * @param {string} prompt
 * @returns {Promise<object>}
 */
async function generateVideo(prompt) {
  if (!prompt || prompt.length < 3) {
    return { status: false, message: "يرجى إدخال وصف نصي مناسب."};
}

  try {
    // إنشاء السيرفر المحلي للموديل
    const sora = await createServer({
      model: "sora-2",
      orientation: "landscape",
      duration: 8
});

    // إنشاء المهمة
    const job = await sora.createVideo({ prompt});

    // انتظار النتيجة
    const result = await sora.waitForCompletion(job.id);

    if (!result ||!result.videoUrl) {
      return { status: false, message: "لم يتم توليد الفيديو أو لم يكتمل بعد."};
}

    return {
      status: true,
      prompt,
      video: result.videoUrl
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
      status: 500,
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
  name: "Sora Video",
  type: "ai",
  url: `${global.t}/api/ai/sora?q=a cat playing piano`,
  logo: "",
  description: "توليد فيديوهات بالذكاء الاصطناعي باستخدام Sora",
  router
};
