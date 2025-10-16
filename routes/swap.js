

const express = require('express');
const axios = require('axios');
const { v4: uuidv4} = require('uuid');
const router = express.Router();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

router.get('/faceswap', async (req, res) => {
  const { img1, img2} = req.query;

  if (!img1 ||!img2) {
    return res.status(400).json({ code: 1, msg: 'يرجى إدخال رابطين عبر?img1= و?img2='});
}

  const API_URL = 'https://supawork.ai/supawork/headshot/api';
  const MAX_RETRIES = 10;
  const RETRY_DELAY = 5000;

  const headers = {
    accept: 'application/json',
    'accept-language': 'id;q=0.5',
    authorization: 'null',
    'content-type': 'application/json',
    origin: 'https://supawork.ai',
    referer: 'https://supawork.ai/ai-face-swap',
    'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Brave";v="134"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'user-agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36'
};

  try {
    const identityID = uuidv4();
    const postData = {
      aigc_app_code: 'face_swap_single',
      face_swap_type: 'single',
      target_image_url: img1,
      target_face_url: img2,
      identity_id: identityID,
      currency_type: 'silver'
};

    const postRes = await axios.post(`${API_URL}/fs/faceswap`, postData, { headers});

    if (postRes.data.code!== 100000) {
      return res.status(500).json({ code: 1, msg: postRes.data.message || 'فشل في إرسال الطلب'});
}

    for (let i = 0; i < MAX_RETRIES; i++) {
      await delay(RETRY_DELAY);

      const getRes = await axios.get(`${API_URL}/media/aigc/result/list/v1`, {
        headers,
        params: {
          page_no: 1,
          page_size: 20,
          identity_id: identityID
}
});

      if (getRes.data.code!== 100000) {
        return res.status(500).json({ code: 1, msg: getRes.data.message || 'فشل في جلب النتيجة'});
}

      const found = getRes.data.data.list.find(
        (item) =>
          item.list[0].input_urls.includes(img1) &&
          item.list[0].input_urls.includes(img2) &&
          item.list[0].status === 1
);

      if (found) {
        return res.status(200).json({
          code: 0,
          msg: 'success',
          img1,
          img2,
          result: found.list[0].url[0]
});
}
}

    res.status(504).json({ code: 1, msg: 'انتهى الوقت دون الحصول على الصورة، تحقق من الجواهر أو الروابط'});
} catch (err) {
    res.status(500).json({ code: 1, msg: 'خطأ أثناء تنفيذ العملية', error: err.message});
}
});

// بديل: استخدام متغير بيئة أو قيمة ثابتة
const BASE_URL = process.env.BASE_URL || 'https://obito-mr-apis.vercel.app';

module.exports = {
  path: "/api/ai",
  name: "Face Swap Generator", 
  type: "ai",
  url: `${BASE_URL}/api/ai/faceswap?img1=https://h.uguu.se/djKYnPLK.jpg&img2=https://d.uguu.se/yWAhYEGe.jpg`,
  logo: "https://files.catbox.moe/obitoface.jpg",
  description: "تبديل الوجه بين صورتين باستخدام Supawork Face Swap API.",
  router
};
