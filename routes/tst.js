// بسم الله الرحمن الرحيم ✨
// WhatsApp Session Generator API
// إنشاء جلسة واتساب وإرسالها كرسالة نصية

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
 * تحويل ملف الجلسة إلى نص Base64
 * @param {string} filePath - مسار ملف الجلسة
 * @returns {string}
 */
function sessionToBase64(filePath) {
    try {
        const fileData = fs.readFileSync(filePath);
        return fileData.toString('base64');
    } catch (error) {
        throw new Error('فشل في قراءة ملف الجلسة');
    }
}

/**
 * تنظيف الجلسة المؤقتة
 * @param {string} dirPath - مسار المجلد
 */
function cleanupSession(dirPath) {
    try {
        if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true });
        }
    } catch (error) {
        console.error('❌ خطأ في التنظيف:', error);
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

    const cleanNum = validation.number;
    const sessionDir = `./temp_session_${cleanNum}_${Date.now()}`;

    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
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
        });

        let sessionSent = false;

        // معالج تحديث الاتصال
        KnightBot.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open' && !sessionSent) {
                console.log("✅ تم الاتصال بنجاح!");
                sessionSent = true;
                
                try {
                    // تحويل الجلسة إلى Base64
                    const sessionBase64 = sessionToBase64(sessionDir + '/creds.json');
                    const userJid = jidNormalizedUser(cleanNum + '@s.whatsapp.net');
                    
                    // إرسال الجلسة كرسالة نصية
                    await KnightBot.sendMessage(userJid, {
                        text: `🔐 *جلسة واتساب الخاصة بك*\n\n` +
                              `📄 *معلومات الجلسة:*\n` +
                              `• الرقم: ${cleanNum}\n` +
                              `• الوقت: ${new Date().toLocaleString()}\n\n` +
                              `📋 *بيانات الجلسة (Base64):*\n\`\`\`\n${sessionBase64}\n\`\`\`\n\n` +
                              `⚠️ *تحذير هام:*\n` +
                              `• لا تشارك هذه البيانات مع أي شخص\n` +
                              `• احفظها في مكان آمن\n` +
                              `• يمكنك استخدامها لاستعادة الجلسة\n\n` +
                              `🎬 *دليل الاستخدام:*\n` +
                              `https://youtu.be/-oz_u1iMgf8\n\n` +
                              `┌┤✑  شكراً لاستخدامك Knight Bot\n` +
                              `│└────────────┈ ⳹\n` +
                              `│©2024 Mr Unique Hacker\n` +
                              `└─────────────────┈ ⳹`
                    });

                    console.log("📨 تم إرسال الجلسة كرسالة نصية");

                    // تنظيف الجلسة المؤقتة
                    await delay(1000);
                    cleanupSession(sessionDir);
                    
                    console.log("🎉 اكتملت العملية بنجاح!");
                    
                } catch (error) {
                    console.error("❌ خطأ في إرسال الرسالة:", error);
                    cleanupSession(sessionDir);
                }
            }

            if (connection === 'close') {
                console.log("🔁 تم إغلاق الاتصال");
                if (!sessionSent) {
                    cleanupSession(sessionDir);
                }
            }
        });

        // طلب pairing code إذا لم يكن مسجلاً
        if (!KnightBot.authState.creds.registered) {
            await delay(2000);
            
            try {
                let code = await KnightBot.requestPairingCode(cleanNum);
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                
                console.log("📞 تم طلب pairing code للرقم:", cleanNum);
                
                return res.json({
                    status: 200,
                    success: true,
                    message: "تم إنشاء رمز الاقتران بنجاح",
                    data: {
                        number: cleanNum,
                        pairing_code: code,
                        instructions: "ادخل هذا الكود في واتساب على هاتفك لتلقي بيانات الجلسة"
                    }
                });
                
            } catch (error) {
                console.error('❌ خطأ في طلب رمز الاقتران:', error);
                cleanupSession(sessionDir);
                
                return res.status(500).json({
                    status: 500,
                    success: false,
                    message: "فشل في الحصول على رمز الاقتران",
                    error: error.message
                });
            }
        }

        // تحديث credentials
        KnightBot.ev.on('creds.update', saveCreds);

    } catch (error) {
        console.error('❌ خطأ في بدء الجلسة:', error);
        cleanupSession(sessionDir);
        
        return res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ أثناء إنشاء الجلسة",
            error: error.message
        });
    }
});

module.exports = {
  path: "/api/tools",
  name: "whatsapp session",
  type: "tools",
  url: `${global.t}/api/tools/session?num=15551234567`,
  logo: "https://cdn-icons-png.flaticon.com/512/124/124034.png",
  description: "إنشاء جلسة واتساب وإرسالها كرسالة نصية",
  router
};