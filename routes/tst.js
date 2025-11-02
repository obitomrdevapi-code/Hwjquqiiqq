// بسم الله الرحمن الرحيم ✨
// Manga Details API
// API لجلب تفاصيل المانجا والفصول والصور

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * جلب تفاصيل المانجا
 * @param {string} url - رابط المانجا
 * @returns {Promise<object>}
 */
async function getMangaDetails(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ar,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br'
            },
            timeout: 30000
        });

        const $ = cheerio.load(response.data);

        // دالة لاستخراج meta tags
        const pickMeta = (name) => {
            return $(`meta[property="${name}"]`).attr("content") ||
                   $(`meta[name="${name.replace("og:", "")}"]`).attr("content") ||
                   "";
        };

        // المعلومات الأساسية
        const title = pickMeta("og:title") || $("title").text().trim() || $("h1").first().text().trim();
        const description = pickMeta("og:description") || $('meta[name="description"]').attr("content") || "";
        const cover = pickMeta("og:image") || $(".cover img, .manga-cover img, img[alt*='cover']").first().attr("src") || "";

        // الأنواع
        const genres = [];
        $(".subtitle a, .genres a, .genre a, .tags a, .categories a").each((i, el) => {
            const text = $(el).text().trim();
            if (text) genres.push(text);
        });

        // المعلومات الإضافية
        const extra = {};
        $(".manga-info .info, .info, .manga-details li, .detail-row, .details span, .info-item").each((i, el) => {
            const textLine = $(el).text().trim();
            if (!textLine) return;
            const parts = textLine.split(/:|—|\n/).map(s => s.trim()).filter(Boolean);
            if (parts.length >= 2) {
                const key = parts[0].replace(/\s+/g, " ").trim();
                const value = parts.slice(1).join(":").trim();
                if (key && value) extra[key] = value;
            }
        });

        // الصور
        const imagesSet = new Set();
        $("img").each((i, img) => {
            const src = $(img).attr("src") || $(img).attr("data-src") || "";
            if (src && !src.startsWith("data:") && src.includes('cover')) {
                imagesSet.add(src.startsWith("http") ? src : new URL(src, url).href);
            }
        });
        const images = Array.from(imagesSet).slice(0, 10);

        // الفصل الأول
        let firstChapter = "";
        $("a").each((i, a) => {
            if (firstChapter) return;
            const href = $(a).attr("href") || "";
            const textA = $(a).text().replace(/\s+/g, " ").trim();
            if (/\/\d+$/.test(href) && /\/1$/.test(href)) {
                firstChapter = href.startsWith("http") ? href : new URL(href, url).href;
                return;
            }
            if (/الفصل\s*الاول|الفصل\s*1|chapter\s*1/i.test(textA) && href) {
                firstChapter = href.startsWith("http") ? href : new URL(href, url).href;
                return;
            }
        });

        // جميع الفصول
        const chapters = [];
        $("a").each((i, a) => {
            const href = $(a).attr("href") || "";
            const textA = $(a).text().replace(/\s+/g, " ").trim();
            
            if ((href.includes('/chapter/') || href.includes('/read/') || /\/\d+$/.test(href)) && 
                /الفصل|Chapter|chapter/i.test(textA)) {
                const chapterUrl = href.startsWith("http") ? href : new URL(href, url).href;
                const chapterNumber = textA.match(/(\d+)/)?.[1] || "0";
                
                chapters.push({
                    title: textA,
                    url: chapterUrl,
                    number: parseInt(chapterNumber),
                    id: chapterNumber
                });
            }
        });

        // إزالة التكرارات وترتيب الفصول
        const uniqueChapters = chapters.filter((chapter, index, self) => 
            index === self.findIndex(c => c.url === chapter.url)
        ).sort((a, b) => a.number - b.number);

        // التقييم إذا كان موجوداً
        const rating = $(".rating, .score, .rank").first().text().trim() || 
                      $('span[class*="rating"], span[class*="score"]').first().text().trim();

        // الحالة
        const status = $(".status, .manga-status").first().text().trim() || 
                      extra["الحالة"] || extra["Status"] || "";

        return {
            title: title,
            description: description,
            cover: cover,
            genres: [...new Set(genres)],
            extra: extra,
            images: images,
            first_chapter: firstChapter,
            chapters: uniqueChapters.slice(0, 50), // الحد الأقصى 50 فصل
            total_chapters: uniqueChapters.length,
            rating: rating,
            status: status,
            url: url
        };
    } catch (error) {
        console.error('Error fetching manga details:', error.message);
        throw new Error('Failed to fetch manga details: ' + error.message);
    }
}

/**
 * جلب صور الفصل
 * @param {string} chapterUrl - رابط الفصل
 * @returns {Promise<array>}
 */
