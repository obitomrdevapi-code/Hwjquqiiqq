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
    const dirs = './session_' + cleanNum;

    try {
        // تنظيف الجلسة السابقة إن وجدت
        await removeFile(dirs);

        const { state, saveCreds } = await useMultiFileAuthState(dirs);
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
            keepAliveIntervalMs: 10000,
        });

        // معالج تحديث الاتصال
        KnightBot.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log("📟 تم إنشاء QR code");
            }

            if (connection === 'open') {
                console.log("✅ تم الاتصال بنجاح!");
                
                try {
                    const sessionKnight = fs.readFileSync(dirs + '/creds.json');
                    const userJid = jidNormalizedUser(cleanNum + '@s.whatsapp.net');
                    
                    // إرسال ملف الجلسة
                    await KnightBot.sendMessage(userJid, {
                        document: sessionKnight,
                        mimetype: 'application/json',
                        fileName: 'creds.json'
                    });
                    
                    // إرسال رسالة تأكيد
                    await KnightBot.sendMessage(userJid, {
                        text: `✅ تم إنشاء الجلسة بنجاح!\n\n⚠️ لا تشارك هذا الملف مع أي شخص ⚠️`
                    });

                    // تنظيف الجلسة
                    await delay(2000);
                    removeFile(dirs);
                    
                    console.log("🎉 اكتملت العملية بنجاح!");
                    
                } catch (error) {
                    console.error("❌ خطأ في إرسال الرسائل:", error);
                    removeFile(dirs);
                }
            }

            if (connection === 'close') {
                console.log("🔁 تم إغلاق الاتصال");
                removeFile(dirs);
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
                        pairing_code: code
                    }
                });
                
            } catch (error) {
                console.error('❌ خطأ في طلب رمز الاقتران:', error);
                removeFile(dirs);
                
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
        removeFile(dirs);
        
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
  description: "إنشاء جلسة واتساب عبر الرقم الدولي",
  router
};