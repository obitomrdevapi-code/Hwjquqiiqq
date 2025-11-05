const express = require("express");
const axios = require("axios");

const router = express.Router();

// مفتاح API الخاص بك من OpenWeatherMap
const API_KEY = "060a6bcfa19809c2cd4d97a212b19273";

/**
 * استخراج معلومات الطقس من OpenWeatherMap
 * @param {string} location - اسم المدينة أو الدولة
 * @returns {Promise<object>}
 */
async function getWeatherInfo(location) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${API_KEY}`;
    const response = await axios.get(url);
    const data = response.data;

    return {
      location: data.name,
      country: data.sys.country,
      coordinates: data.coord,
      temperature: {
        current: data.main.temp,
        feels_like: data.main.feels_like,
        min: data.main.temp_min,
        max: data.main.temp_max
},
      weather: {
        main: data.weather[0].main,
        description: data.weather[0].description,
        icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`
},
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      wind: data.wind,
      visibility: data.visibility,
      clouds: data.clouds.all,
      sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString(),
      sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString()
};
} catch (error) {
    throw new Error(`فشل في جلب الطقس: ${error.response?.data?.message || error.message}`);
}
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/info/weather?q=Nador
 */
router.get("/weather", async (req, res) => {
  const location = req.query.q;

  if (!location) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "يرجى إدخال اسم المدينة أو الدولة في المعامل?q"
});
}

  try {
    const weatherInfo = await getWeatherInfo(location);
    res.json({
      status: 200,
      success: true,
      weather: weatherInfo
});
} catch (error) {
    res.status(500).json({
      status: 500,
      success: false,
      message: error.message
});
}
});

module.exports = {
  path: "/api/tools",
  name: "Weather Info",
  type: "tools",
  url: `https://obito-mr-apis.vercel.app/api/tools/weather?q=Nador`,
  logo: "",
  description: "جلب معلومات الطقس لأي مدينة أو دولة",
  router
};