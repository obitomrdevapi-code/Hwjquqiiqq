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

router.get("/freefire2", async (req, res) => {
  const uid = req.query.id;
  if (!uid ||!/^\d+$/.test(uid)) {
    return res.status(400).send("⚠️ يرجى إدخال ايدي حساب صالح");
}

  try {
    const info = await fetchAccountInfo(uid);
    const background = await loadImage("https://files.catbox.moe/gg4vsg.jpg");
    const canvas = createCanvas(background.width, background.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(background, 0, 0);

    ctx.font = "30px sans-serif";
    ctx.fillStyle = "#00ffff";
    ctx.textAlign = "left";

    ctx.fillText(`ID: ${info.id}`, 50, 100);
    ctx.fillText(`Level: ${info.level}`, 50, 150);
    ctx.fillText(`Trophy: ${info.trophy}`, 50, 200);
    ctx.fillText(`Status: ${info.status}`, 50, 250);
    ctx.fillText(`Rank: ${info.rank}`, 50, 300);
    ctx.fillText(`Victories: ${info.victoire}`, 50, 350);

    res.setHeader("Content-Type", "image/png");
    canvas.pngStream().pipe(res);

} catch (err) {
    res.status(500).send("❌ حدث خطأ أثناء استخراج أو توليد الصورة.");
}
});

module.exports = {
  path: "/api/info",
  name: "free fire info image",
  type: "info",
  url: `${global.t}/api/info/freefire2?id=1010493740`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "عرض معلومات حساب فري فاير كصورة مركبة على خلفية",
  router
};