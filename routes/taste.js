const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * سحب بيانات العطل المدرسية
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
            status: 200,
            success: true,
            data: {}
        };

        // البحث عن الصورة الرئيسية
        const mainImage = $('img[alt*="العطل المدرسية"]').first();
        if (mainImage.length) {
            result.data.image = mainImage.attr('src');
        }

        // البحث عن رابط PDF
        const pdfLink = $('a[href*=".pdf"]').filter((i, el) => $(el).text().includes('العطل')).first();
        if (pdfLink.length) {
            result.data.pdf = pdfLink.attr('href');
        }

        // استخراج النصوص المهمة
        const contentDiv = $('div.entry-content');
        if (contentDiv.length) {
            const importantInfo = [];
            contentDiv.find('p, h2, h3').each((i, el) => {
                const text = $(el).text().trim();
                if (text.match(/عطلة|العطل|مدرسية|اجازة|رسمية/i)) {
                    importantInfo.push(text);
                }
            });
            result.data.important_info = importantInfo.slice(0, 8);
        }

        res.json(result);

    } catch (error) {
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ في سحب بيانات العطل",
            error: error.message
        });
    }
});

/**
 * الحصول على مستويات الجذاذات
 */
router.get("/jodadat/levels", async (req, res) => {
    try {
        const jodadatUrl = "https://moutamadris.ma/jodadat/";
        
        const response = await axios.get(jodadatUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const result = {
            status: 200,
            success: true,
            data: {
                title: $('h1.entry-title').text().trim(),
                levels: []
            }
        };

        // استخراج مستويات الجذاذات
        const readDiv = $('div.entry-content div.read');
        if (readDiv.length) {
            readDiv.find('a').each((i, el) => {
                const levelName = $(el).text().trim();
                const levelUrl = $(el).attr('href');
                result.data.levels.push({
                    id: i + 1,
                    name: levelName,
                    url: levelUrl
                });
            });
        }

        res.json(result);

    } catch (error) {
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ في سحب مستويات الجذاذات",
            error: error.message
        });
    }
});

/**
 * الحصول على مواد مستوى معين من الجذاذات
 */
router.get("/jodadat/level/:levelId", async (req, res) => {
    try {
        const levelId = req.params.levelId;
        
        // الحصول على المستويات أولاً
        const levelsResponse = await axios.get(`${req.protocol}://${req.get('host')}/api/study/jodadat/levels`);
        const levels = levelsResponse.data.data.levels;
        
        const level = levels.find(l => l.id == levelId);
        if (!level) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "المستوى غير موجود"
            });
        }

        const response = await axios.get(level.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const result = {
            status: 200,
            success: true,
            data: {
                level_name: level.name,
                title: $('h1.entry-title').text().trim() || $('h2').first().text().trim(),
                subjects: []
            }
        };

        // استخراج المواد
        const readDiv = $('div.entry-content div.read');
        if (readDiv.length) {
            readDiv.find('a').each((i, el) => {
                const subjectName = $(el).text().trim();
                const subjectUrl = $(el).attr('href');
                result.data.subjects.push({
                    id: i + 1,
                    name: subjectName,
                    url: subjectUrl
                });
            });
        }

        res.json(result);

    } catch (error) {
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ في سحب مواد المستوى",
            error: error.message
        });
    }
});

/**
 * الحصول على ملفات جذاذات مادة معينة
 */
router.get("/jodadat/subject/:subjectId", async (req, res) => {
    try {
        const subjectId = req.params.subjectId;
        const levelId = req.query.levelId;

        if (!levelId) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "يرجى إدخال levelId"
            });
        }

        // الحصول على مواد المستوى أولاً
        const subjectsResponse = await axios.get(`${req.protocol}://${req.get('host')}/api/study/jodadat/level/${levelId}`);
        const subjects = subjectsResponse.data.data.subjects;
        
        const subject = subjects.find(s => s.id == subjectId);
        if (!subject) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "المادة غير موجودة"
            });
        }

        const response = await axios.get(subject.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const result = {
            status: 200,
            success: true,
            data: {
                subject_name: subject.name,
                title: $('h1.entry-title').text().trim(),
                files: []
            }
        };

        // استخراج ملفات الجذاذات من الجداول
        $('table').each((i, table) => {
            $(table).find('tr').slice(1).each((j, row) => {
                const cols = $(row).find('td');
                if (cols.length >= 2) {
                    const fileName = $(cols[0]).text().trim();
                    const downloadLink = $(cols[1]).find('a');
                    if (downloadLink.length) {
                        result.data.files.push({
                            id: result.data.files.length + 1,
                            name: fileName,
                            url: downloadLink.attr('href')
                        });
                    }
                }
            });
        });

        // إذا لم توجد جداول، البحث عن روابط PDF مباشرة
        if (result.data.files.length === 0) {
            $('a[href*=".pdf"], a[href*=".doc"]').each((i, el) => {
                const linkText = $(el).text().trim();
                if (linkText) {
                    result.data.files.push({
                        id: i + 1,
                        name: linkText,
                        url: $(el).attr('href')
                    });
                }
            });
        }

        res.json(result);

    } catch (error) {
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ في سحب ملفات الجذاذات",
            error: error.message
        });
    }
});

