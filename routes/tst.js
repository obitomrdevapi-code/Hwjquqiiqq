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

// التأكد من وجود مجلد الجلسات
function removeFile(FilePath) {
    try {
        if (!fs.existsSync(FilePath)) return false;
        fs.rmSync(FilePath, { recursive: true, force: true });
    } catch (e) {
        console.error('خطأ في إزالة الملف:', e);
    }
}

router.get("/session", async (req, res) => {
    let num = req.query.num;
    let dirs = './' + (num || `session`);

    // إزالة الجلسة الموجودة إن وجدت
    await removeFile(dirs);

    // تنظيف رقم الهاتف - إزالة أي أحرف غير رقمية
    num = num.replace(/[^0-9]/g, '');

    // التحقق من صحة رقم الهاتف باستخدام awesome-phonenumber
    const phone = pn('+' + num);
    if (!phone.isValid()) {
        if (!res.headersSent) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: "رقم هاتف غير صالح. يرجى إدخال الرقم الدولي الكامل (مثال: 15551234567 للولايات المتحدة، 447911123456 للمملكة المتحدة، 84987654321 لفيتنام، إلخ.) بدون + أو مسافات."
            });
        }
        return;
    }
    // استخدام تنسيق الرقم الدولي (E164، بدون '+')
    num = phone.getNumber('e164').replace('+', '');

    async function initiateSession() {
        const { state, saveCreds } = await useMultiFileAuthState(dirs);

        try {
            const { version, isLatest } = await fetchLatestBaileysVersion();
            let KnightBot = makeWASocket({
                version,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino().child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino().child({ level: "fatal" }),
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

                        // إرسال صورة الفيديو مع التسمية
                        await KnightBot.sendMessage(userJid, {
                            image: { url: 'https://img.youtube.com/vi/-oz_u1iMgf8/maxresdefault.jpg' },
                            caption: `🎬 *KnightBot MD V2.0 دليل الإعداد الكامل!*\n\n🚀 إصلاح الأخطاء + أوامر جديدة + دردشة ذكية سريعة\n📺 شاهد الآن: https://youtu.be/-oz_u1iMgf8`
                        });
                        console.log("🎬 تم إرسال دليل الفيديو بنجاح");

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
                        // لا تخرج من العملية، فقط أنهي بشكل أنيق
                    } catch (error) {
                        console.error("❌ خطأ في إرسال الرسائل:", error);
                        // لا يزال تنظيف الجلسة حتى إذا فشل الإرسال
                        removeFile(dirs);
                        // لا تخرج من العملية، فقط أنهي بشكل أنيق
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
                        console.log("🔁 تم إغلاق الاتصال — إعادة التشغيل...");
                        initiateSession();
                    }
                }
            });

            if (!KnightBot.authState.creds.registered) {
                await delay(3000); // انتظر 3 ثوان قبل طلب رمز الاقتران
                num = num.replace(/[^\d+]/g, '');
                if (num.startsWith('+')) num = num.substring(1);

                try {
                    let code = await KnightBot.requestPairingCode(num);
                    code = code?.match(/.{1,4}/g)?.join('-') || code;
                    if (!res.headersSent) {
                        console.log({ num, code });
                        await res.json({
                            status: 200,
                            success: true,
                            message: "تم إنشاء رمز الاقتران بنجاح",
                            data: {
                                number: num,
                                pairing_code: code
                            }
                        });
                    }
                } catch (error) {
                    console.error('خطأ في طلب رمز الاقتران:', error);
                    if (!res.headersSent) {
                        res.status(503).json({
                            status: 503,
                            success: false,
                            message: "فشل في الحصول على رمز الاقتران. يرجى التحقق من رقم هاتفك والمحاولة مرة أخرى."
                        });
                    }
                }
            }

            KnightBot.ev.on('creds.update', saveCreds);
        } catch (err) {
            console.error('خطأ في بدء الجلسة:', err);
            if (!res.headersSent) {
                res.status(503).json({
                    status: 503,
                    success: false,
                    message: "الخدمة غير متاحة"
                });
            }
        }
    }

    await initiateSession();
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
    console.log('تم التقاط استثناء: ', err);
});

module.exports = {
  path: "/api/tools",
  name: "whatsapp session",
  type: "tools",
  url: `${global.t ||}/api/tools/session?num=15551234567`,
  logo: "https://cdn-icons-png.flaticon.com/512/124/124034.png",
  description: "إنشاء جلسة واتساب عبر الرقم الدولي",
  router
};