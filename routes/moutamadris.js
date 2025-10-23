// بسم الله الرحمن الرحيم ✨
// API لاستخراج الأقسام الدراسية من موقع متمدرس
// تحويل من Python إلى Node.js (Express API)

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * الحصول على الأقسام الأساسية المطلوبة
 */
function getStudySections() {
    return [
        {
            name: "العطل",
            url: "https://moutamadris.ma/%d9%84%d8%a7%d8%a6%d8%ad%d8%a9-%d8%a7%d9%84%d8%b9%d8%b7%d9%84-%d8%a7%d9%84%d9%85%d8%af%d8%b1%d8%b3%d9%8a%d8%a9-%d8%a8%d8%a7%d9%84%d9%85%d8%ba%d8%b1%d8%a8/"
        },
        {
            name: "الجذاذات", 
            url: "https://moutamadris.ma/jodadat/"
        },
        {
            name: "الامتحانات",
            url: "https://moutamadris.ma/examens/"
        },
        {
            name: "الدروس وتمارين",
            url: "https://moutamadris.ma/cours/"
        }
    ];
}

/**
 * سحب بيانات العطل المدرسية
 */
async function scrapeHolidays() {
    const holidaysUrl = "https://moutamadris.ma/%d9%84%d8%a7%d8%a6%d8%ad%d8%a9-%d8%a7%d9%84%d8%b9%d8%b7%d9%84-%d8%a7%d9%84%d9%85%d8%af%d8%b1%d8%b3%d9%8a%d8%a9-%d8%a8%d8%a7%d9%84%d9%85%d8%ba%d8%b1%d8%a8/";

    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };

        const response = await axios.get(holidaysUrl, { headers, timeout: 10000 });
        const $ = cheerio.load(response.data);

        const result = {
            success: true,
            data: {
                title: "بيانات العطل المدرسية 2025-2026",
                image: "",
                pdf: "",
                importantInfo: []
            }
        };

        // البحث عن الصورة الرئيسية
        const mainImage = $('img[alt*="العطل المدرسية"]').first();
        if (mainImage.length) {
            result.data.image = mainImage.attr('src') || '';
        }

        // البحث عن رابط PDF
        const pdfLink = $('a[href*=".pdf"]').filter((i, el) => {
            return $(el).text().includes('العطل');
        }).first();
        
        if (pdfLink.length) {
            result.data.pdf = pdfLink.attr('href') || '';
        }

        // استخراج النصوص المهمة
        const contentDiv = $('div.entry-content');
        if (contentDiv.length) {
            const importantInfo = [];
            
            contentDiv.find('p, h2, h3').each((i, el) => {
                const text = $(el).text().trim();
                const keywords = ['عطلة', 'العطل', 'مدرسية', 'اجازة', 'رسمية'];
                
                if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
                    importantInfo.push(text);
                }
            });

            result.data.importantInfo = importantInfo.slice(0, 8).filter(info => info.length > 30);
        }

        return result;

    } catch (error) {
        return {
            success: false,
            error: `خطأ في سحب بيانات العطل: ${error.message}`
        };
    }
}

/**
 * عرض مستويات الجذاذات
 */
async function scrapeJodadatLevels() {
    const jodadatUrl = "https://moutamadris.ma/jodadat/";

    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };

        const response = await axios.get(jodadatUrl, { headers, timeout: 10000 });
        const $ = cheerio.load(response.data);

        const result = {
            success: true,
            data: {
                title: $('h1.entry-title').text().trim() || "الجذاذات 2024-2025",
                levels: []
            }
        };

        // استخراج مستويات الجذاذات
        const readDiv = $('div.entry-content div.read');
        if (readDiv.length) {
            readDiv.find('a[href]').each((i, el) => {
                const levelName = $(el).text().trim();
                const levelUrl = $(el).attr('href');
                
                if (levelName && levelUrl) {
                    result.data.levels.push({
                        name: levelName,
                        url: levelUrl,
                        id: i + 1
                    });
                }
            });
        }

        return result;

    } catch (error) {
        return {
            success: false,
            error: `خطأ في سحب مستويات الجذاذات: ${error.message}`
        };
    }
}

/**
 * عرض مواد مستوى معين
 */
