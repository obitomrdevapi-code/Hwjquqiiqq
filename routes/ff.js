const express = require("express");
const axios = require("axios");
const sharp = require("sharp");
const fetch = require("node-fetch");

const router = express.Router();

/**
 * جلب معلومات الحساب من API
 */
async function fetchAccountInfo(uid) {
  const url = `https://hridoy-ff-1.onrender.com/api/info?uid=${uid}`;
  const { data } = await axios.get(url, { timeout: 10000 });
  
  const { credit, ...filteredData } = data;
  return filteredData;
}

/**
 * إنشاء صورة SVG مع المعلومات
 */
function createSVG(accountInfo) {
  const playerName = accountInfo.player || "غير معروف";
  const level = accountInfo.level || "1";
  const tier = accountInfo.tier || "برونزي";
  const exp = accountInfo.exp || "0";
  const gold = accountInfo.gold || "0";
  const diamond = accountInfo.diamond || "0";
  const uid = accountInfo.uid || "غير معروف";

  return `
    <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <!-- الخلفية -->
      <defs>
        <pattern id="bg" patternUnits="userSpaceOnUse" width="800" height="600">
          <image href="https://files.catbox.moe/gg4vsg.jpg" x="0" y="0" width="800" height="600" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      
      <!-- OBITO و WR في الأعلى -->
      <text x="700" y="60" font-family="Arial" font-size="32" font-weight="bold" fill="#FFD700" text-anchor="end">OBITO</text>
      <text x="700" y="100" font-family="Arial" font-size="24" font-weight="bold" fill="#FFFFFF" text-anchor="end">WR</text>
      
      <!-- المعلومات الأساسية -->
      <text x="50" y="150" font-family="Arial" font-size="20" font-weight="bold" fill="#FFD700">PLAYER:</text>
      <text x="200" y="150" font-family="Arial" font-size="20" fill="#FFFFFF">${playerName}</text>
      
      <text x="50" y="190" font-family="Arial" font-size="20" font-weight="bold" fill="#FFD700">LEVEL:</text>
      <text x="200" y="190" font-family="Arial" font-size="20" fill="#FFFFFF">${level}</text>
      
      <text x="50" y="230" font-family="Arial" font-size="20" font-weight="bold" fill="#FFD700">TIER:</text>
      <text x="200" y="230" font-family="Arial" font-size="20" fill="#FFFFFF">${tier}</text>
      
      <text x="50" y="270" font-family="Arial" font-size="20" font-weight="bold" fill="#FFD700">EXP:</text>
      <text x="200" y="270" font-family="Arial" font-size="20" fill="#FFFFFF">${exp}</text>
      
      <text x="50" y="310" font-family="Arial" font-size="18" font-weight="bold" fill="#FFD700">GOLD:</text>
      <text x="200" y="310" font-family="Arial" font-size="18" fill="#FFFFFF">${gold}</text>
      
      <text x="50" y="340" font-family="Arial" font-size="18" font-weight="bold" fill="#FFD700">DIAMOND:</text>
      <text x="200" y="340" font-family="Arial" font-size="18" fill="#FFFFFF">${diamond}</text>
      
      <text x="50" y="370" font-family="Arial" font-size="18" font-weight="bold" fill="#FFD700">UID:</text>
      <text x="200" y="370" font-family="Arial" font-size="18" fill="#FFFFFF">${uid}</text>
    </svg>
  `;
}

/**
 * نقطة النهاية الرئيسية
 */
router.get("/freefire", async (req, res) => {
  const uid = req.query.id;
  
  if (!uid || isNaN(uid) || uid.length < 6) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال ايدي حساب صالح (أرقام فقط)"
    });
  }

  try {
    const info = await fetchAccountInfo(uid);
    
    if (!info || Object.keys(info).length === 0) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "❌ لم يتم العثور على حساب بهذا الـ ID"
      });
    }
    
    // إنشاء SVG
    const svg = createSVG(info);
    
    // تحويل SVG إلى PNG باستخدام sharp
    const imageBuffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();
    
    // إرسال الصورة كرد
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': imageBuffer.length,
      'Cache-Control': 'public, max-age=3600'
    });
    
    res.send(imageBuffer);
    
  } catch (err) {
    console.error('Error:', err.message);
    
    if (err.response?.status === 404) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "❌ الحساب غير موجود"
      });
    }
    
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء معالجة الطلب.",
      error: err.message
    });
  }
});

// نقطة نهاية بديلة تعرض JSON
router.get("/freefire/json", async (req, res) => {
  const uid = req.query.id;
  
  if (!uid || isNaN(uid) || uid.length < 6) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال ايدي حساب صالح (أرقام فقط)"
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
  name: "free fire info image generator",
  type: "info",
  url: `${global.t}/api/info/freefire?id=1010493740`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "إنشاء صورة احترافية لمعلومات حساب فري فاير",
  router,
};