async function getChapterImages(chapterUrl) {
    try {
        const response = await axios.get(chapterUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 30000
        });

        const $ = cheerio.load(response.data);

        const images = [];
        $("img").each((i, img) => {
            const src = $(img).attr("src") || $(img).attr("data-src") || "";
            if (src && !src.startsWith("data:") && 
                (src.includes('chapter') || src.includes('manga') || src.includes('page'))) {
                const fullUrl = src.startsWith("http") ? src : new URL(src, chapterUrl).href;
                images.push({
                    url: fullUrl,
                    page: i + 1
                });
            }
        });

        // إذا لم نجد صوراً، نجرب البحث في scripts
        if (images.length === 0) {
            const scripts = $('script').toString();
            const imageMatches = scripts.match(/"https?[^"]*\.(jpg|jpeg|png|webp)[^"]*"/gi) || [];
            imageMatches.forEach((match, index) => {
                const url = match.replace(/"/g, '');
                if (url.includes('chapter') || url.includes('manga')) {
                    images.push({
                        url: url,
                        page: index + 1
                    });
                }
            });
        }

        return images.slice(0, 100); // الحد الأقصى 100 صورة
    } catch (error) {
        console.error('Error fetching chapter images:', error.message);
        throw new Error('Failed to fetch chapter images: ' + error.message);
    }
}

/**
 * نقطة النهاية الرئيسية - تفاصيل المانجا
 * مثال:
 *   GET /api/manga/details?url=https://example.com/manga/naruto
 */
router.get("/details", async (req, res) => {
    const url = req.query.url;
    
    if (!url) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: "⚠️ يرجى تقديم رابط المانجا"
        });
    }

    try {
        console.log(`Fetching manga details from: ${url}`);
        
        const details = await getMangaDetails(url);

        if (!details.title) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "🚫 لم يتم العثور على معلومات المانجا"
            });
        }

        res.json({
            status: 200,
            success: true,
            data: details
        });
        
    } catch (err) {
        console.error('Manga Details API Error:', err.message);
        
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ أثناء جلب تفاصيل المانجا",
            error: err.message
        });
    }
});

/**
 * نقطة النهاية - صور الفصل
 * مثال:
 *   GET /api/manga/chapter?url=https://example.com/manga/naruto/chapter-1
 */
router.get("/chapter", async (req, res) => {
    const url = req.query.url;
    
    if (!url) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: "⚠️ يرجى تقديم رابط الفصل"
        });
    }

    try {
        console.log(`Fetching chapter images from: ${url}`);
        
        const images = await getChapterImages(url);

        if (images.length === 0) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "🚫 لم يتم العثور على صور للفصل"
            });
        }

        res.json({
            status: 200,
            success: true,
            data: {
                chapter_url: url,
                total_pages: images.length,
                images: images
            }
        });
        
    } catch (err) {
        console.error('Chapter Images API Error:', err.message);
        
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ أثناء جلب صور الفصل",
            error: err.message
        });
    }
});

/**
 * نقطة النهاية - البحث عن المانجا
 * مثال:
 *   GET /api/manga/search?q=naruto
 */
router.get("/search", async (req, res) => {
    const query = req.query.q;
    const site = req.query.site || "https://www.mangaread.org";
    
    if (!query) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: "⚠️ يرجى تقديم كلمة البحث"
        });
    }

    try {
        console.log(`Searching for manga: ${query}`);
        
        const searchUrl = `${site}/?s=${encodeURIComponent(query)}`;
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 30000
        });

        const $ = cheerio.load(response.data);

        const results = [];
        $('.manga, .post-item, .list-item, a[href*="/manga/"]').each((i, el) => {
            const title = $(el).find('h3, .title, .manga-title').text().trim();
            const link = $(el).attr('href') || $(el).find('a').attr('href');
            const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
            
            if (title && link) {
                results.push({
                    title: title,
                    url: link.startsWith("http") ? link : new URL(link, site).href,
                    image: image ? (image.startsWith("http") ? image : new URL(image, site).href) : null
                });
            }
        });

        if (results.length === 0) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "🚫 لم يتم العثور على مانجا مطابقة للبحث"
            });
        }

        res.json({
            status: 200,
            success: true,
            data: {
                search_query: query,
                total_results: results.length,
                results: results.slice(0, 20) // الحد الأقصى 20 نتيجة
            }
        });
        
    } catch (err) {
        console.error('Manga Search API Error:', err.message);
        
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ أثناء البحث عن المانجا",
            error: err.message
        });
    }
});

module.exports = {
    path: "/api/tools",
    name: "manga details",
    type: "tools",
    url: `${global.t}/api/tools/search?q=naruto`,
    logo: "https://cdn-icons-png.flaticon.com/512/2907/2907268.png",
    description: "جلب تفاصيل المانجا والفصول والصور",
    router
};