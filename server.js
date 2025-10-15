const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // دعم JSON
app.set('json spaces', 2);
app.listen(9012, () => {
  console.log(`Server running on port 9012`);
});
const routesDir = path.join(__dirname, 'routes');
const apiList = [];
global.t = 'https://takamura-xi.vercel.app';
// تحميل جميع الـ API ديناميكيًا
fs.readdirSync(routesDir).forEach((file) => {
  const route = require(path.join(routesDir, file));

  if (route.path && route.router) {
    app.use(route.path, route.router);

    // إضافة تفاصيل الـ API إلى القائمة
    apiList.push({
      name: route.name || file.replace('.js', '').toUpperCase(),
      type: route.type || 'default',
      endpoint: route.path,
      url: route.url || null,
      logo: route.logo || null,
      status: 'Active',
    });
  }
});

// إرجاع قائمة الـ API كـ JSON
app.get('/api/list', (req, res) => {
  res.json(apiList);
});

// التعامل مع الروابط غير المعروفة
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// تصدير التطبيق لـ Vercel
module.exports = app;
