// بسم الله الرحمن الرحيم ✨
// Phone Search API
// API للبحث عن معلومات الهواتف من موقع raqamitv.com

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

/**
 * البحث عن الهواتف
 * @param {string} query - كلمة البحث
 * @returns {Promise<array>}
 */
async function fetchAndParseData(query) {
    try {
        const response = await axios.get('https://raqamitv.com/?s=' + encodeURIComponent(query), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ar,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br'
            },
            timeout: 30000
        });

        const $ = cheerio.load(response.data);

        const posts = $('.post-item').map((index, element) => {
            const title = $(element).find('.post-title a').text().trim();
            const link = $(element).find('.post-title a').attr('href');
            const image = $(element).find('.post-thumb img').attr('src') || 
                         $(element).find('.post-thumb img').attr('data-src');
            const excerpt = $(element).find('.post-excerpt').text().trim();
            
            return { 
                id: index + 1,
                title: title,
                link: link,
                image_url: image,
                excerpt: excerpt
            };
        }).get();

        return posts;
    } catch (error) {
        console.error('Error fetching phone data:', error.message);
        throw new Error('Failed to fetch phone data: ' + error.message);
    }
}

/**
 * جلب محتوى مفصل للهاتف
 * @param {string} url - رابط الهاتف
 * @returns {Promise<object>}
 */
async function getPhoneDetails(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 30000
        });

        const $ = cheerio.load(response.data);

        // استخراج العنوان الرئيسي
        const title = $('h1.post-title').text().trim();

        // استخراج الصورة الرئيسية
        const mainImage = $('.post-thumb img').attr('src') || 
                         $('.post-thumb img').attr('data-src') ||
                         $('.entry-content img').first().attr('src');

        // استخراج المحتوى
        const content = [];
        $('.entry-content p').each((index, element) => {
            const text = $(element).text().trim();
            if (text && text.length > 10) { // تجاهل النصوص القصيرة
                content.push(text);
            }
        });

        // استخراج المواصفات إذا كانت موجودة في جداول
        const specifications = {};
        $('table tr').each((index, element) => {
            const key = $(element).find('td:first-child').text().trim();
            const value = $(element).find('td:last-child').text().trim();
            if (key && value) {
                specifications[key] = value;
            }
        });

        // استخراج السعر إذا كان موجوداً
        let price = '';
        $('.entry-content').find('strong, b').each((index, element) => {
            const text = $(element).text().trim();
            if (text.includes('سعر') || text.includes('ثمن') || text.includes('السعر') || text.match(/\d+/)) {
                price = text;
                return false;
            }
        });

        return {
            title: title,
            url: url,
            main_image: mainImage,
            price: price,
            content: content,
            specifications: specifications,
            content_full: content.join('\n\n')
        };
    } catch (error) {
        console.error('Error fetching phone details:', error.message);
        throw new Error('Failed to fetch phone details: ' + error.message);
    }
}

/**
 * نقطة النهاية الرئيسية - البحث عن الهواتف
 * مثال:
 *   /api/phones/search?q=samsung
 */
router.get("/raqamitv", async (req, res) => {
    const query = req.query.q;
    const limit = parseInt(req.query.limit) || 10;
    
    if (!query) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: "⚠️ يرجى تقديم اسم الهاتف للبحث عنه"
        });
    }

    try {
        console.log(`Searching for phones: ${query}`);
        
        let results = await fetchAndParseData(query);
        
        // تطبيق الحد إذا كان مطلوباً
        if (limit > 0 && results.length > limit) {
            results = results.slice(0, limit);
        }

        if (results.length === 0) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "🚫 لم يتم العثور على هواتف مطابقة للبحث"
            });
        }

        res.json({
            status: 200,
            success: true,
            data: {
                search_query: query,
                total_results: results.length,
                phones: results
            }
        });
        
    } catch (err) {
        console.error('Phone Search API Error:', err.message);
        
        let errorMessage = "حدث خطأ أثناء البحث عن الهواتف";
        let statusCode = 500;
        
        if (err.message.includes('Failed to fetch')) {
            errorMessage = "فشل في الاتصال بخادم البحث. حاول مرة أخرى لاحقاً";
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
 * نقطة النهاية - تفاصيل الهاتف
 * مثال:
 *   /api/phones/details?url=https://raqamitv.com/samsung-galaxy-s23
 */
router.get("/raqamitv_get", async (req, res) => {
    const url = req.query.url;
    
    if (!url) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: "⚠️ يرجى تقديم رابط الهاتف"
        });
    }

    // التحقق من أن الرابط ينتمي للموقع الصحيح
    if (!url.includes('raqamitv.com')) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: "❌ الرابط غير صالح. يجب أن يكون من موقع raqamitv.com"
        });
    }

    try {
        console.log(`Fetching phone details from: ${url}`);
        
        const details = await getPhoneDetails(url);

        if (!details.title) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "🚫 لم يتم العثور على تفاصيل الهاتف"
            });
        }

        res.json({
            status: 200,
            success: true,
            data: {
                phone: details
            }
        });
        
    } catch (err) {
        console.error('Phone Details API Error:', err.message);
        
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ أثناء جلب تفاصيل الهاتف",
            error: err.message
        });
    }
});

/**
 * نقطة النهاية - البحث مع التفاصيل الكاملة
 * مثال:
 *   /api/phones/full?q=iphone&limit=3
 */
router.get("/raqamitv_full", async (req, res) => {
    const query = req.query.q;
    const limit = parseInt(req.query.limit) || 3;
    
    if (!query) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: "⚠️ يرجى تقديم اسم الهاتف للبحث عنه"
        });
    }

    try {
        console.log(`Full search for phones: ${query}`);
        
        let searchResults = await fetchAndParseData(query);
        
        if (searchResults.length === 0) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "🚫 لم يتم العثور على هواتف مطابقة للبحث"
            });
        }

        // تطبيق الحد
        if (limit > 0 && searchResults.length > limit) {
            searchResults = searchResults.slice(0, limit);
        }

        // جلب التفاصيل لكل هاتف
        const detailedResults = [];
        for (const phone of searchResults) {
            try {
                const details = await getPhoneDetails(phone.link);
                detailedResults.push({
                    ...phone,
                    details: details
                });
            } catch (error) {
                detailedResults.push({
                    ...phone,
                    details: { error: "Failed to fetch details" }
                });
            }
        }

        res.json({
            status: 200,
            success: true,
            data: {
                search_query: query,
                total_results: detailedResults.length,
                phones: detailedResults
            }
        });
        
    } catch (err) {
        console.error('Full Phone Search API Error:', err.message);
        
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ أثناء البحث الكامل عن الهواتف",
            error: err.message
        });
    }
});

module.exports = {
    path: "/api/search",
    name: "raqamitv search",
    type: "search",
    url: `${global.t}/api/search/raqamitv?q=samsung`,
    logo: "",
    description: "البحث عن الهواتف وجلب اخر اخبارها من موقع raqamitv",
    router
};