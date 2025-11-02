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
router.get("/times", async (req, res) => {
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

        // تنظيم البيانات بشكل مرتب
        const organizedData = {
            location: {
                city: city,
                country: country,
                timezone: result.data.meta.timezone,
                coordinates: {
                    latitude: result.data.meta.latitude,
                    longitude: result.data.meta.longitude
                }
            },
            date: {
                gregorian: {
                    readable: result.data.date.readable,
                    date: result.data.date.gregorian.date,
                    day: result.data.date.gregorian.day,
                    month: result.data.date.gregorian.month.en,
                    year: result.data.date.gregorian.year,
                    weekday: result.data.date.gregorian.weekday.en
                },
                hijri: {
                    date: result.data.date.hijri.date,
                    day: result.data.date.hijri.day,
                    month: result.data.date.hijri.month.ar + " (" + result.data.date.hijri.month.en + ")",
                    year: result.data.date.hijri.year,
                    weekday: result.data.date.hijri.weekday.ar + " (" + result.data.date.hijri.weekday.en + ")"
                }
            },
            prayer_times: {
                fajr: result.data.timings.Fajr,
                sunrise: result.data.timings.Sunrise,
                dhuhr: result.data.timings.Dhuhr,
                asr: result.data.timings.Asr,
                maghrib: result.data.timings.Maghrib,
                isha: result.data.timings.Isha,
                imsak: result.data.timings.Imsak,
                midnight: result.data.timings.Midnight
            },
            calculation_method: {
                name: result.data.meta.method.name,
                parameters: {
                    fajr_angle: result.data.meta.method.params.Fajr,
                    isha_angle: result.data.meta.method.params.Isha
                },
                school: result.data.meta.school,
                adjustment_method: result.data.meta.latitudeAdjustmentMethod
            }
        };

        res.json({
            status: 200,
            success: true,
            data: organizedData
        });
        
    } catch (err) {
        console.error('Prayer Times API Error:', err.message);
        
        let errorMessage = "حدث خطأ أثناء جلب أوقات الصلاة";
        let statusCode = 500;
        
        if (err.message.includes('Failed to fetch')) {
            errorMessage = "فشل في الاتصال بخادم أوقات الصلاة";
        } else if (err.message.includes('timeout')) {
            errorMessage = "انتهت مهلة الطلب. حاول مرة أخرى";
        }

        res.status(statusCode).json({
            status: statusCode,
            success: false,
            message: errorMessage,
            error: err.message
        });
    }
});

/**
 * نقطة النهاية - أوقات الصلاة لمدن محددة
 * مثال:
 *   GET /api/prayer/cities
 */
router.get("/cities", async (req, res) => {
    const popularCities = [
        { city: "nador", country: "morocco", name: "الناظور" },
        { city: "casablanca", country: "morocco", name: "الدار البيضاء" },
        { city: "rabat", country: "morocco", name: "الرباط" },
        { city: "fes", country: "morocco", name: "فاس" },
        { city: "marrakech", country: "morocco", name: "مراكش" },
        { city: "tanger", country: "morocco", name: "طنجة" },
        { city: "meknes", country: "morocco", name: "مكناس" },
        { city: "agadir", country: "morocco", name: "أكادير" }
    ];

    try {
        const citiesData = [];
        
        for (const cityInfo of popularCities.slice(0, 3)) { // نجلب أول 3 مدن فقط لتجنب كثرة الطلبات
            try {
                const result = await getPrayerTimes(cityInfo.city, cityInfo.country);
                
                if (result.code === 200) {
                    citiesData.push({
                        city: cityInfo.name,
                        arabic_name: cityInfo.name,
                        english_name: cityInfo.city,
                        country: cityInfo.country,
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
                total_cities: citiesData.length,
                cities: citiesData
            }
        });
        
    } catch (err) {
        console.error('Cities Prayer Times API Error:', err.message);
        
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ أثناء جلب أوقات الصلاة للمدن",
            error: err.message
        });
    }
});

/**
 * نقطة النهاية - معلومات التاريخ الهجري
 * مثال:
 *   GET /api/prayer/hijri
 */
router.get("/hijri", async (req, res) => {
    const city = req.query.city || "nador";
    const country = req.query.country || "morocco";
    
    try {
        const result = await getPrayerTimes(city, country);

        if (result.code !== 200) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "❌ فشل في جلب المعلومات"
            });
        }

        const hijriInfo = {
            current_date: {
                hijri: result.data.date.hijri.date,
                gregorian: result.data.date.readable,
                day: result.data.date.hijri.day,
                month: {
                    number: result.data.date.hijri.month.number,
                    arabic: result.data.date.hijri.month.ar,
                    english: result.data.date.hijri.month.en
                },
                year: result.data.date.hijri.year,
                weekday: {
                    arabic: result.data.date.hijri.weekday.ar,
                    english: result.data.date.hijri.weekday.en
                }
            },
            designation: {
                abbreviated: result.data.date.hijri.designation.abbreviated,
                expanded: result.data.date.hijri.designation.expanded
            },
            holidays: result.data.date.hijri.holidays
        };

        res.json({
            status: 200,
            success: true,
            data: hijriInfo
        });
        
    } catch (err) {
        console.error('Hijri API Error:', err.message);
        
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ أثناء جلب المعلومات الهجرية",
            error: err.message
        });
    }
});

module.exports = {
    path: "/api/prayer",
    name: "prayer times",
    type: "prayer",
    url: `${global.t}/api/islam/times?city=nador&country=morocco`,
    logo: "https://cdn-icons-png.flaticon.com/512/2043/2043956.png",
    description: "جلب أوقات الصلاة حسب المدينة والدولة",
    router
};