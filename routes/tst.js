// بسم الله الرحمن الرحيم ✨
// WhatsApp Session Generator API
// إنشاء جلسة واتساب وإرسالها عبر الرقم

const express = require("express");
const fs = require("fs");
const pino = require("pino");
const { 
    makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    makeCacheableSignalKeyStore, 
    Browsers, 
    jidNormalizedUser, 
    fetchLatestBaileysVersion 
} = require("@whiskeysockets/baileys");
const pn = require("awesome-phonenumber");

const router = express.Router();

/**
 * إزالة الملفات والمجلدات
 * @param {string} FilePath - مسار الملف/المجلد
 * @returns {boolean}
 */
function removeFile(FilePath) {
    try {
        if (!fs.existsSync(FilePath)) return false;
        fs.rmSync(FilePath, { recursive: true, force: true });
        return true;
    } catch (e) {
        console.error('❌ خطأ في إزالة الملف:', e);
        return false;
    }
}

/**
 * التحقق من صحة الرقم الدولي
 * @param {string} num - رقم الهاتف
 * @returns {object}
 */
function validatePhoneNumber(num) {
    try {
        const phone = pn('+' + num);
        if (!phone.isValid()) {
            return {
                valid: false,
                message: "رقم هاتف غير صالح. يرجى إدخال الرقم الدولي الكامل (مثال: 15551234567 للولايات المتحدة، 447911123456 للمملكة المتحدة، 84987654321 لفيتنام، إلخ.) بدون + أو مسافات."
            };
        }
        return {
            valid: true,
            number: phone.getNumber('e164').replace('+', '')
        };
    } catch (error) {
        return {
            valid: false,
            message: "خطأ في التحقق من رقم الهاتف"
        };
    }
}

/**
 * بدء جلسة واتساب وإنشاء QR
 * @param {string} num - رقم الهاتف
 * @param {object} res - كائن الاستجابة
 */
