const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * سحب بيانات العطل المدرسية
 * مثال:
 *   /api/study/holidays
 */
router.get("/holidays", async (req, res) => {
  try {
    const holidaysUrl = "https://moutamadris.ma/%d9%84%d8%a7%d8%a6%d8%ad%d8%a9-%d8%a7%d9%84%d8%b9%d8%b7%d9%84-%d8%a7%d9%84%d9%85%d8%af%d8%b1%d8%b3%d9%8a%d8%a9-%d8%a8%d8%a7%d9%84%d9%85%d8%ba%d8%b1%d8%a8/";
    
    const response = await axios.get(holidaysUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const result = {
      image: "",
      pdf: "",
      important_info: []
    };

    // البحث عن الصورة الرئيسية
    const mainImage = $('img[alt*="العطل المدرسية"]').first();
    if (mainImage.length) {
      result.image = mainImage.attr('src');
    }

    // البحث عن رابط PDF
    const pdfLink = $('a[href*=".pdf"]').filter((i, el) => $(el).text().includes('العطل')).first();
    if (pdfLink.length) {
      result.pdf = pdfLink.attr('href');
    }

    // استخراج النصوص المهمة
    const contentDiv = $('div.entry-content');
    if (contentDiv.length) {
      contentDiv.find('p, h2, h3').each((i, el) => {
        const text = $(el).text().trim();
        if (text.match(/عطلة|العطل|مدرسية|اجازة|رسمية/i)) {
          result.important_info.push(text);
        }
      });
      result.important_info = result.important_info.slice(0, 8);
    }

    res.json({
      status: 200,
      success: true,
      data: result
    });

  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ في سحب بيانات العطل 🚫",
      error: err.message,
    });
  }
});

/**
 * استخراج مستويات الجذاذات
 * مثال:
 *   /api/study/jodadat
 */
router.get("/jodadat", async (req, res) => {
  try {
    const jodadatUrl = "https://moutamadris.ma/jodadat/";
    
    const response = await axios.get(jodadatUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const levels = [];

    // استخراج مستويات الجذاذات
    const readDiv = $('div.entry-content div.read');
    if (readDiv.length) {
      readDiv.find('a').each((i, el) => {
        levels.push({
          id: i + 1,
          name: $(el).text().trim(),
          url: $(el).attr('href')
        });
      });
    }

    res.json({
      status: 200,
      success: true,
      data: {
        title: $('h1.entry-title').text().trim(),
        total_levels: levels.length,
        levels: levels
      }
    });

  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ في سحب مستويات الجذاذات 🚫",
      error: err.message,
    });
  }
});

/**
 * استخراج مواد مستوى معين من الجذاذات
 * مثال:
 *   /api/study/jodadat/level?level=1
 */
router.get("/jodadat/level", async (req, res) => {
  const { level } = req.query;
  const levelId = Number(level) || 1;

  try {
    const jodadatUrl = "https://moutamadris.ma/jodadat/";
    
    const response = await axios.get(jodadatUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const levels = [];
    let targetLevel = null;

    // استخراج جميع المستويات والعثور على المستوى المطلوب
    const readDiv = $('div.entry-content div.read');
    if (readDiv.length) {
      readDiv.find('a').each((i, el) => {
        const levelData = {
          id: i + 1,
          name: $(el).text().trim(),
          url: $(el).attr('href')
        };
        levels.push(levelData);
        
        if (levelData.id == levelId) {
          targetLevel = levelData;
        }
      });
    }

    if (!targetLevel) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "المستوى غير موجود 😢",
      });
    }

    // سحب بيانات المستوى المحدد
    const levelResponse = await axios.get(targetLevel.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const level$ = cheerio.load(levelResponse.data);
    const subjects = [];

    // استخراج المواد
    const levelReadDiv = level$('div.entry-content div.read');
    if (levelReadDiv.length) {
      levelReadDiv.find('a').each((i, el) => {
        subjects.push({
          id: i + 1,
          name: level$(el).text().trim(),
          url: level$(el).attr('href')
        });
      });
    }

    res.json({
      status: 200,
      success: true,
      data: {
        level: targetLevel,
        title: level$('h1.entry-title').text().trim() || level$('h2').first().text().trim(),
        total_subjects: subjects.length,
        subjects: subjects
      }
    });

  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ في سحب مواد المستوى 🚫",
      error: err.message,
    });
  }
});

/**
 * استخراج ملفات جذاذات مادة معينة
 * مثال:
 *   /api/study/jodadat/subject?level=1&subject=1
 */
