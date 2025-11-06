const express = require("express");
const axios = require("axios");
const moment = require("moment-timezone");

const router = express.Router();

/**
 * دالة لجلب بيانات الدولة بدون الحاجة إلى API Keys
 */
async function getCountryData(country) {
    try {
        console.log(`🔍 جاري جلب بيانات الدولة: ${country}`);

        // جلب إحداثيات الدولة من OpenStreetMap
        const geoRes = await axios.get("https://nominatim.openstreetmap.org/search", {
            params: { q: country, format: "json", limit: 1},
            headers: { "User-Agent": "Mozilla/5.0"}
});

        if (!geoRes.data.length) {
            console.error(`⚠️ لم يتم العثور على إحداثيات الدولة: ${country}`);
            return null;
}

        const { lat, lon, display_name} = geoRes.data[0];

        // جلب معلومات الدولة من RestCountries
        const countryRes = await axios.get(
            `https://restcountries.com/v3.1/name/${encodeURIComponent(country)}?fullText=true`
);

        if (!countryRes.data.length) {
            console.error(`⚠️ لم يتم العثور على بيانات الدولة: ${country}`);
            return null;
}

        const countryInfo = countryRes.data[0];

        // جلب التوقيت المحلي باستخدام moment-timezone
        let timezone = countryInfo.timezones? countryInfo.timezones[0]: "غير متوفر";
        let currentTime = "غير متوفر";

        try {
            if (timezone!== "غير متوفر") {
                currentTime = moment().tz(timezone).format("YYYY-MM-DD HH:mm:ss");
}
} catch (error) {
            console.warn(`⚠️ توقيت غير صالح للدولة: ${country} - ${timezone}`);
            timezone = "غير متوفر";
}

        // جلب الطقس الحالي بدون API Key
        let weather = "غير متوفر", temperature = "غير متوفر";
        try {
            const weatherRes = await axios.get(`https://wttr.in/${country}?format=%C+%t`, {
                headers: { "User-Agent": "Mozilla/5.0"}
});
            const weatherData = weatherRes.data.trim().split(" ");
            weather = weatherData[0] || "غير متوفر";
            temperature = weatherData[1] || "غير متوفر";
} catch (err) {
            console.warn("⚠️ تعذر جلب الطقس:", err.message);
}

        // تجميع البيانات
        const data = {
            name: display_name,
            lat: parseFloat(lat),
            lon: parseFloat(lon),
            flag: countryInfo.cca2? `https://flagcdn.com/w320/${countryInfo.cca2.toLowerCase()}.png`: "غير متوفر",
            capital: countryInfo.capital? countryInfo.capital[0]: "غير متوفر",
            population: countryInfo.population?.toLocaleString() || "غير متوفر",
            area: countryInfo.area?.toLocaleString() + " كم²" || "غير متوفر",
            currency: Object.values(countryInfo.currencies || {})[0]?.name || "غير متوفر",
            language: Object.values(countryInfo.languages || {})[0] || "غير متوفر",
            timezone,
            currentTime,
            weather: { description: weather, temperature},
            callingCode: countryInfo.idd?.root
? `${countryInfo.idd.root}${countryInfo.idd.suffixes? countryInfo.idd.suffixes[0]: ""}`
: "غير متوفر",
            wiki: `https://en.wikipedia.org/wiki/${encodeURIComponent(country)}`,
            map: `https://www.google.com/maps/@${lat},${lon},6z`,
};

        console.log(`✅ تم جلب بيانات الدولة: ${country}`);
        return data;

} catch (error) {
        console.error(`❌ خطأ أثناء جلب بيانات ${country}:`, error.message);
        return null;
}
}

/**
* دالة لحساب المسافة بين إحداثيتين باستخدام قانون هافرسين
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * (Math.PI / 180))*
        Math.cos(lat2 * (Math.PI / 180))*
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2) + " km";
}

/**
 * نقطة نهاية لحساب المسافة بين بلدين
 */
router.get("/distance", async (req, res) => {
    const { country1, country2} = req.query;

    if (!country1 ||!country2) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: "❌ يرجى تقديم اسم البلدين باستخدام?country1= و?country2="
});
}

    try {
        const [data1, data2] = await Promise.all([
            getCountryData(country1),
            getCountryData(country2),
        ]);

        if (!data1 ||!data2) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "⚠️ تعذر العثور على بيانات أحد البلدين."
});
}

        const distance = calculateDistance(data1.lat, data1.lon, data2.lat, data2.lon);

        res.json({
            status: 200,
            success: true,
            country1: data1,
            country2: data2,
            distance
});
} catch (error) {
        console.error("❌ خطأ أثناء حساب المسافة:", error.message);
        res.status(500).json({
            status: 500,
            success: false,
            message: "❌ حدث خطأ داخلي. حاول مرة أخرى لاحقًا."
});
}
});

/**
 * نقطة نهاية لجلب بيانات دولة واحدة
 */
router.get("/country", async (req, res) => {
    const { name} = req.query;
    if (!name) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: "❌ يرجى تقديم اسم الدولة باستخدام?name="
});
}

    try {
        const data = await getCountryData(name);
        if (!data) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "⚠️ تعذر العثور على بيانات الدولة."
});
}

        res.json({
            status: 200,
            success: true,
            country: data
});
} catch (error) {
        res.status(500).json({
            status: 500,
            success: false,
            message: "❌ حدث خطأ أثناء جلب بيانات الدولة.",
            error: error.message
});
}
});

module.exports = {
  path: "/api/tools",
  name: "Country Info & Distance",
  type: "info",
  url: `${global.t}/api/tools/distance?country1=morocco&country2=france`,
  logo: "https://qu.ax/freefire.png",
  description: "جلب بيانات الدول والمسافة بينها",
  router
};