/**
 * الحصول على أنواع الامتحانات
 */
router.get("/exams/levels", async (req, res) => {
    try {
        const examsUrl = "https://moutamadris.ma/examens/";
        
        const response = await axios.get(examsUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const result = {
            status: 200,
            success: true,
            data: {
                title: $('h1.entry-title').text().trim(),
                exam_types: []
            }
        };

        // استخراج أنواع الامتحانات من أقسام read و yellow
        $('div.entry-content div.read a, div.entry-content div.yellow a').each((i, el) => {
            const examName = $(el).text().trim();
            const examUrl = $(el).attr('href');
            result.data.exam_types.push({
                id: i + 1,
                name: examName,
                url: examUrl
            });
        });

        res.json(result);

    } catch (error) {
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ في سحب أنواع الامتحانات",
            error: error.message
        });
    }
});

/**
 * الحصول على مواد امتحان معين
 */
router.get("/exams/level/:examId", async (req, res) => {
    try {
        const examId = req.params.examId;
        
        // الحصول على أنواع الامتحانات أولاً
        const examsResponse = await axios.get(`${req.protocol}://${req.get('host')}/api/study/exams/levels`);
        const exams = examsResponse.data.data.exam_types;
        
        const exam = exams.find(e => e.id == examId);
        if (!exam) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "نوع الامتحان غير موجود"
            });
        }

        const response = await axios.get(exam.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const result = {
            status: 200,
            success: true,
            data: {
                exam_name: exam.name,
                title: $('h1.entry-title').text().trim() || $('h2').first().text().trim(),
                subjects: []
            }
        };

        // استخراج المواد من أقسام mawad
        $('div.mawad a').each((i, el) => {
            const subjectName = $(el).text().trim();
            const subjectUrl = $(el).attr('href');
            result.data.subjects.push({
                id: i + 1,
                name: subjectName,
                url: subjectUrl
            });
        });

        res.json(result);

    } catch (error) {
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ في سحب مواد الامتحان",
            error: error.message
        });
    }
});

/**
 * الحصول على ملفات امتحانات مادة معينة
 */
router.get("/exams/subject/:subjectId", async (req, res) => {
    try {
        const subjectId = req.params.subjectId;
        const examId = req.query.examId;

        if (!examId) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "يرجى إدخال examId"
            });
        }

        // الحصول على مواد الامتحان أولاً
        const subjectsResponse = await axios.get(`${req.protocol}://${req.get('host')}/api/study/exams/level/${examId}`);
        const subjects = subjectsResponse.data.data.subjects;
        
        const subject = subjects.find(s => s.id == subjectId);
        if (!subject) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "المادة غير موجودة"
            });
        }

        const response = await axios.get(subject.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const result = {
            status: 200,
            success: true,
            data: {
                subject_name: subject.name,
                title: $('h1.entry-title').text().trim(),
                exam_files: []
            }
        };

        // استخراج ملفات الامتحانات من الجداول
        $('table').each((i, table) => {
            const headers = $(table).find('h3');
            let currentStream = "";
            
            headers.each((j, header) => {
                currentStream = $(header).text().trim();
            });

            $(table).find('tr').slice(1).each((j, row) => {
                const cols = $(row).find('td');
                if (cols.length >= 3) {
                    const examName = $(cols[0]).text().trim();
                    const normalLink = $(cols[1]).find('a');
                    const remedialLink = $(cols[2]).find('a');

                    if (normalLink.length) {
                        result.data.exam_files.push({
                            id: result.data.exam_files.length + 1,
                            name: `${examName} - الدورة العادية`,
                            stream: currentStream,
                            url: normalLink.attr('href')
                        });
                    }

                    if (remedialLink.length) {
                        result.data.exam_files.push({
                            id: result.data.exam_files.length + 1,
                            name: `${examName} - الدورة الاستدراكية`,
                            stream: currentStream,
                            url: remedialLink.attr('href')
                        });
                    }
                }
            });
        });

        res.json(result);

    } catch (error) {
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ في سحب ملفات الامتحانات",
            error: error.message
        });
    }
});

