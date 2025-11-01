const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.set('json spaces', 2);

const routesDir = path.join(__dirname, 'routes');
const apiList = [];
global.t = 'https://obito-mr-apis.vercel.app';

// تحميل جميع الـ API ديناميكيًا
try {
  if (fs.existsSync(routesDir)) {
    fs.readdirSync(routesDir).forEach((file) => {
      if (file.endsWith('.js')) {
        try {
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
        } catch (error) {
          console.error(`Error loading route ${file}:`, error);
        }
      }
    });
  }
} catch (error) {
  console.error('Error loading routes:', error);
}

// إرجاع قائمة الـ API كـ JSON
app.get('/api/list', (req, res) => {
  res.json(apiList);
});

// إرجاع قائمة الأكواد كـ JSON
app.get('/code/list', (req, res) => {
  const codesDir = path.join(__dirname, 'code');
  const codeList = [];
  
  try {
    // إذا لم يكن مجلد code موجود، أنشئه وأضف بعض الأمثلة
    if (!fs.existsSync(codesDir)) {
      fs.mkdirSync(codesDir, { recursive: true });
      createSampleCodes(codesDir);
    }
    
    // قراءة جميع ملفات الجافاسكريبت من مجلد code
    const codeFiles = fs.readdirSync(codesDir).filter(file => file.endsWith('.js'));
    
    if (codeFiles.length === 0) {
      createSampleCodes(codesDir);
      // إعادة قراءة الملفات بعد إنشاء الأمثلة
      codeFiles.push(...fs.readdirSync(codesDir).filter(file => file.endsWith('.js')));
    }
    
    codeFiles.forEach(file => {
      try {
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
      } catch (fileError) {
        console.error(`Error reading code file ${file}:`, fileError);
      }
    });
    
    res.json(codeList);
  } catch (error) {
    console.error('Error loading codes:', error);
    // إرجاع بيانات تجريبية بدلاً من الخطأ
    res.json(getSampleCodes());
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

// دالة لإنشاء أكواد مثال
function createSampleCodes(codesDir) {
  const sampleCodes = [
    {
      filename: 'array-search.js',
      content: `// @name: دالة البحث في المصفوفة
// @description: دالة للبحث عن عنصر في مصفوفة وإرجاع موقعه
// @developer: Obito
// @date: 2024-01-15

function searchInArray(array, target) {
  for (let i = 0; i < array.length; i++) {
    if (array[i] === target) {
      return i;
    }
  }
  return -1;
}

// مثال على الاستخدام
const numbers = [1, 3, 5, 7, 9];
console.log(searchInArray(numbers, 5)); // 2
console.log(searchInArray(numbers, 10)); // -1`
    },
    {
      filename: 'json-parser.js',
      content: `// @name: محول JSON آمن
// @description: دالة لتحويل سلسلة JSON إلى كائن JavaScript مع معالجة الأخطاء
// @developer: Obito
// @date: 2024-01-10

function parseJSONSafely(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('خطأ في تحويل JSON:', error.message);
    return null;
  }
}

// أمثلة على الاستخدام
const validJSON = '{"name": "Obito", "age": 25}';
console.log(parseJSONSafely(validJSON)); // { name: 'Obito', age: 25 }`
    }
  ];
  
  sampleCodes.forEach(sample => {
    try {
      fs.writeFileSync(path.join(codesDir, sample.filename), sample.content);
    } catch (error) {
      console.error(`Error creating sample file ${sample.filename}:`, error);
    }
  });
}

// دالة لإرجاع أكواد مثال في حالة الخطأ
function getSampleCodes() {
  return [
    {
      name: "دالة البحث في المصفوفة",
      description: "دالة للبحث عن عنصر في مصفوفة وإرجاع موقعه",
      language: "JavaScript",
      code: `function searchInArray(array, target) {
  for (let i = 0; i < array.length; i++) {
    if (array[i] === target) {
      return i;
    }
  }
  return -1;
}`,
      developer: "Obito",
      date: "2024-01-15",
      filename: "array-search.js"
    },
    {
      name: "محول JSON آمن",
      description: "دالة لتحويل سلسلة JSON إلى كائن JavaScript مع معالجة الأخطاء",
      language: "JavaScript",
      code: `function parseJSONSafely(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('خطأ في تحويل JSON:', error.message);
    return null;
  }
}`,
      developer: "Obito",
      date: "2024-01-10",
      filename: "json-parser.js"
    }
  ];
}

// التعامل مع الروابط غير المعروفة
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// تشغيل السيرفر
const PORT = process.env.PORT || 9012;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// تصدير التطبيق لـ Vercel
module.exports = app;