router.get("/jodadat/subject", async (req, res) => {
  const { level, subject } = req.query;
  const levelId = Number(level) || 1;
  const subjectId = Number(subject) || 1;

  try {
    // أولاً نحصل على مواد المستوى
    const levelResponse = await axios.get(`http://${req.get('host')}${req.baseUrl}/jodadat/level?level=${levelId}`);
    const levelData = levelResponse.data.data;
    
    const targetSubject = levelData.subjects.find(s => s.id == subjectId);
    if (!targetSubject) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "المادة غير موجودة 😢",
      });
    }

    // سحب بيانات المادة
    const subjectResponse = await axios.get(targetSubject.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(subjectResponse.data);
    const files = [];

    // استخراج ملفات الجذاذات من الجداول
    $('table').each((i, table) => {
      $(table).find('tr').slice(1).each((j, row) => {
        const cols = $(row).find('td');
        if (cols.length >= 2) {
          const fileName = $(cols[0]).text().trim();
          const downloadLink = $(cols[1]).find('a');
          if (downloadLink.length) {
            files.push({
              id: files.length + 1,
              name: fileName,
              url: downloadLink.attr('href')
            });
          }
        }
      });
    });

    res.json({
      status: 200,
      success: true,
      data: {
        level: levelData.level,
        subject: targetSubject,
        title: $('h1.entry-title').text().trim(),
        total_files: files.length,
        files: files
      }
    });

  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ في سحب ملفات الجذاذات 🚫",
      error: err.message,
    });
  }
});

/**
 * استخراج أنواع الامتحانات
 * مثال:
 *   /api/study/exams
 */
router.get("/exams", async (req, res) => {
  try {
    const examsUrl = "https://moutamadris.ma/examens/";
    
    const response = await axios.get(examsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const examTypes = [];

    // استخراج أنواع الامتحانات
    $('div.entry-content div.read a, div.entry-content div.yellow a').each((i, el) => {
      examTypes.push({
        id: i + 1,
        name: $(el).text().trim(),
        url: $(el).attr('href')
      });
    });

    res.json({
      status: 200,
      success: true,
      data: {
        title: $('h1.entry-title').text().trim(),
        total_exams: examTypes.length,
        exam_types: examTypes
      }
    });

  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ في سحب أنواع الامتحانات 🚫",
      error: err.message,
    });
  }
});

/**
 * استخراج مواد امتحان معين
 * مثال:
 *   /api/study/exams/level?exam=1
 */
router.get("/exams/level", async (req, res) => {
  const { exam } = req.query;
  const examId = Number(exam) || 1;

  try {
    const examsUrl = "https://moutamadris.ma/examens/";
    
    const response = await axios.get(examsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const examTypes = [];
    let targetExam = null;

    // استخراج جميع أنواع الامتحانات والعثور على الامتحان المطلوب
    $('div.entry-content div.read a, div.entry-content div.yellow a').each((i, el) => {
      const examData = {
        id: i + 1,
        name: $(el).text().trim(),
        url: $(el).attr('href')
      };
      examTypes.push(examData);
      
      if (examData.id == examId) {
        targetExam = examData;
      }
    });

    if (!targetExam) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "نوع الامتحان غير موجود 😢",
      });
    }

    // سحب بيانات الامتحان المحدد
    const examResponse = await axios.get(targetExam.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const exam$ = cheerio.load(examResponse.data);
    const subjects = [];

    // استخراج المواد من أقسام mawad
    exam$('div.mawad a').each((i, el) => {
      subjects.push({
        id: i + 1,
        name: exam$(el).text().trim(),
        url: exam$(el).attr('href')
      });
    });

    res.json({
      status: 200,
      success: true,
      data: {
        exam: targetExam,
        title: exam$('h1.entry-title').text().trim() || exam$('h2').first().text().trim(),
        total_subjects: subjects.length,
        subjects: subjects
      }
    });

  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ في سحب مواد الامتحان 🚫",
      error: err.message,
    });
  }
});

/**
 * استخراج مستويات الدروس والتمارين
 * مثال:
 *   /api/study/courses
 */
router.get("/courses", async (req, res) => {
  try {
    const coursesUrl = "https://moutamadris.ma/cours/";
    
    const response = await axios.get(coursesUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const levels = [];

    // استخراج مستويات الدروس
    $('div.entry-content div.read a').each((i, el) => {
      levels.push({
        id: i + 1,
        name: $(el).text().trim(),
        url: $(el).attr('href')
      });
    });

    res.json({
      status: 200,
      success: true,
      data: {
        title: $('h1.entry-title').text().trim(),
        total_levels: levels.length,
        levels: levels
      }
    });

  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ في سحب مستويات الدروس 🚫",
      error: err.message,
    });
  }
});

module.exports = {
  path: "/api/search",
  name: "tst search",
  type: "search",
  url: `${global.t}/api/search/moutamadris/holidays`,
  logo: "https://qu.ax/obitoajajq.png",
  description:
    "tst",
  router,
};
