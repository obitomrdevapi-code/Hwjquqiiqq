const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.set('json spaces', 2);
app.listen(9012, () => {
  console.log(`Server running on port 9012`);
});

const routesDir = path.join(__dirname, 'routes');
const apiList = [];
global.t = 'https://obito-mr-apis.vercel.app';

// تحميل جميع الـ API ديناميكيًا
fs.readdirSync(routesDir).forEach((file) => {
  const route = require(path.join(routesDir, file));

  if (route.path && route.router) {
    app.use(route.path, route.router);

    apiList.push({
      name: route.name || file.replace('.js', '').toUpperCase(),
      type: route.type || 'default',
      path: route.path,
      endpoint: route.path,
      url: route.url || null,
      logo: route.logo || null,
      description: route.description || 'لا يوجد وصف متوفر',
      status: 'Active',
    });
  }
});

// إرجاع قائمة الـ API كـ JSON
app.get('/api/list', (req, res) => {
  res.json(apiList);
});

// إرجاع قائمة الأكواد كـ JSON
app.get('/code/list', (req, res) => {
  const codesDir = path.join(__dirname, 'code');
  const codeList = [];
  
  try {
    // قراءة جميع ملفات الجافاسكريبت من مجلد code
    const codeFiles = fs.readdirSync(codesDir).filter(file => file.endsWith('.js'));
    
    codeFiles.forEach(file => {
      const filePath = path.join(codesDir, file);
      const codeContent = fs.readFileSync(filePath, 'utf8');
      
      // استخراج المعلومات من التعليقات في أعلى الملف
      const meta = extractCodeMetadata(codeContent);
      
      codeList.push({
        name: meta.name || file.replace('.js', ''),
        description: meta.description || 'لا يوجد وصف متوفر',
        language: 'JavaScript',
        code: codeContent,
        developer: meta.developer || 'Obito',
        date: meta.date || getFileCreationDate(filePath),
        filename: file
      });
    });
    
    res.json(codeList);
  } catch (error) {
    console.error('Error loading codes:', error);
    res.status(500).json({ error: 'Failed to load codes' });
  }
});

// دالة لاستخراج المعلومات من التعليقات
function extractCodeMetadata(codeContent) {
  const metadata = {};
  const lines = codeContent.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('// @name:')) {
      metadata.name = line.replace('// @name:', '').trim();
    } else if (line.startsWith('// @description:')) {
      metadata.description = line.replace('// @description:', '').trim();
    } else if (line.startsWith('// @developer:')) {
      metadata.developer = line.replace('// @developer:', '').trim();
    } else if (line.startsWith('// @date:')) {
      metadata.date = line.replace('// @date:', '').trim();
    }
    
    // إذا وجدنا كود حقيقي، نتوقف عن البحث عن الميتاداتا
    if (line.trim() && !line.startsWith('//') && !line.startsWith('/*')) {
      break;
    }
  }
  
  return metadata;
}

// دالة للحصول على تاريخ إنشاء الملف
function getFileCreationDate(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.birthtime.toISOString().split('T')[0];
  } catch (error) {
    return new Date().toISOString().split('T')[0];
  }
}

// التعامل مع الروابط غير المعروفة
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// تصدير التطبيق لـ Vercel
module.exports = app;