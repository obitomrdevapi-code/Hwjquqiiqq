// بسم الله الرحمن الرحيم ✨
// Gmail OSINT Scraper API
// تحويل من سكربت داخلي إلى Express API

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * استخراج بيانات حساب Gmail من خدمة gmail-osint.activetk.jp
 * @param {string} email - البريد الإلكتروني المطلوب فحصه
 * @returns {Promise<object>}
 */
async function fetchGmailProfile(email) {
  const username = email.split("@")[0];
  const payload = new URLSearchParams({ q: username, domain: "gmail.com"});

  try {
    const response = await axios.post("https://gmail-osint.activetk.jp/", payload, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Postify/1.0.0"
},
      timeout: 10000
});

    const $ = cheerio.load(response.data);
    const text = $("pre").text();

    const extract = (regex, defaultValue = "No data", checkNotFound = false) => {
      const result = (text.match(regex) || [null, defaultValue])[1].trim();
      return checkNotFound && result === "Not found."? "No data": result;
};

    return {
      email,
      photoProfile: extract(/Custom profile picture!\s*=>\s*(.*)/, "No photo"),
      lastEditProfile: extract(/Last profile edit: (.*)/),
      googleID: extract(/Gaia ID: (.*)/),
      userTypes: extract(/User types: (.*)/),
      googleChat: {
        entityType: extract(/Entity Type: (.*)/),
        customerID: extract(/Customer ID: (.*)/, "No ID", true)
},
      googlePlus: {
        enterpriseUser: extract(/Entreprise User: (.*)/)
},
      mapsData: {
        profilePage: extract(/Profile page: (.*)/)
},
      ipAddress: text.includes("Your IP has been blocked by Google")? "Blocked by Google": "Safe",
      calendar: text.includes("No public Google Calendar")? "None": "Available"
};
} catch (err) {
    console.error("[ERROR] فشل استخراج بيانات Gmail:", err.message);
    throw err;
}
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/gmail/profile?q=example@gmail.com
 */
router.get("/gmail_info", async (req, res) => {
  const { q} = req.query;
  if (!q ||!q.includes("@gmail.com")) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "يرجى تقديم بريد إلكتروني صالح من Gmail 📧"
});
}

  try {
    const result = await fetchGmailProfile(q);
    res.json({
      status: 200,
      success: true,
      message: "✅ تم استخراج بيانات الحساب بنجاح!",
      data: result
});
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء استخراج البيانات 🚫",
      error: err.message
});
}
});

module.exports = {
  path: "/api/tools",
  name: "gmail get info",
  type: "tools",
  url: `${global.t}/api/tools/gmail_info?q=nonosn349@gmail.com`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "جلب معلومات عن Gmail",
  router
};