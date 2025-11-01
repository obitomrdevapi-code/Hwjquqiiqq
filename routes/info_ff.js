// بسم الله الرحمن الرحيم ✨
// Free Fire Account Info Scraper API
// استخراج معلومات حساب فري فاير من موقع gameskinbo.com

const express = require("express");
const axios = require("axios");

const router = express.Router();

/**
 * جلب معلومات الحساب من API
 * @param {string} uid - رقم الحساب
 * @returns {Promise<object>}
 */
async function fetchAccountInfo(uid) {
  const url = `https://gameskinbo.com/api/free_fire_id_checker?uid=${uid}`;
  const { data } = await axios.get(url);
  return data;
}

/**
 * استخراج الحقول من النص
 * @param {string} text - النص الخام
 * @returns {object}
 */
function extractFields(text) {
  if (!text) return {};
  
  const cleanText = text.split("🎆 Diwali Special Offer 🎆")[0];
  const fields = {};
  const lines = cleanText.split("\n");
  
  for (const line of lines) {
    const match = line.match(/├─ \*\*(.+?):\*\* `(.*?)`/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      fields[key] = value;
    }
  }
  
  return fields;
}

/**
 * ترجمة المفاتيح إلى العربية
 * @param {object} data - البيانات بالإنجليزية
 * @returns {object}
 */
function translateKeys(data) {
  const translations = {
    "Total Diamonds Topped Up & Claimed": "إجمالي الألماس",
    "Prime Level": "المستوى المميز",
    "Name": "الاسم",
    "UID": "المعرف",
    "Level": "المستوى",
    "Region": "المنطقة",
    "Likes": "الإعجابات",
    "Honor Score": "نقاط الشرف",
    "Celebrity Status": "الشهرة",
    "Title": "اللقب",
    "Signature": "التوقيع",
    "Most Recent OB": "آخر إصدار",
    "Booyah Pass": "بطاقة بووياه",
    "Current BP Badges": "شارات بووياه",
    "BR Rank": "رتبة BR",
    "CS Points": "نقاط CS",
    "CS Peak Points": "أعلى نقاط CS",
    "Created At": "تاريخ الإنشاء",
    "Last Login": "آخر دخول",
    "Avatar ID": "الصورة الرمزية",
    "Banner ID": "البانر",
    "Pin ID": "الشارة",
    "Equipped Skills": "المهارات",
    "Equipped Gun ID": "السلاح",
    "Equipped Animation ID": "الحركة",
    "Transform Animation ID": "التحول",
    "Equipped?": "هل الحيوان مجهز؟",
    "Pet Name": "اسم الحيوان",
    "Pet Type": "نوع الحيوان",
    "Pet Exp": "خبرة الحيوان",
    "Pet Level": "مستوى الحيوان",
    "Guild Name": "اسم النقابة",
    "Guild ID": "معرف النقابة",
    "Guild Level": "مستوى النقابة",
    "Guild Members": "أعضاء النقابة",
    "Leader Name": "اسم القائد",
    "Leader UID": "معرف القائد",
    "Leader Level": "مستوى القائد",
    "Leader Created At": "تاريخ إنشاء القائد",
    "Leader Last Login": "آخر دخول للقائد",
    "Leader Title": "لقب القائد",
    "Leader Current BP Badges": "شارات القائد",
    "Leader BR Points": "نقاط BR للقائد",
    "Leader Cs Points": "نقاط CS للقائد"
  };

  const translated = {};
  for (const [key, value] of Object.entries(data)) {
    const arabicKey = translations[key] || key;
    translated[arabicKey] = value;
  }
  
  return translated;
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/info/freefire?id=123456789
 */
router.get("/freefire", async (req, res) => {
  const uid = req.query.id;
  if (!uid) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال ايدي حساب صالح"
    });
  }

  try {
    const result = await fetchAccountInfo(uid);
    
    if (!result || !result.text) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "🚫 لم يتم العثور على الحساب"
      });
    }

    const fields = extractFields(result.text);
    const arabicData = translateKeys(fields);
    
    const info = {
      المعرف: uid,
      صورة_البانر: result.banner_image ? `https://gameskinbo.com${result.banner_image}` : null,
      معلومات_الحساب: arabicData
    };

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