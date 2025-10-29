const express = require("express");
const axios = require("axios");
const { createCanvas, loadImage} = require("canvas");
const router = express.Router();

async function fetchAccountInfo(uid) {
  const url = `https://hridoy-ff-1.onrender.com/api/info?uid=${uid}`;
  const { data} = await axios.get(url);
  const { credit,...filteredData} = data;
  return filteredData;
}

router.get("/freefire_2", async (req, res) => {
  const uid = req.query.id;
  if (!uid ||!/^\d+$/.test(uid)) {
    return res.status(400).send("⚠️ يرجى إدخال ايدي حساب صالح");
}

  try {
    const info = await fetchAccountInfo(uid);

    // تحميل الخلفية
    const background = await loadImage("https://files.catbox.moe/gg4vsg.jpg");
    const canvas = createCanvas(background.width, background.height);
    const ctx = canvas.getContext("2d");

    // رسم الخلفية
    ctx.drawImage(background, 0, 0);

    // إعداد النص
    ctx.font = "28px Arial";
    ctx.fillStyle = "#00ffff"; // لون مناسب للخلفية
    ctx.textAlign = "left";

    // كتابة المعلومات
    const lines = [
      `ID: ${info.id}`,
      `Level: ${info.level}`,
      `Trophy: ${info.trophy}`,
      `Status: ${info.status}`,
      `Rank: ${info.rank}`,
      `Victories: ${info.victoire}`,
      `Country: ${info.country || "غير محدد"}`
    ];

    lines.forEach((line, i) => {
      ctx.fillText(line, 50, 100 + i * 40); // تعديل الإحداثيات حسب التصميم
});

    // إرسال الصورة
    res.setHeader("Content-Type", "image/png");
    canvas.pngStream().pipe(res);

} catch (err) {
    res.status(500).send("❌ حدث خطأ أثناء استخراج أو توليد الصورة.");
}
});

module.exports = {
  path: "/api/info",
  name: "freefire info 2",
  type: "info",
  url: `${global.t}/api/info/freefire_2?id=1010493740`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "عرض معلومات حساب فري فاير فاير تنسيق صوره",
  router
};