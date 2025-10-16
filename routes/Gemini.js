const express = require("express");
const axios = require("axios");

const router = express.Router();
const validModels = ["openai", "llama", "mistral", "mistral-large"];

router.get("/sandboximg", async (req, res) => {
  const { action = "chatbot", model, prompt} = req.query;
  const selectedModel = model || "openai";

  try {
    if (action === "chatbot") {
      if (!validModels.includes(selectedModel)) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: `النموذج غير صالح. يرجى اختيار أحد النماذج التالية: ${validModels.join(", ")}`
});
}

      const data = {
        messages: [prompt || "Hello!"],
        character: selectedModel
};

      const response = await axios.post("https://chatsandbox.com/api/chat", data, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0",
          "Content-Type": "application/json",
          "accept-language": "id-ID",
          referer: `https://chatsandbox.com/chat/${selectedModel}`,
          origin: "https://chatsandbox.com",
          "alt-used": "chatsandbox.com"
}
});

      return res.status(200).json({
        success: true,
        status: 200,
        data: response.data
});
}

    if (action === "text2img") {
      const data = {
        messages: [prompt || "A default image prompt"],
        character: "ai-image-generator"
};

      const response = await axios.post("https://chatsandbox.com/api/chat", data, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0",
          "Content-Type": "application/json",
          "accept-language": "id-ID",
          referer: "https://chatsandbox.com/ai-image-generator",
          origin: "https://chatsandbox.com",
          "alt-used": "chatsandbox.com"
}
});

      const htmlString = response.data;
      const urlMatch = htmlString.match(/src="([^"]+)"/);

      if (!urlMatch) {
        return res.status(500).json({
          success: false,
          status: 500,
          message: "تعذر استخراج رابط الصورة من الاستجابة."
});
}

      return res.status(200).json({
        success: true,
        status: 200,
        data: {
          imageUrl: urlMatch[1]
}
});
}

    return res.status(400).json({
      success: false,
      status: 400,
      message: "قيمة action غير صالحة. استخدم 'chatbot' أو 'text2img'."
});
} catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: "فشل في تنفيذ الطلب",
      details: error.message
});
}
});

module.exports = {
  path: "/api/ai",
  name: "sandbox",
  type: "ai",
  url: `${global.t}/api/ai/sandboximg?prompt=cat`,
  logo: "https://files.catbox.moe/z3igt5.jpg",
  description: "واجهة متعددة الوظائف من موقع ChatSandbox، تتيح لك إنشاء محادثات ذكية باستخدام نماذج مثل OpenAI وLLaMA، أو توليد صور من وصف نصي باستخدام الذكاء الاصطناعي",
  router
};
