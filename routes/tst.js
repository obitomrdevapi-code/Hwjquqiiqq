// بسم الله الرحمن الرحيم ✨
// Prayer Times API
// API لجلب أوقات الصلاة حسب المدينة

const express = require("express");
const axios = require("axios");

const router = express.Router();

/**
 * جلب أوقات الصلاة حسب المدينة
 * @param {string} city - المدينة
 * @param {string} country - الدولة
 * @returns {Promise<object>}
 */
async function getPrayerTimes(city = "nador", country = "morocco") {
    try {
        const response = await axios.get(`https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            },
            timeout: 30000
        });

        return response.data;
    } catch (error) {
        console.error('Prayer Times API Error:', error.message);
        throw new Error('Failed to fetch prayer times: ' + error.message);
    }
}

/**
 * نقطة النهاية الرئيسية - أوقات الصلاة
 * مثال:
 *   GET /api/prayer/times?city=nador&country=morocco
 */
router.get("/timings", async (req, res) => {
    const city = req.query.city || "nador";
    const country = req.query.country || "morocco";
    
    try {
        console.log(`Fetching prayer times for: ${city}, ${country}`);
        
        const result = await getPrayerTimes(city, country);

        if (result.code !== 200) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "❌ فشل في جلب أوقات الصلاة",
                error: result.status
            });
        }

        // تنظيم بيانات أوقات الصلاة فقط
        const prayerData = {
            location: {
                city: city,
                country: country,
                timezone: result.data.meta.timezone
            },
            date: result.data.date.readable,
            timings: {
                fajr: result.data.timings.Fajr,
                sunrise: result.data.timings.Sunrise,
                dhuhr: result.data.timings.Dhuhr,
                asr: result.data.timings.Asr,
                maghrib: result.data.timings.Maghrib,
                isha: result.data.timings.Isha,
                imsak: result.data.timings.Imsak
            },
            method: {
                name: result.data.meta.method.name,
                school: result.data.meta.school
            }
        };

        res.json({
            status: 200,
            success: true,
            data: prayerData
        });
        
    } catch (err) {
        console.error('Prayer Times API Error:', err.message);
        
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ أثناء جلب أوقات الصلاة",
            error: err.message
        });
    }
});

/**
 * نقطة النهاية - أوقات الصلاة لمدن مغربية
 * مثال:
 *   GET /api/prayer/morocco
 */
router.get("/morocco", async (req, res) => {
    const moroccanCities = [
        { city: "casablanca", name: "الدار البيضاء" },
        { city: "rabat", name: "الرباط" },
        { city: "fes", name: "فاس" },
        { city: "marrakech", name: "مراكش" },
        { city: "tanger", name: "طنجة" },
        { city: "meknes", name: "مكناس" },
        { city: "agadir", name: "أكادير" },
        { city: "nador", name: "الناظور" }
    ];

    try {
        const citiesData = [];
        
        for (const cityInfo of moroccanCities.slice(0, 4)) {
            try {
                const result = await getPrayerTimes(cityInfo.city, "morocco");
                
                if (result.code === 200) {
                    citiesData.push({
                        city: cityInfo.name,
                        timings: {
                            fajr: result.data.timings.Fajr,
                            dhuhr: result.data.timings.Dhuhr,
                            asr: result.data.timings.Asr,
                            maghrib: result.data.timings.Maghrib,
                            isha: result.data.timings.Isha
                        }
                    });
                }
            } catch (error) {
                console.error(`Error fetching data for ${cityInfo.city}:`, error.message);
            }
        }

        res.json({
            status: 200,
            success: true,
            data: {
                country: "المغرب",
                total_cities: citiesData.length,
                cities: citiesData
            }
        });
        
    } catch (err) {
        console.error('Morocco Prayer Times API Error:', err.message);
        
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ أثناء جلب أوقات الصلاة للمدن المغربية",
            error: err.message
        });
    }
});

module.exports = {
    path: "/api/islam",
    name: "مواقيت صلاة",
    type: "islam",
    url: `${global.t}/api/islam/timings?city=nador&country=morocco`,
    logo: "",
    description: "جلب أوقات الصلاة حسب المدينة والدولة",
    router
};