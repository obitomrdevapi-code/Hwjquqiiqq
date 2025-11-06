const express = require("express");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

const router = express.Router();

const proxy = "https://api.allorigins.win/raw?url=";

async function fetchCountries() {
  const res = await fetch(`${proxy}https://temporary-phone-number.com/countrys/`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const result = [];

  $("a.checkout-box").each((_, el) => {
    const name = $(el).text().trim().split("\n")[0];
    const href = $(el).attr("href");
    result.push({ name, link: `https://temporary-phone-number.com${href}`});
});

  return result;
}

async function fetchNumbers(url) {
  const res = await fetch(`${proxy}${url}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const result = [];

  $(".col-sm-6.col-md-4.col-lg-3.col-xs-12").each((_, el) => {
    const number = $(el).find(".info-box-number").text().trim();
    const href = $(el).find("a").attr("href");
    result.push({ number, link: `https://temporary-phone-number.com${href}`});
});

  return result;
}

async function fetchMessages(url) {
  const res = await fetch(`${proxy}${url}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const result = [];

  $(".direct-chat-msg.left").each((_, el) => {
    const from = $(el).find(".direct-chat-info span.pull-right").text().trim();
    const time = $(el).find(".direct-chat-timestamp").text().trim();
    const text = $(el).find(".direct-chat-text").text().trim();
    const code = text.match(/\d{4,8}/g)?.[0] || null;
    result.push({ from, time, text, code});
});

  return result;
}

router.get("/numbers", async (req, res) => {
  const { type, url} = req.query;

  try {
    if (!["country", "numbers", "messages"].includes(type)) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "⚠️ Invalid type. Use: country, numbers, messages",
});
}

    if (type === "country") {
      const countries = await fetchCountries();
      return res.json({
        status: 200,
        success: true,
        total: countries.length,
        countries,
});
}

    if (type === "numbers") {
      if (!url) {
        return res.status(400).json({
          status: 400,
          success: false,
          message: "⚠️ Country URL is required.",
});
}
      const numbers = await fetchNumbers(url);
      return res.json({
        status: 200,
        success: true,
        total: numbers.length,
        numbers,
});
}

    if (type === "messages") {
      if (!url) {
        return res.status(400).json({
          status: 400,
          success: false,
          message: "⚠️ Number URL is required.",
});
}
      const messages = await fetchMessages(url);
      return res.json({
        status: 200,
        success: true,
        total: messages.length,
        messages,
});
}
} catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "❌ Error while processing request.",
      error: err.message,
});
}
});

module.exports = {
  path: "/api/tools",
  name: "temporary phone numbers",
  type: "tools",
  url: "https://obito-mr-apis.vercel.app/api/tools/numbers?type=country",
  logo: "https://qu.ax/numlogo.png",
  description: "جلب ارقام",
  router,
};