const express = require('express');
const fs = require('fs');
const pino = require('pino');
const {
    makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    jidNormalizedUser,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const pn = require('awesome-phonenumber');

const router = express.Router();

/**
 * إزالة ملف أو مجلد إذا وجد
 */
function removeFile(FilePath) {
    try {
        if (!fs.existsSync(FilePath)) return false;
        fs.rmSync(FilePath, { recursive: true, force: true });
    } catch (e) {
        console.error('Error removing file:', e);
    }
}

/**
 * API endpoint:
 * إنشاء جلسة WhatsApp جديدة وإرجاع الملف بعد الربط
 * مثال:
 *   /api/whatsapp/session?number=15551234567
 */
router.get('/session', async (req, res) => {
    let num = req.query.number;
    if (!num) return res.status(400).json({ status: 400, success: false, message: '⚠️ يرجى إدخال رقم الهاتف.' });

    let dirs = './' + num;

    // إزالة أي جلسة سابقة
    removeFile(dirs);

    // تنظيف الرقم
    num = num.replace(/[^0-9]/g, '');
    const phone = pn('+' + num);
    if (!phone.isValid()) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: '⚠️ رقم هاتف غير صالح. يرجى إدخال الرقم الدولي الكامل بدون + أو فراغات.'
        });
    }
    num = phone.getNumber('e164').replace('+', '');

    async function initiateSession() {
        try {
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
            });

            KnightBot.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect } = update;

                if (connection === 'close') {
                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    if (statusCode === 401) console.log("❌ Logged out, need new pair code");
                }
            });

            KnightBot.ev.on('creds.update', saveCreds);

            // انتظار التسجيل
            await delay(3000);

            if (!KnightBot.authState.creds.registered) {
                try {
                    // إرسال رمز الربط للهاتف
                    let code = await KnightBot.requestPairingCode(num);
                    code = code?.match(/.{1,4}/g)?.join('-') || code;
                    res.json({ status: 200, success: true, number: num, pairingCode: code });
                } catch (err) {
                    console.error('Failed to get pairing code:', err);
                    if (!res.headersSent) {
                        res.status(503).json({ status: 503, success: false, message: 'فشل الحصول على رمز الربط، تحقق من الرقم وحاول مرة أخرى.' });
                    }
                }
            } else {
                // إذا الجلسة مسجلة بالفعل، إرجاع الـ session مباشرة
                const sessionFile = fs.readFileSync(dirs + '/creds.json', 'utf-8');
                res.json({ status: 200, success: true, number: num, session: JSON.parse(sessionFile) });
            }
        } catch (err) {
            console.error('Error initializing session:', err);
            if (!res.headersSent) res.status(503).json({ status: 503, success: false, message: 'تعذر إنشاء الجلسة.', error: err.message });
        }
    }

    initiateSession();
});

// Export module بنفس طريقة API سور القرآن
module.exports = {
    path: '/api/tools',
    name: 'WhatsApp session API',
    type: 'tools',
    url: '/api/tools/session?number=15551234567',
    description: 'API لإنشاء جلسة WhatsApp وإرجاع ملف session بعد الربط',
    router
};