/**
 * الحصول على مستويات الدروس والتمارين
 */
router.get("/courses/levels", async (req, res) => {
    try {
        const coursesUrl = "https://moutamadris.ma/cours/";
        
        const response = await axios.get(coursesUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const result = {
            status: 200,
            success: true,
            data: {
                title: $('h1.entry-title').text().trim(),
                levels: []
            }
        };

        // استخراج مستويات الدروس
        $('div.entry-content div.read a').each((i, el) => {
            const levelName = $(el).text().trim();
            const levelUrl = $(el).attr('href');
            result.data.levels.push({
                id: i + 1,
                name: levelName,
                url: levelUrl
            });
        });

        res.json(result);

    } catch (error) {
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ في سحب مستويات الدروس",
            error: error.message
        });
    }
});

/**
 * الحصول على مواد مستوى معين من الدروس
 */
router.get("/courses/level/:levelId", async (req, res) => {
    try {
        const levelId = req.params.levelId;
        
        // الحصول على المستويات أولاً
        const levelsResponse = await axios.get(`${req.protocol}://${req.get('host')}/api/study/courses/levels`);
        const levels = levelsResponse.data.data.levels;
        
        const level = levels.find(l => l.id == levelId);
        if (!level) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "المستوى غير موجود"
            });
        }

        const response = await axios.get(level.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const result = {
            status: 200,
            success: true,
            data: {
                level_name: level.name,
                title: $('h1.entry-title').text().trim(),
                subjects: []
            }
        };

        // استخراج المواد من قسم mawad
        $('div.mawad a').each((i, el) => {
            const subjectName = $(el).text().trim();
            const subjectUrl = $(el).attr('href');
            result.data.subjects.push({
                id: i + 1,
                name: subjectName,
                url: subjectUrl
            });
        });

        res.json(result);

    } catch (error) {
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ في سحب مواد المستوى",
            error: error.message
        });
    }
});

/**
 * الحصول على وحدات ودروس مادة معينة
 */
router.get("/courses/subject/:subjectId", async (req, res) => {
    try {
        const subjectId = req.params.subjectId;
        const levelId = req.query.levelId;

        if (!levelId) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "يرجى إدخال levelId"
            });
        }

        // الحصول على مواد المستوى أولاً
        const subjectsResponse = await axios.get(`${req.protocol}://${req.get('host')}/api/study/courses/level/${levelId}`);
        const subjects = subjectsResponse.data.data.subjects;
        
        const subject = subjects.find(s => s.id == subjectId);
        if (!subject) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "المادة غير موجودة"
            });
        }

        const response = await axios.get(subject.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const result = {
            status: 200,
            success: true,
            data: {
                subject_name: subject.name,
                title: $('h1.entry-title').text().trim(),
                modules: []
            }
        };

        let currentModule = "";
        const lessons = [];

        // استخراج الوحدات والدروس
        $('div.entry-content h2, div.entry-content li.medium-8').each((i, el) => {
            if ($(el).is('h2')) {
                currentModule = $(el).text().trim();
            } else if ($(el).is('li')) {
                const link = $(el).find('a');
                if (link.length) {
                    const lessonName = link.text().trim();
                    const lessonUrl = link.attr('href');
                    const numCount = $(el).find('.num-count').text().trim();
                    
                    lessons.push({
                        module: currentModule,
                        name: lessonName,
                        url: lessonUrl,
                        number: numCount || (lessons.length + 1).toString()
                    });
                }
            }
        });

        // تجميع الدروس حسب الوحدات
        const modulesMap = new Map();
        lessons.forEach(lesson => {
            if (!modulesMap.has(lesson.module)) {
                modulesMap.set(lesson.module, []);
            }
            modulesMap.get(lesson.module).push({
                id: modulesMap.get(lesson.module).length + 1,
                name: lesson.name,
                url: lesson.url,
                number: lesson.number
            });
        });

        modulesMap.forEach((lessons, moduleName) => {
            result.data.modules.push({
                name: moduleName,
                lessons: lessons
            });
        });

        res.json(result);

    } catch (error) {
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ في سحب وحدات المادة",
            error: error.message
        });
    }
});

/**
 * الحصول على تفاصيل درس معين
 */
