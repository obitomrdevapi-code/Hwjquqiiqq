const express = require("express");
const canvafy = require("canvafy");
const axios = require("axios");

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
    const image = await new canvafy.LevelUp()
.setAvatar(profile)
.setBackground("image", "https://i.postimg.cc/FstkPXKk/1761952083345.jpg")
.setUsername(name)
.setBorder("#000000")
.setAvatarBorder("#00ff00")
.setOverlayOpacity(0.7)
.setLevels(Number(lvl1), Number(lvl2))
.build();

    res.setHeader("Content-Type", "image/png");
    res.send(image);
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