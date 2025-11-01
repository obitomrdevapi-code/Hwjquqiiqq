// بسم الله الرحمن الرحيم ✨
// Free Fire Account Scraper API
// استخراج معلومات الحساب من موقع gameskinbo.com
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const router = express.Router();

/**
- جلب معلومات الحساب من الموقع
- @param {string} uid - معرف الحساب
- @returns {Promise<object>}
*/
async function fetchAccountInfo(uid) {
const { data } = await axios.get(`https://gameskinbo.com/api/free_fire_id_checker?uid=${uid}`);
return data;
}

/**
- استخراج الحقول من النص
- @param {string} text - النص المحتوي على الحقول
- @returns {object}
*/
function extractFields(text) {
const fields = {};
const lines = text.split("\n");
lines.forEach((line) => {
const match = line.match(/├─ **(.+?):** `(.*?)`/);
if (match) {
const key = match[1].trim();
const value = match[2].trim();
fields[key] = value;
}
});
return fields;
}

/**
- ترجمة المفاتيح إلى العربية
- @param {object} data - البيانات باللغة الإنجليزية
- @returns {object}
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
Object.keys(data).forEach((key) => {
const arabicKey = translations[key] || key;
translated[arabicKey] = data[key];
});
return translated;
}

/**
- نقطة النهاية الرئيسية
- مثال:
- /api/free-fire/account?uid=123456789
*/
router.get("/account", async (req, res) => {
const uid = req.query.uid;
if (!uid) {
return res.status(400).json({
status: 400,
success: false,
message: "⚠️ يرجى إدخال معرف الحساب"
});
}
try {
const result = await fetchAccountInfo(uid);
if (!result) {
return res.status(404).json({
status: 404,
success: false,
message: "🚫 الحساب غير موجود"
});
}
const rawText = result.text;
const banner = result.banner_image;
const fields = extractFields(rawText);
const arabicData = translateKeys(fields);
const output = {
المعرف: uid,
صورة_البانر: banner ? `https://gameskinbo.com${banner}` : null,
معلومات_الحساب: arabicData
};
res.json({
status: 200,
success: true,
data: output
});
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
path: "/api/free-fire",
name: "free fire account",
type: "free-fire",
url: `${global.t}/api/free-fire/account?uid=123456789`,
logo: "https://qu.ax/obitoajajq.png",
description: "جلب معلومات حساب Free Fire عبر معرف الحساب",
router
};