const router = require("express");
const axios = require("axios");

/**
 * جلب معلومات الحساب من API
 * @param {string} uid - معرف الحساب
 * @returns {Promise<object>}
 */
async function getAccountInfo(uid) {
  try {
    const response = await axios.get(`https://gameskinbo.com/api/free_fire_id_checker?uid=${uid}`);
    return response.data;
  } catch (error) {
    throw new Error(`❌ فشل في جلب البيانات: ${error.message}`);
  }
}

/**
 * استخراج الحقول من النص
 * @param {string} text - النص الخام
 * @returns {object}
 */
function extractFields(text) {
  // إزالة العروض الترويجية
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
 *   /api/freefire/account?uid=123456789
 */
router.get("/account", async (req, res) => {
  const uid = req.query.uid;
  
  if (!uid) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال معرف الحساب (UID)"
    });
  }

  try {
    const result = await getAccountInfo(uid);
    
    if (!result || !result.text) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "🚫 لم يتم العثور على الحساب"
      });
    }

    const fields = extractFields(result.text);
    const arabicData = translateKeys(fields);
    
    const output = {
      status: 200,
      success: true,
      data: {
        المعرف: uid,
        صورة_البانر: result.banner_image ? `https://gameskinbo.com${result.banner_image}` : null,
        معلومات_الحساب: arabicData
      }
    };

    res.json(output);
    
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء استخراج معلومات الحساب",
      error: err.message
    });
  }
});

module.exports = {
  path: "/api/games",
  name: "free fire account info",
  type: "games",
  url: `${global.t}/api/games/account?uid=123456789`,
  logo: "https://cdn-icons-png.flaticon.com/512/1378/1378999.png",
  description: "جلب معلومات حساب فري فاير عبر المعرف (UID)",
  router
};