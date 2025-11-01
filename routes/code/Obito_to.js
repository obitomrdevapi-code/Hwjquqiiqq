// @name: أدوات المصفوفات المتقدمة
// @description: مجموعة دوال متقدمة للتعامل مع المصفوفات
// @developer: Obito
// @date: 2024-01-20

// دالة لتصفية المصفوفة وإرجاع العناصر الفريدة
function getUniqueItems(array) {
  return [...new Set(array)];
}

// دالة لدمج مصفوفتين مع إزالة التكرارات
function mergeArraysUnique(array1, array2) {
  return [...new Set([...array1, ...array2])];
}

// دالة للحصول على تقاطع مصفوفتين
function getArrayIntersection(array1, array2) {
  return array1.filter(item => array2.includes(item));
}

// دالة للحصول على الفرق بين مصفوفتين
function getArrayDifference(array1, array2) {
  return array1.filter(item => !array2.includes(item));
}

// دالة لتقسيم المصفوفة إلى مجموعات
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// أمثلة على الاستخدام
const numbers = [1, 2, 2, 3, 4, 4, 5];
const numbers2 = [4, 5, 6, 7, 8];

console.log(getUniqueItems(numbers)); // [1, 2, 3, 4, 5]
console.log(mergeArraysUnique(numbers, numbers2)); // [1, 2, 3, 4, 5, 6, 7, 8]
console.log(getArrayIntersection(numbers, numbers2)); // [4, 5]
console.log(getArrayDifference(numbers, numbers2)); // [1, 2, 3]
console.log(chunkArray(numbers, 3)); // [[1, 2, 2], [3, 4, 4], [5]]

// تصدير الدوال
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getUniqueItems,
    mergeArraysUnique,
    getArrayIntersection,
    getArrayDifference,
    chunkArray
  };
      }