router.get("/courses/lesson/:lessonId", async (req, res) => {
    try {
        const lessonId = req.params.lessonId;
        const subjectId = req.query.subjectId;
        const levelId = req.query.levelId;

        if (!subjectId || !levelId) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "يرجى إدخال subjectId و levelId"
            });
        }

        // الحصول على دروس المادة أولاً
        const subjectsResponse = await axios.get(`${req.protocol}://${req.get('host')}/api/study/courses/subject/${subjectId}?levelId=${levelId}`);
        const modules = subjectsResponse.data.data.modules;
        
        let targetLesson = null;
        let targetModule = "";

        // البحث عن الدرس في جميع الوحدات
        for (const module of modules) {
            const lesson = module.lessons.find(l => l.id == lessonId);
            if (lesson) {
                targetLesson = lesson;
                targetModule = module.name;
                break;
            }
        }

        if (!targetLesson) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "الدرس غير موجود"
            });
        }

        const response = await axios.get(targetLesson.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const result = {
            status: 200,
            success: true,
            data: {
                lesson_name: targetLesson.name,
                module_name: targetModule,
                title: $('h1.entry-title').text().trim(),
                description: $('div.entry-content p').first().text().trim(),
                materials: [],
                additional_links: [],
                pdf_files: []
            }
        };

        // استخراج المواد التعليمية من الجداول
        $('table#tableone').each((i, table) => {
            const headers = [];
            $(table).find('th').each((j, th) => {
                headers.push($(th).text().trim());
            });

            $(table).find('tr').slice(1).each((j, row) => {
                const cols = $(row).find('td');
                const rowData = {};
                
                cols.each((k, col) => {
                    const links = $(col).find('a');
                    const linkData = [];
                    
                    links.each((l, link) => {
                        const linkText = $(link).text().trim();
                        const linkUrl = $(link).attr('href');
                        if (linkText && linkText !== "تحميل") {
                            linkData.push({
                                text: linkText,
                                url: linkUrl
                            });
                        } else if (linkUrl) {
                            linkData.push({
                                text: "تحميل",
                                url: linkUrl
                            });
                        }
                    });
                    
                    rowData[headers[k] || `col_${k}`] = linkData.length > 0 ? linkData : $(col).text().trim();
                });
                
                if (Object.keys(rowData).length > 0) {
                    result.data.materials.push(rowData);
                }
            });
        });

        // استخراج الروابط الإضافية
        $('div.read a').each((i, el) => {
            result.data.additional_links.push({
                id: i + 1,
                name: $(el).text().trim(),
                url: $(el).attr('href')
            });
        });

        // استخراج ملفات PDF مباشرة
        $('a[href*=".pdf"]').each((i, el) => {
            const pdfText = $(el).text().trim();
            result.data.pdf_files.push({
                id: i + 1,
                name: pdfText || "ملف PDF",
                url: $(el).attr('href')
            });
        });

        res.json(result);

    } catch (error) {
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ في سحب تفاصيل الدرس",
            error: error.message
        });
    }
});

module.exports = {
    path: "/api/study",
    name: "متمدرس - استخراج البيانات الدراسية",
    type: "education",
    description: "أداة استخراج البيانات الدراسية من موقع متمدرس تشمل العطل، الجذاذات، الامتحانات، والدروس والتمارين",
    endpoints: [
        {
            method: "GET",
            path: "/holidays",
            description: "سحب بيانات العطل المدرسية"
        },
        {
            method: "GET", 
            path: "/jodadat/levels",
            description: "الحصول على مستويات الجذاذات"
        },
        {
            method: "GET",
            path: "/jodadat/level/:levelId", 
            description: "الحصول على مواد مستوى معين من الجذاذات"
        },
        {
            method: "GET",
            path: "/jodadat/subject/:subjectId",
            description: "الحصول على ملفات جذاذات مادة معينة"
        },
        {
            method: "GET",
            path: "/exams/levels",
            description: "الحصول على أنواع الامتحانات"
        },
        {
            method: "GET",
            path: "/exams/level/:examId",
            description: "الحصول على مواد امتحان معين"
        },
        {
            method: "GET",
            path: "/exams/subject/:subjectId",
            description: "الحصول على ملفات امتحانات مادة معينة"
        },
        {
            method: "GET",
            path: "/courses/levels",
            description: "الحصول على مستويات الدروس والتمارين"
        },
        {
            method: "GET",
            path: "/courses/level/:levelId",
            description: "الحصول على مواد مستوى معين من الدروس"
        },
        {
            method: "GET",
            path: "/courses/subject/:subjectId",
            description: "الحصول على وحدات ودروس مادة معينة"
        },
        {
            method: "GET",
            path: "/courses/lesson/:lessonId",
            description: "الحصول على تفاصيل درس معين"
        }
    ],
    router
};