async function initiateSession(num, res) {
    const dirs = './' + (num || `session`);
    
    // تنظيف الجلسة السابقة إن وجدت
    await removeFile(dirs);

    const { state, saveCreds } = await useMultiFileAuthState(dirs);

    try {
        const { version } = await fetchLatestBaileysVersion();
        
        const KnightBot = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            printQRInTerminal: false,
            logger: pino({ level: "fatal" }).child({ level: "fatal" }),
            browser: Browsers.windows('Chrome'),
            markOnlineOnConnect: false,
            generateHighQualityLinkPreview: false,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 30000,
            retryRequestDelayMs: 250,
            maxRetries: 5,
        });

        KnightBot.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, isNewLogin, isOnline } = update;

            if (connection === 'open') {
                console.log("✅ تم الاتصال بنجاح!");
                console.log("📱 جاري إرسال ملف الجلسة للمستخدم...");
                
                try {
                    const sessionKnight = fs.readFileSync(dirs + '/creds.json');

                    // إرسال ملف الجلسة للمستخدم
                    const userJid = jidNormalizedUser(num + '@s.whatsapp.net');
                    await KnightBot.sendMessage(userJid, {
                        document: sessionKnight,
                        mimetype: 'application/json',
                        fileName: 'creds.json'
                    });
                    console.log("📄 تم إرسال ملف الجلسة بنجاح");

                    // إرسال الفيديو التوضيحي
                    await KnightBot.sendMessage(userJid, {
                        image: { url: 'https://img.youtube.com/vi/-oz_u1iMgf8/maxresdefault.jpg' },
                        caption: `🎬 *KnightBot MD V2.0 دليل الإعداد الكامل!*\n\n🚀 إصلاح الأخطاء + أوامر جديدة + دردشة ذكية سريعة\n📺 شاهد الآن: https://youtu.be/-oz_u1iMgf8`
                    });
                    console.log("🎬 تم إرسال الدليل بنجاح");

                    // إرسال رسالة تحذير
                    await KnightBot.sendMessage(userJid, {
                        text: `⚠️ لا تشارك هذا الملف مع أي شخص ⚠️\n 
┌┤✑  شكراً لاستخدامك Knight Bot
│└────────────┈ ⳹        
│©2024 Mr Unique Hacker 
└─────────────────┈ ⳹\n\n`
                    });
                    console.log("⚠️ تم إرسال رسالة التحذير بنجاح");

                    // تنظيف الجلسة بعد الاستخدام
                    console.log("🧹 جاري تنظيف الجلسة...");
                    await delay(1000);
                    removeFile(dirs);
                    console.log("✅ تم تنظيف الجلسة بنجاح");
                    console.log("🎉 اكتملت العملية بنجاح!");
                } catch (error) {
                    console.error("❌ خطأ في إرسال الرسائل:", error);
                    removeFile(dirs);
                }
            }

            if (isNewLogin) {
                console.log("🔐 تسجيل دخول جديد عبر رمز الاقتران");
            }

            if (isOnline) {
                console.log("📶 العميل متصل بالإنترنت");
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;

                if (statusCode === 401) {
                    console.log("❌ تم تسجيل الخروج من واتساب. تحتاج إلى إنشاء رمز اقتران جديد.");
                } else {
                    console.log("🔁 تم إغلاق الاتصال - إعادة التشغيل...");
                    initiateSession(num, res);
                }
            }
        });

        if (!KnightBot.authState.creds.registered) {
            await delay(3000);
            const cleanNum = num.replace(/[^\d+]/g, '');
            
            try {
                let code = await KnightBot.requestPairingCode(cleanNum);
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                if (!res.headersSent) {
                    console.log({ num: cleanNum, code });
                    res.send({ code });
                }
            } catch (error) {
                console.error('خطأ في طلب رمز الاقتران:', error);
                if (!res.headersSent) {
                    res.status(503).send({ 
                        status: 503,
                        success: false,
                        message: 'فشل في الحصول على رمز الاقتران. يرجى التحقق من رقم هاتفك والمحاولة مرة أخرى.'
                    });
                }
            }
        }

        KnightBot.ev.on('creds.update', saveCreds);
    } catch (err) {
        console.error('خطأ في بدء الجلسة:', err);
        if (!res.headersSent) {
            res.status(503).send({ 
                status: 503,
                success: false,
                message: 'الخدمة غير متاحة'
            });
        }
    }
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/whatsapp/session?num=15551234567
 */
router.get("/session", async (req, res) => {
    let num = req.query.num;
    
    if (!num) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: "⚠️ يرجى إدخال رقم هاتف عبر المعامل num"
        });
    }

    // تنظيف الرقم من الأحرف غير الرقمية
    num = num.replace(/[^0-9]/g, '');

    // التحقق من صحة الرقم
    const validation = validatePhoneNumber(num);
    if (!validation.valid) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: validation.message
        });
    }

    num = validation.number;

    try {
        await initiateSession(num, res);
    } catch (error) {
        console.error('❌ خطأ في العملية:', error);
        if (!res.headersSent) {
            res.status(500).json({
                status: 500,
                success: false,
                message: "حدث خطأ أثناء إنشاء الجلسة",
                error: error.message
            });
        }
    }
});

// معالج الاستثناءات العام
process.on('uncaughtException', (err) => {
    let e = String(err);
    if (e.includes("conflict")) return;
    if (e.includes("not-authorized")) return;
    if (e.includes("Socket connection timeout")) return;
    if (e.includes("rate-overlimit")) return;
    if (e.includes("Connection Closed")) return;
    if (e.includes("Timed Out")) return;
    if (e.includes("Value not found")) return;
    if (e.includes("Stream Errored")) return;
    if (e.includes("Stream Errored (restart required)")) return;
    if (e.includes("statusCode: 515")) return;
    if (e.includes("statusCode: 503")) return;
    console.log('📌 استثناء تم التقاطه: ', err);
});

module.exports = {
  path: "/api/tools",
  name: "whatsapp session",
  type: "tools",
  url: `${global.t}/api/tools/session?num=15551234567`,
  logo: "https://cdn-icons-png.flaticon.com/512/124/124034.png",
  description: "إنشاء جلسة واتساب عبر الرقم الدولي",
  router
};