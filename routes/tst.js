const express = require("express");
const { createCanvas, loadImage} = require("canvas");
const arabicReshaper = require("arabic-reshaper");
const bidi = require("bidi-js");

const router = express.Router();

router.get("/levelup", async (req, res) => {
  const { profile, name, lvl1, lvl2} = req.query;

  if (!profile ||!name ||!lvl1 ||!lvl2) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "❌ يجب توفير جميع البارامترات: profile, name, lvl1, lvl2",
});
}

  try {
    const canvas = createCanvas(800, 250);
    const ctx = canvas.getContext("2d");

    const bg = await loadImage("https://i.postimg.cc/FstkPXKk/1761952083345.jpg");
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    const avatar = await loadImage(profile);
    ctx.save();
    ctx.beginPath();
    ctx.arc(125, 125, 75, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 50, 50, 150, 150);
    ctx.restore();

    const reshaped = arabicReshaper.reshape(name);
    const bidiText = bidi.getEmbeddingLevels(reshaped).text;

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(bidiText, 750, 80);

    ctx.font = "24px sans-serif";
    ctx.fillText(`المستوى السابق: ${lvl1}`, 750, 130);
    ctx.fillText(`المستوى الحالي: ${lvl2}`, 750, 180);

    res.setHeader("Content-Type", "image/png");
    res.send(canvas.toBuffer("image/png"));
} catch (err) {
    console.error("[ERROR] فشل إنشاء الصورة:", err.message);
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء توليد الصورة 🚫",
      error: err.message,
});
}
});

module.exports = {
  path: "/api/tools",
  name: "Level Up Image",
  type: "tools",
  url: `${global.t}/api/tools/levelup?profile=رابط&name=اسم&lvl1=1&lvl2=2`,
  logo: "https://i.ibb.co/m53WF9N/avatar-contact.png",
  description: "تست",
  router,
};