async function scrapeJodadatSubjects(levelUrl) {
    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };

        const response = await axios.get(levelUrl, { headers, timeout: 10000 });
        const $ = cheerio.load(response.data);

        const result = {
            success: true,
            data: {
                title: $('h1.entry-title').text().trim() || $('h2').first().text().trim(),
                subjects: []
            }
        };

        // استخراج المواد
        const readDiv = $('div.entry-content div.read');
        if (readDiv.length) {
            readDiv.find('a[href]').each((i, el) => {
                const subjectName = $(el).text().trim();
                const subjectUrl = $(el).attr('href');
                
                if (subjectName && subjectUrl) {
                    result.data.subjects.push({
                        name: subjectName,
                        url: subjectUrl,
                        id: i + 1
                    });
                }
            });
        }

        return result;

    } catch (error) {
        return {
            success: false,
            error: `خطأ في سحب بيانات المواد: ${error.message}`
        };
    }
}

/**
 * عرض ملفات الجذاذات لمادة معينة
 */
async function scrapeJodadatFiles(subjectUrl) {
    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };

        const response = await axios.get(subjectUrl, { headers, timeout: 10000 });
        const $ = cheerio.load(response.data);

        const result = {
            success: true,
            data: {
                files: [],
                pdfFiles: []
            }
        };

        // استخراج الجداول
        const tables = $('table');
        
        if (tables.length) {
            tables.each((tableIndex, table) => {
                $(table).find('tr').slice(1).each((i, row) => {
                    const cols = $(row).find('td');
                    if (cols.length >= 2) {
                        const fileName = $(cols[0]).text().trim();
                        const downloadLink = $(cols[1]).find('a[href]');
                        
                        if (downloadLink.length) {
                            const fileUrl = downloadLink.attr('href');
                            result.data.files.push({
                                name: fileName,
                                url: fileUrl,
                                id: result.data.files.length + 1
                            });
                        }
                    }
                });
            });
        }

        // البحث عن روابط PDF مباشرة
        $('a[href*=".pdf"], a[href*=".doc"]').each((i, el) => {
            const pdfName = $(el).text().trim() || `ملف ${i + 1}`;
            const pdfUrl = $(el).attr('href');
            
            result.data.pdfFiles.push({
                name: pdfName.substring(0, 50),
                url: pdfUrl,
                id: i + 1
            });
        });

        return result;

    } catch (error) {
        return {
            success: false,
            error: `خطأ في سحب ملفات الجذاذات: ${error.message}`
        };
    }
}

/**
 * عرض مستويات الامتحانات
 */
async function scrapeExamsLevels() {
    const examsUrl = "https://moutamadris.ma/examens/";

    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };

        const response = await axios.get(examsUrl, { headers, timeout: 10000 });
        const $ = cheerio.load(response.data);

        const result = {
            success: true,
            data: {
                title: $('h1.entry-title').text().trim() || "قسم الامتحانات",
                exams: []
            }
        };

        // البحث في أقسام read و yellow
        $('div.entry-content div.read a[href], div.entry-content div.yellow a[href]').each((i, el) => {
            const examName = $(el).text().trim();
            const examUrl = $(el).attr('href');
            
            if (examName && examUrl) {
                result.data.exams.push({
                    name: examName,
                    url: examUrl,
                    id: i + 1
                });
            }
        });

        return result;

    } catch (error) {
        return {
            success: false,
            error: `خطأ في سحب بيانات الامتحانات: ${error.message}`
        };
    }
}

/**
 * نقطة النهاية الرئيسية - الأقسام الدراسية
 */
router.get("/sections", async (req, res) => {
    try {
        const sections = getStudySections();
        
        res.json({
            status: 200,
            success: true,
            message: "🎓 الأقسام الدراسية الأساسية",
            data: sections
        });

    } catch (error) {
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ أثناء جلب الأقسام",
            error: error.message
        });
    }
});

/**
 * نقطة النهاية للعطل المدرسية
 */
router.get("/holidays", async (req, res) => {
    try {
        const result = await scrapeHolidays();
        
        if (result.success) {
            res.json({
                status: 200,
                success: true,
                message: "🎯 بيانات العطل المدرسية",
                data: result.data
            });
        } else {
            res.status(400).json({
                status: 400,
                success: false,
                message: result.error
            });
        }

    } catch (error) {
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ أثناء جلب بيانات العطل",
            error: error.message
        });
    }
});

/**
 * نقطة النهاية لمستويات الجذاذات
 */
