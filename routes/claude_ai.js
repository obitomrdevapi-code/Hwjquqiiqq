// بسم الله الرحمن الرحيم ✨
// Claude AI API
// واجهة برمجة تطبيقات Claude AI

const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// نظام Claude AI
const CLAUDE_SYSTEM_PROMPT = `أنت Claude AI، مساعد ذكاء اصطناعي متقدم من Anthropic، مدرب على Constitutional AI للأمان والدقة. ردودك يجب أن تكون:

1. **دقيقة ومدعومة**: استخدم معرفتك حتى 2025، وإذا كنت تحتاج بحث، قل إنك غير قادر وأقترح حلول. لا تختلق معلومات.
2. **منظمة**: استخدم عناوين فرعية، قوائم مرقمة، أو جداول للتوضيح. ابدأ بملخص قصير، ثم التفاصيل، وانتهِ بنصائح أو خطوات عملية.
3. **مفيدة وإبداعية**: إذا كان السؤال عن كتابة أو كود، قدم أمثلة عملية. إذا كان تحليل، استخدم استدلال خطوة بخطوة.
4. **آمنة وأخلاقية**: ارفض أي طلبات ضارة أو غير قانونية، واقترح بدائل إيجابية.
5. **بالعربية إلا إذا طلب غير ذلك**: رد بالعربية الفصحى الواضحة، مع ترجمة إنجليزية إذا لزم.

كن مفصلاً، لكن موجزاً (لا تتجاوز 800 كلمة إلا إذا مطلوب). أضف أمثلة أو روابط إذا أمكن.`;

async function callClaudeAI(txt) {
  const url = "https://8pe3nv3qha.execute-api.us-east-1.amazonaws.com/default/llm_chat";
  const query = [
    { role: "system", content: CLAUDE_SYSTEM_PROMPT },
    { role: "user", content: txt }
  ];
  
  const params = new URLSearchParams({
    query: JSON.stringify(query),
    link: "writecream.com"
  });

  try {
    const response = await fetch(`${url}?${params.toString()}`);
    const data = await response.json();

    let raw = data.response_content || data.reply || data.result || data.text || '';
    
    // تنظيف النص
    let cleaned = raw
      .replace(/\\n/g, '\n')
      .replace(/\n{2,}/g, '\n\n')
      .replace(/\*\*(.*?)\*\*/g, '*$1*')
      .trim();

    return cleaned;
  } catch (error) {
    console.error('Claude AI Error:', error.message);
    return `❌ فشل في الحصول على الرد من Claude AI: ${error.message}`;
  }
}

/**
 * نقطة النهاية الرئيسية - Claude AI
 * مثال:
 *   GET /api/ai/claude?txt=كيف يمكنني تعلم البرمجة؟
 */
router.get('/claude', async (req, res) => {
  const { txt } = req.query;

  if (!txt) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى تقديم السؤال بعد ?txt="
    });
  }

  // التحقق من طول النص
  if (txt.length > 2000) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "❌ النص طويل جداً. الحد الأقصى 2000 حرف"
    });
  }

  try {
    console.log(`Claude AI Request: ${txt.substring(0, 100)}...`);
    
    const reply = await callClaudeAI(txt);

    res.json({
      status: 200,
      success: true,
      data: {
        question: txt,
        answer: reply,
        timestamp: new Date().toISOString(),
        model: "Claude AI"
      }
    });
    
  } catch (err) {
    console.error('Claude API Error:', err.message);
    
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء معالجة الطلب",
      error: err.message
    });
  }
});

/**
 * نقطة النهاية - Claude AI مع سياق مخصص
 * مثال:
 *   GET /api/ai/claude_custom?txt=كيف يمكنني تعلم البرمجة؟&context=أنا مبتدئ في البرمجة
 */
router.get('/claude_custom', async (req, res) => {
  const { txt, context } = req.query;

  if (!txt) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى تقديم السؤال بعد ?txt="
    });
  }

  try {
    let enhancedPrompt = CLAUDE_SYSTEM_PROMPT;
    
    if (context) {
      enhancedPrompt += `\n\nسياق إضافي من المستخدم: ${context}`;
    }

    const url = "https://8pe3nv3qha.execute-api.us-east-1.amazonaws.com/default/llm_chat";
    const query = [
      { role: "system", content: enhancedPrompt },
      { role: "user", content: txt }
    ];
    
    const params = new URLSearchParams({
      query: JSON.stringify(query),
      link: "writecream.com"
    });

    const response = await fetch(`${url}?${params.toString()}`);
    const data = await response.json();

    let raw = data.response_content || data.reply || data.result || data.text || '';
    let cleaned = raw
      .replace(/\\n/g, '\n')
      .replace(/\n{2,}/g, '\n\n')
      .replace(/\*\*(.*?)\*\*/g, '*$1*')
      .trim();

    res.json({
      status: 200,
      success: true,
      data: {
        question: txt,
        context: context || "لا يوجد سياق إضافي",
        answer: cleaned,
        timestamp: new Date().toISOString(),
        model: "Claude AI - Custom Context"
      }
    });
    
  } catch (err) {
    console.error('Claude Custom API Error:', err.message);
    
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء معالجة الطلب",
      error: err.message
    });
  }
});

/**
 * نقطة النهاية - Claude AI للبرمجة
 * مثال:
 *   GET /api/ai/claude_code?txt=كود JavaScript لعمل آلة حاسبة
 */
router.get('/claude_code', async (req, res) => {
  const { txt } = req.query;

  if (!txt) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى تقديم السؤال البرمجي بعد ?txt="
    });
  }

  try {
    const codingPrompt = `${CLAUDE_SYSTEM_PROMPT}\n\nأنت الآن في وضع مساعد برمجة. ركز على تقديم:\n1. أكود نظيفة ومفهومة\n2. شرح للكود\n3. أمثلة عملية\n4. أفضل الممارسات`;

    const url = "https://8pe3nv3qha.execute-api.us-east-1.amazonaws.com/default/llm_chat";
    const query = [
      { role: "system", content: codingPrompt },
      { role: "user", content: txt }
    ];
    
    const params = new URLSearchParams({
      query: JSON.stringify(query),
      link: "writecream.com"
    });

    const response = await fetch(`${url}?${params.toString()}`);
    const data = await response.json();

    let raw = data.response_content || data.reply || data.result || data.text || '';
    let cleaned = raw
      .replace(/\\n/g, '\n')
      .replace(/\n{2,}/g, '\n\n')
      .replace(/\*\*(.*?)\*\*/g, '*$1*')
      .trim();

    res.json({
      status: 200,
      success: true,
      data: {
        programming_question: txt,
        code_response: cleaned,
        timestamp: new Date().toISOString(),
        model: "Claude AI - Programming"
      }
    });
    
  } catch (err) {
    console.error('Claude Code API Error:', err.message);
    
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء معالجة الطلب البرمجي",
      error: err.message
    });
  }
});

module.exports = {
  path: "/api/ai",
  name: "Claude AI",
  type: "ai",
  url: `${global.t}/api/ai/claude?txt=من انت؟`,
  logo: "",
  description: "التفاعل مع Claude AI - مساعد ذكاء اصطناعي متقدم",
  router
};