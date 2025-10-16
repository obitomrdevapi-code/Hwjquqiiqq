const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/cai", async (req, res) => {
  const { prompt, text} = req.query;

  if (!prompt ||!text) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "يرجى إدخال كل من prompt و text!"
});
}

  try {
    const response = await chat(prompt, text);

    return res.status(200).json({
      status: 200,
      success: true,
      data: response
});
} catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء معالجة الطلب",
      details: error.message
});
}
});

async function chat(prompt, text) {
  const response = await axios({
    method: "POST",
    url: "https://chateverywhere.app/api/chat",
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://chateverywhere.app",
      "Referer": "https://chateverywhere.app/id",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36"
},
    data: {
      model: {
        id: "gpt-3.5-turbo-0613",
        name: "GPT-3.5",
        maxLength: 12000,
        tokenLimit: 4000
},
      prompt,
      messages: [
        {
          pluginId: null,
          content: text,
          role: "user"
}
      ]
}
});

  return response.data;
}

module.exports = {
  path: "/api/ai",
  name: "ai character",
  type: "ai",
  url: `${global.t}/api/ai/cai?prompt=شخصية%20مرشدة&text=مرحبا`,
  logo: "https://i.ibb.co/bjSWtGGS/uploaded-image.jpg",
  description: "إنشاء محادثة ذكية مع شخصية مخصصة باستخدام نموذج GPT-3.5",
  router
};
