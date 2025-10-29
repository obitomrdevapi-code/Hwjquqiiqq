const express = require("express");
const axios = require("axios");
const { createCanvas, loadImage, registerFont } = require("canvas");
const path = require("path");

const router = express.Router();

// إعداد الخطوط (يمكنك إضافة خطوط عربية إذا احتجت)
// registerFont('path/to/arabic-font.ttf', { family: 'Arabic' });

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
 * إنشاء الصورة مع المعلومات
 */
async function createInfoImage(accountInfo) {
  // تحميل الصورة الخلفية
  const backgroundUrl = "https://files.catbox.moe/gg4vsg.jpg";
  const background = await loadImage(backgroundUrl);
  
  // إنشاء canvas بنفس أبعاد الصورة الخلفية
  const canvas = createCanvas(background.width, background.height);
  const ctx = canvas.getContext('2d');
  
  // رسم الصورة الخلفية
  ctx.drawImage(background, 0, 0);
  
  // إعدادات النص
  const textColor = "#FFFFFF"; // أبيض
  const accentColor = "#FFD700"; // ذهبي
  const fontSizeLarge = 36;
  const fontSizeMedium = 28;
  const fontSizeSmall = 22;
  
  ctx.fillStyle = textColor;
  ctx.textAlign = "left";
  
  // المعلومات الأساسية المستخرجة
  const playerName = accountInfo.player || "غير معروف";
  const level = accountInfo.level || "1";
  const tier = accountInfo.tier || "برونزي";
  const exp = accountInfo.exp || "0";
  const gold = accountInfo.gold || "0";
  const diamond = accountInfo.diamond || "0";
  const uid = accountInfo.uid || "غير معروف";
  
  // إعداد الخطوط
  ctx.font = `bold ${fontSizeLarge}px Arial`;
  
  // رسم المعلومات في مواقع محددة بناءً على الصورة
  
  // اسم اللاعب (أعلى اليسار)
  ctx.fillStyle = accentColor;
  ctx.fillText(`PLAYER: ${playerName}`, 50, 80);
  
  // المستوى
  ctx.fillStyle = textColor;
  ctx.font = `bold ${fontSizeMedium}px Arial`;
  ctx.fillText(`LEVEL: ${level}`, 50, 130);
  
  // الرتبة
  ctx.fillText(`TIER: ${tier}`, 50, 180);
  
  // الـ EXP
  ctx.fillText(`EXP: ${exp}`, 50, 230);
  
  // العملات
  ctx.font = `bold ${fontSizeSmall}px Arial`;
  ctx.fillText(`GOLD: ${gold}`, 50, 280);
  ctx.fillText(`DIAMOND: ${diamond}`, 50, 310);
  
  // UID
  ctx.fillStyle = accentColor;
  ctx.font = `bold ${fontSizeSmall}px Arial`;
  ctx.fillText(`UID: ${uid}`, 50, 350);
  
  // إضافة تأثيرات ظل للنص لجعله أكثر وضوحاً
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  
  return canvas.toBuffer('image/jpeg', { quality: 0.9 });
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
    
    // إنشاء الصورة
    const imageBuffer = await createInfoImage(info);
    
    // إرسال الصورة كرد
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Length': imageBuffer.length,
      'Cache-Control': 'public, max-age=3600' // تخزين مؤقت لمدة ساعة
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

// نقطة نهاية بديلة تعرض JSON إذا احتاج المستخدم
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
    
    if (!info || Object.keys(info).length === 0) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "❌ لم يتم العثور على حساب بهذا الـ ID"
      });
    }
    
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