router.get("/jodadat/levels", async (req, res) => {
    try {
        const result = await scrapeJodadatLevels();
        
        if (result.success) {
            res.json({
                status: 200,
                success: true,
                message: "📚 مستويات الجذاذات",
                data: result.data
            });
        } else {
            res.status(400).json({
                status: 400,
                success: false,
                message: result.error
            });
        }

    } catch (error) {
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ أثناء جلب مستويات الجذاذات",
            error: error.message
        });
    }
});

/**
 * نقطة النهاية لمواد مستوى معين
 */
router.get("/jodadat/subjects", async (req, res) => {
    const { levelUrl } = req.query;
    
    if (!levelUrl) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: "يجب تقديم levelUrl كمعامل طلب"
        });
    }

    try {
        const result = await scrapeJodadatSubjects(levelUrl);
        
        if (result.success) {
            res.json({
                status: 200,
                success: true,
                message: "📖 مواد المستوى",
                data: result.data
            });
        } else {
            res.status(400).json({
                status: 400,
                success: false,
                message: result.error
            });
        }

    } catch (error) {
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ أثناء جلب المواد",
            error: error.message
        });
    }
});

/**
 * نقطة النهاية لملفات الجذاذات
 */
router.get("/jodadat/files", async (req, res) => {
    const { subjectUrl } = req.query;
    
    if (!subjectUrl) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: "يجب تقديم subjectUrl كمعامل طلب"
        });
    }

    try {
        const result = await scrapeJodadatFiles(subjectUrl);
        
        if (result.success) {
            res.json({
                status: 200,
                success: true,
                message: "📄 ملفات الجذاذات",
                data: result.data
            });
        } else {
            res.status(400).json({
                status: 400,
                success: false,
                message: result.error
            });
        }

    } catch (error) {
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ أثناء جلب الملفات",
            error: error.message
        });
    }
});

/**
 * نقطة النهاية لمستويات الامتحانات
 */
router.get("/exams/levels", async (req, res) => {
    try {
        const result = await scrapeExamsLevels();
        
        if (result.success) {
            res.json({
                status: 200,
                success: true,
                message: "📝 أنواع الامتحانات",
                data: result.data
            });
        } else {
            res.status(400).json({
                status: 400,
                success: false,
                message: result.error
            });
        }

    } catch (error) {
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ أثناء جلب مستويات الامتحانات",
            error: error.message
        });
    }
});

/**
 * نقطة النهاية الشاملة للبحث
 */
router.get("/search", async (req, res) => {
    const { section, levelUrl, subjectUrl } = req.query;
    
    try {
        let result;
        
        switch(section) {
            case 'holidays':
                result = await scrapeHolidays();
                break;
            case 'jodadat-levels':
                result = await scrapeJodadatLevels();
                break;
            case 'jodadat-subjects':
                if (!levelUrl) {
                    return res.status(400).json({
                        status: 400,
                        success: false,
                        message: "يجب تقديم levelUrl لمواد الجذاذات"
                    });
                }
                result = await scrapeJodadatSubjects(levelUrl);
                break;
            case 'jodadat-files':
                if (!subjectUrl) {
                    return res.status(400).json({
                        status: 400,
                        success: false,
                        message: "يجب تقديم subjectUrl لملفات الجذاذات"
                    });
                }
                result = await scrapeJodadatFiles(subjectUrl);
                break;
            case 'exams-levels':
                result = await scrapeExamsLevels();
                break;
            default:
                return res.status(400).json({
                    status: 400,
                    success: false,
                    message: "القسم غير معروف. الاختيارات: holidays, jodadat-levels, jodadat-subjects, jodadat-files, exams-levels"
                });
        }
        
        if (result.success) {
            res.json({
                status: 200,
                success: true,
                message: "✅ تمت العملية بنجاح",
                data: result.data
            });
        } else {
            res.status(400).json({
                status: 400,
                success: false,
                message: result.error
            });
        }

    } catch (error) {
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ أثناء البحث",
            error: error.message
        });
    }
});

module.exports = {
    path: "/api/search",
    name: "education scraper",
    type: "search",
    url: `${global.t}/api/search/sections`,
    logo: "https://qu.ax/obitoajajq.png",
    description: "استخراج الأقسام الدراسية من موقع متمدرس - العطل، الجذاذات، الامتحانات، الدروس",
    router
};
