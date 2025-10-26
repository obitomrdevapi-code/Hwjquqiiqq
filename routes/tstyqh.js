const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();
const BASE_URL = "https://yallasms.com/country/";

/**
 * جلب قائمة الدول من موقع YallaSMS
 * @returns {Promise<object>}
 */
async function fetchCountries() {
  try {
    const response = await axios.get(BASE_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ar,en;q=0.5"
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);
    const results = [];

    // استخراج البيانات من الـ script في الصفحة
    const scripts = $('script');
    
    scripts.each((index, script) => {
      const scriptContent = $(script).html();
      if (scriptContent && scriptContent.includes('const countries = [')) {
        const match = scriptContent.match(/const countries\s*=\s*(\[.*?\]);/s);
        if (match && match[1]) {
          try {
            // تحويل البيانات إلى مصفوفة JavaScript
            const countriesData = eval(match[1]);
            
            if (Array.isArray(countriesData)) {
              countriesData.forEach(country => {
                if (country.name && country.code) {
                  results.push({
                    name: country.name,
                    code: country.code,
                    flag: country.flag,
                    url: country.url
                  });
                }
              });
            }
          } catch (evalError) {
            console.error("[ERROR] في تحليل بيانات الدول:", evalError.message);
            throw new Error("فشل في تحليل بيانات الدول من الموقع");
          }
        }
      }
    });

    if (results.length === 0) {
      throw new Error("لم يتم العثور على بيانات الدول في الصفحة");
    }

    return { status: true, data: results };
  } catch (err) {
    console.error("[ERROR] أثناء جلب الدول:", err.message);
    return { status: false, message: "فشل في جلب قائمة الدول من الموقع." };
  }
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/countries/list
 */
router.get("/country_number_fek", async (req, res) => {
  const result = await fetchCountries();

  if (!result.status) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: result.message
    });
  }

  res.json({
    status: 200,
    success: true,
    count: result.data.length,
    data: result.data
  });
});

module.exports = {
  path: "/api/tools",
  name: "country number fek",
  type: "tools",
  url: `${global.t}/api/tools/country_number_fek`,
  logo: "",
  description: "جلب دول المتوفره للأرقام الوهميه",
  router
};
