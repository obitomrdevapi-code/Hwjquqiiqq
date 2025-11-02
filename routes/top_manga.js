// بسم الله الرحمن الرحيم ✨
// Top Manga API
// API لجلب قائمة أفضل المانجا من MyAnimeList

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

// أنواع المانجا المتاحة
const mangaTypes = {
    manga: { name: "Manga", description: "المانجا العادية" },
    oneshots: { name: "One-shots", description: "المانجا ذات الفصل الواحد" },
    doujin: { name: "Doujinshi", description: "الدوجينشي" },
    lightnovels: { name: "Light Novels", description: "الروايات الخفيفة" },
    novels: { name: "Novels", description: "الروايات" },
    manhwa: { name: "Manhwa", description: "المانهوا الكورية" },
    manhua: { name: "Manhua", description: "المانهوا الصينية" },
    bypopularity: { name: "By Popularity", description: "حسب الشعبية" },
    favorite: { name: "Favorite", description: "المفضلة" }
};

/**
 * جلب قائمة أفضل المانجا
 * @param {string} type - نوع المانجا
 * @returns {Promise<array>}
 */
async function topManga(type = 'manga') {
    return new Promise((resolve, reject) => {
        axios.get('https://myanimelist.net/topmanga.php?type=' + type, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Cache-Control': 'max-age=0'
            },
            timeout: 30000
        })
        .then(({ data }) => {
            let $ = cheerio.load(data);
            let results = [];
            
            $('tr.ranking-list').each(function (a, b) {
                const titleElement = $(b).find('td.title.al.va-t.clearfix.word-break > div > h3');
                const infoElement = $(b).find('td.title.al.va-t.clearfix.word-break > div > div.information.di-ib.mt4');
                const ratingElement = $(b).find('td.score.ac.fs14 > div');
                const linkElement = $(b).find('td.title.al.va-t.clearfix.word-break > div > h3 > a');
                const imageElement = $(b).find('td.title.al.va-t.clearfix.word-break > a > img');
                
                // استخراج المعلومات من النص
                const infoText = infoElement.text().trim();
                const infoParts = infoText.split('\n').map(part => part.trim()).filter(part => part);
                
                let members = '';
                let published = '';
                let volumes = '';
                let chapters = '';
                
                if (infoParts.length >= 3) {
                    published = infoParts[0];
                    members = infoParts[2];
                    
                    // استخراج الفصول والمجلدات إذا كانت موجودة
                    if (infoParts[1].includes('vols') || infoParts[1].includes('ch')) {
                        const volChapMatch = infoParts[1].match(/(\d+)\s*vols?.*?(\d+)\s*ch/);
                        if (volChapMatch) {
                            volumes = volChapMatch[1];
                            chapters = volChapMatch[2];
                        }
                    }
                }
                
                results.push({
                    rank: $(b).find('td.rank.ac > span').text().trim(),
                    title: titleElement.text().trim(),
                    info: infoText,
                    rating: ratingElement.text().trim(),
                    detail_url: linkElement.attr('href'),
                    image_url: imageElement.attr('data-src') || imageElement.attr('src'),
                    members: members,
                    published: published,
                    volumes: volumes,
                    chapters: chapters,
                    mal_id: linkElement.attr('href') ? linkElement.attr('href').split('/')[4] : null
                });
            });
            
            resolve(results);
        })
        .catch(error => {
            console.error('Error fetching top manga:', error.message);
            reject(new Error('Failed to fetch manga data: ' + error.message));
        });
    });
}

/**
 * نقطة النهاية الرئيسية - أفضل المانجا
 * مثال:
 *   /api/manga/top?type=manga
 */
router.get("/top_manga", async (req, res) => {
    const type = req.query.type || 'manga';
    const limit = parseInt(req.query.limit) || 50;
    
    // التحقق من صحة النوع
    if (!mangaTypes[type]) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: "⚠️ نوع المانجا غير صالح",
            available_types: Object.keys(mangaTypes).map(key => ({
                type: key,
                name: mangaTypes[key].name,
                description: mangaTypes[key].description
            }))
        });
    }

    try {
        console.log(`Fetching top ${type} manga...`);
        
        let results = await topManga(type);
        
        // تطبيق الحد إذا كان مطلوباً
        if (limit > 0 && results.length > limit) {
            results = results.slice(0, limit);
        }

        if (results.length === 0) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "🚫 لم يتم العثور على بيانات المانجا"
            });
        }

        res.json({
            status: 200,
            success: true,
            data: {
                type: type,
                type_name: mangaTypes[type].name,
                type_description: mangaTypes[type].description,
                total_results: results.length,
                manga: results
            }
        });
        
    } catch (err) {
        console.error('Manga API Error:', err.message);
        
        let errorMessage = "حدث خطأ أثناء جلب بيانات المانجا";
        let statusCode = 500;
        
        if (err.message.includes('Failed to fetch')) {
            errorMessage = "فشل في الاتصال بخادم MyAnimeList. حاول مرة أخرى لاحقاً";
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
 * نقطة النهاية - أنواع المانجا المتاحة
 * مثال:
 *   /api/manga/types
 */
router.get("/types_manga", async (req, res) => {
    const typesList = Object.keys(mangaTypes).map(key => ({
        type: key,
        name: mangaTypes[key].name,
        description: mangaTypes[key].description,
        example_url: `${global.t}/api/anime/top_manga?type=${key}`
    }));

    res.json({
        status: 200,
        success: true,
        data: {
            total_types: typesList.length,
            types: typesList
        }
    });
});

/**
 * نقطة النهاية - أفضل المانجا من جميع الأنواع
 * مثال:
 *   /api/manga/all
 */
router.get("/manga_top_all", async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    
    try {
        const allTypes = ['manga', 'manhwa', 'manhua', 'lightnovels'];
        const results = {};
        
        for (const type of allTypes) {
            try {
                const mangaList = await topManga(type);
                results[type] = {
                    name: mangaTypes[type].name,
                    data: mangaList.slice(0, limit)
                };
            } catch (error) {
                results[type] = {
                    name: mangaTypes[type].name,
                    error: error.message
                };
            }
        }

        res.json({
            status: 200,
            success: true,
            data: {
                total_categories: Object.keys(results).length,
                categories: results
            }
        });
        
    } catch (err) {
        console.error('All Manga API Error:', err.message);
        
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ أثناء جلب بيانات جميع المانجا",
            error: err.message
        });
    }
});

module.exports = {
    path: "/api/anime",
    name: "top manga",
    type: "anime",
    url: `${global.t}/api/anime/manga_top?type=manga&limit=10`,
    logo: "",
    description: "جلب قائمة توب المانجا الحاليا",
    router
};