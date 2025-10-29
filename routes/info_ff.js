// بسم الله الرحمن الرحيم ✨
// Free Fire Account Info Scraper API
// استخراج معلومات حساب فري فاير من API خارجي

const express = require("express");
const axios = require("axios");

const router = express.Router();

/**
 * جلب معلومات الحساب من API
 * @param {string} uid - رقم الحساب
 * @returns {Promise<object>}
 */
async function fetchAccountInfo(uid) {
  const url = `https://hridoy-ff-1.onrender.com/api/info?uid=${uid}`;
  const { data} = await axios.get(url);

  // إزالة حقل credit من الاستجابة
  const { credit,...filteredData} = data;
  return filteredData;
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/freefire/info?id=123456789
 */
router.get("/info", async (req, res) => {
  const uid = req.query.id;
  if (!uid) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال ايدي حساب صالح"
});
}

  try {
    const info = await fetchAccountInfo(uid);
    res.json({
      status: 200,
      success: true,
      account: info
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء استخراج معلومات الحساب.",
      error: err.message
});
}
});

module.exports = {
  path: "/api/info",
  name: "freefire account info",
  type: "info",
  url: `${global.t}/api/info/freefire?id=1010493740`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "جلب معلومات حساب فري فاير عبر ايدي الحساب",
  router
};
