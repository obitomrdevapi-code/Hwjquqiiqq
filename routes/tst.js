const express = require("express");
const axios = require("axios");
const unzipper = require("unzipper");
const router = express.Router();

/**
 * رفع الملفات إلى Vercel
 * @param {string} name - اسم الموقع
 * @param {Buffer} buffer - محتوى الملف
 * @param {string} mime - نوع الملف
 * @returns {Promise<object>}
 */
async function deployToVercel(name, buffer, mime) {
  const webName = name.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
  const domainCheckUrl = `https://${webName}.vercel.app`;

  // التحقق من توفر اسم الموقع
  try {
    const check = await axios.get(domainCheckUrl);
    if (check.status === 200) {
      throw new Error(`❌ اسم الموقع ${webName} مستخدم بالفعل`);
}
} catch (e) {}

  const filesToUpload = [];

  if (/zip/.test(mime)) {
    const directory = await unzipper.Open.buffer(buffer);
    for (const file of directory.files) {
      if (file.type === 'File') {
        const content = await file.buffer();
        const filePath = file.path.replace(/^\/+/, '').replace(/\\/g, '/');
        filesToUpload.push({
          file: filePath,
          data: content.toString('base64'),
          encoding: 'base64'
});
}
}

    if (!filesToUpload.some(x => x.file.toLowerCase().endsWith('index.html'))) {
      throw new Error('❌ ملف index.html غير موجود داخل ZIP');
}

} else if (/html/.test(mime)) {
    filesToUpload.push({
      file: 'index.html',
      data: buffer.toString('base64'),
      encoding: 'base64'
});
} else {
    throw new Error('⚠️ نوع الملف غير مدعوم. الرجاء رفع ملف.zip أو.html');
}

  const headers = {
    Authorization: `Bearer <token pecel>`, // ضع التوكن الخاص بك هنا
    'Content-Type': 'application/json'
};

  // إنشاء مشروع
  await axios.post('https://api.vercel.com/v9/projects', {
    name: webName
}, { headers}).catch(() => {});

  // نشر الموقع
  const deployRes = await axios.post('https://api.vercel.com/v13/deployments', {
    name: webName,
    project: webName,
    files: filesToUpload,
    projectSettings: { framework: null}
}, { headers});

  return deployRes.data;
}

/**
 * نقطة النهاية الرئيسية
 * مثال:
 *   /api/deploy?url_file=<رابط الملف>&name=<اسم الموقع>
 */
router.get("/deploy", async (req, res) => {
  const fileUrl = req.query.url_file;
  const siteName = req.query.name;

  if (!fileUrl ||!siteName) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى تقديم رابط الملف واسم الموقع"
});
}

  try {
    const fileRes = await axios.get(fileUrl, { responseType: 'arraybuffer'});
    const mime = fileRes.headers['content-type'];
    const buffer = Buffer.from(fileRes.data);

    const result = await deployToVercel(siteName, buffer, mime);

    if (!result.url) {
      return res.status(500).json({
        status: 500,
        success: false,
        message: "❌ فشل في نشر الموقع",
        error: result
});
}

    res.json({
      status: 200,
      success: true,
      url: `https://${siteName}.vercel.app`,
      message: "✅ تم إنشاء الموقع بنجاح"
});

} catch (err) {
    console.error('Deploy Error:', err.message);
    res.status(500).json({
      status: 500,
      success: false,
      message: "❌ حدث خطأ أثناء نشر الموقع",
      error: err.message
});
}
});

module.exports = {
  path: "/api/deploy",
  name: "vercel web deploy",
  type: "tools",
  url: `${global.t}/api/deploy?url_file=<رابط الملف>&name=<اسم الموقع>`,
  logo: "",
  description: "تست",
  router
};