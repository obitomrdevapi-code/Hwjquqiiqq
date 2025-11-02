// بسم الله الرحمن الرحيم ✨
// Akinator API
// API للعب مع Akinator الذكي

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

/**
 * بدء لعبة جديدة
 * مثال:
 *   GET /api/akinator/start
 */
router.get("/akinator_start", async (req, res) => {
  try {
    const response = await axios.post(
      "https://ar.akinator.com/game",
      new URLSearchParams({ cm: "false", sid: "1" }),
      {
        headers: {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "accept-language": "ar,en;q=0.9",
          "content-type": "application/x-www-form-urlencoded"
        },
        timeout: 30000
      }
    );

    const $ = cheerio.load(response.data);

    const question = $("#question-label").text().trim();
    const session = $('form#askSoundlike input[name="session"]').val();
    const signature = $('form#askSoundlike input[name="signature"]').val();
    const step = $('form#askSoundlike input[name="step"]').val();

    if (!session || !signature) {
      return res.status(500).json({
        status: 500,
        success: false,
        message: "فشل في بدء الجلسة"
      });
    }

    res.json({
      status: 200,
      success: true,
      data: {
        game_id: uuidv4(),
        session: session,
        signature: signature,
        step: step || "0",
        question: question,
        progression: "0"
      }
    });
    
  } catch (err) {
    console.error('Akinator Start Error:', err.message);
    
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء بدء اللعبة",
      error: err.message
    });
  }
});

/**
 * الإجابة على سؤال
 * مثال:
 *   POST /api/akinator/answer
 *   Body: { session, signature, step, answer, progression }
 */
router.post("/akinator_answer", async (req, res) => {
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "يجب تقديم بيانات الجلسة والإجابة"
    });
  }

  try {
    const response = await axios.post(
      "https://ar.akinator.com/answer",
      new URLSearchParams(req.body),
      {
        headers: {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "content-type": "application/x-www-form-urlencoded",
          "accept": "application/json, text/javascript, */*; q=0.01",
          "x-requested-with": "XMLHttpRequest"
        },
        timeout: 30000
      }
    );

    let result = response.data;

    // إذا كان هناك akitude أضف الرابط الكامل تلقائيًا
    if (result.akitude) {
      result.akitude_url = `https://ar.akinator.com/assets/img/akitudes_520x650/${result.akitude}`;
    }

    // إضافة حالة النجاح
    result.status = 200;
    result.success = true;

    res.json(result);
    
  } catch (err) {
    console.error('Akinator Answer Error:', err.message);
    
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء معالجة الإجابة",
      error: err.message,
      response: err.response?.data
    });
  }
});

/**
 * التراجع عن الإجابة الأخيرة
 * مثال:
 *   POST /api/akinator/back
 *   Body: { session, signature, step, progression }
 */
router.post("/akinator_back", async (req, res) => {
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "يجب تقديم بيانات الجلسة"
    });
  }

  try {
    const response = await axios.post(
      "https://ar.akinator.com/cancel_answer",
      new URLSearchParams({
        step: req.body.step,
        progression: req.body.progression,
        session: req.body.session,
        signature: req.body.signature,
        cm: "false",
        sid: "NaN"
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "accept": "application/json, text/javascript, */*; q=0.01",
          "x-requested-with": "XMLHttpRequest"
        },
        timeout: 30000
      }
    );

    let result = response.data;

    if (result.akitude) {
      result.akitude_url = `https://ar.akinator.com/assets/img/akitudes_520x650/${result.akitude}`;
    }

    // إضافة حالة النجاح
    result.status = 200;
    result.success = true;

    res.json(result);
    
  } catch (err) {
    console.error('Akinator Back Error:', err.message);
    
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء التراجع",
      error: err.message,
      response: err.response?.data
    });
  }
});

/**
 * اختيار الشخصية
 * مثال:
 *   POST /api/akinator/select
 *   Body: { session, signature, step, progression, element }
 */
router.post("/select", async (req, res) => {
  if (!req.body.element) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "يجب تحديد العنصر (element)"
    });
  }

  try {
    const response = await axios.post(
      "https://ar.akinator.com/select",
      new URLSearchParams(req.body),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "accept": "application/json, text/javascript, */*; q=0.01",
          "x-requested-with": "XMLHttpRequest"
        },
        timeout: 30000
      }
    );

    let result = response.data;

    // إضافة حالة النجاح
    result.status = 200;
    result.success = true;

    res.json(result);
    
  } catch (err) {
    console.error('Akinator Select Error:', err.message);
    
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء اختيار الشخصية",
      error: err.message,
      response: err.response?.data
    });
  }
});

/**
 * الحصول على معلومات الجلسة
 * مثال:
 *   GET /api/akinator/session/:sessionId
 */
router.get("/session/:sessionId", async (req, res) => {
  const sessionId = req.params.sessionId;

  try {
    // هذه مجرد مثال - في الواقع تحتاج لتخزين الجلسات في قاعدة بيانات
    res.json({
      status: 200,
      success: true,
      data: {
        session_id: sessionId,
        active: true,
        created_at: new Date().toISOString()
      }
    });
    
  } catch (err) {
    console.error('Akinator Session Error:', err.message);
    
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء جلب معلومات الجلسة",
      error: err.message
    });
  }
});

module.exports = {
  path: "/api/game",
  name: "akinator game",
  type: "game",
  url: `${global.t}/api/game/akinator_start`,
  logo: "",
  description: "العب مع Akinator الذكي الذي يخمن الشخصية التي تفكر فيها",
  router
};