// بسم الله الرحمن الرحيم ✨
// VertexAI API Wrapper
// واجهة برمجة تطبيقات الذكاء الاصطناعي من جوجل

const express = require("express");
const axios = require("axios");

const router = express.Router();

class VertexAI {
    constructor() {
        this.api_url = 'https://firebasevertexai.googleapis.com/v1beta';
        this.model_url = 'projects/gemmy-ai-bdc03/locations/us-central1/publishers/google/models';
        this.headers = {
            'content-type': 'application/json',
            'x-goog-api-client': 'gl-kotlin/2.1.0-ai fire/16.5.0',
            'x-goog-api-key': 'AIzaSyD6QwvrvnjU7j-R6fkOghfIVKwtvc7SmLk'
        };
        this.model = {
            search: ['gemini-2.0-flash', 'gemini-2.0-flash-001', 'gemini-2.5-flash', 'gemini-2.5-flash-lite-preview-06-17', 'gemini-2.5-pro'], 
            chat: ['gemini-1.5-flash', 'gemini-1.5-flash-002', 'gemini-1.5-pro', 'gemini-1.5-pro-002', 'gemini-2.0-flash', 'gemini-2.0-flash-001', 'gemini-2.0-flash-lite', 'gemini-2.0-flash-lite-001', 'gemini-2.5-flash', 'gemini-2.5-flash-lite-preview-06-17', 'gemini-2.5-pro']
        };
    }
    
    chat = async function (question, { model = 'gemini-1.5-flash', system_instruction = null, search = false } = {}) {
        if (!question) throw new Error('Question is required');
        if (!this.model.chat.includes(model)) throw new Error(`Available models: ${this.model.chat.join(', ')}`);
        if (search && !this.model.search.includes(model)) throw new Error(`Available search models: ${this.model.search.join(', ')}`);
        
        const parts = [{ text: question }];
        
        const r = await axios.post(`${this.api_url}/${this.model_url}/${model}:generateContent`, {
            contents: [
                ...(system_instruction ? [{
                    role: 'model',
                    parts: [{ text: system_instruction }]
                }] : []),
                {
                    role: 'user',
                    parts: parts
                }
            ],
            ...(search ? {
                tools: [{
                    googleSearch: {}
                }]
            } : {})
        }, {
            headers: this.headers
        });
        
        if (r.status !== 200) throw new Error('No result found');
        return r.data.candidates;
    }
}

/**
 * نقطة النهاية للدردشة مع الذكاء الاصطناعي
 * مثال:
 *   /api/ai/chat?question=مرحبا&model=gemini-1.5-flash
 *   /api/ai/chat?question=ما هو الطقس؟&model=gemini-2.0-flash&search=true
 */
router.get("/chatt", async (req, res) => {
    const { question, model = 'gemini-1.5-flash', search = false } = req.query;
    
    if (!question) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: "⚠️ يرجى إدخال سؤال"
        });
    }

    try {
        const vertexAI = new VertexAI();
        
        // التحقق من النموذج المطلوب
        if (!vertexAI.model.chat.includes(model)) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: `⚠️ النموذج غير مدعوم. النماذج المتاحة: ${vertexAI.model.chat.join(', ')}`
            });
        }
        
        // التحقق من دعم البحث للنموذج المختار
        if (search === 'true' && !vertexAI.model.search.includes(model)) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: `⚠️ البحث غير مدعوم لهذا النموذج. النماذج المدعومة للبحث: ${vertexAI.model.search.join(', ')}`
            });
        }

        const response = await vertexAI.chat(question, { 
            model, 
            search: search === 'true' 
        });

        res.json({
            status: 200,
            success: true,
            question: question,
            model: model,
            search: search === 'true',
            response: response
        });
    } catch (err) {
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ أثناء معالجة الطلب.",
            error: err.message
        });
    }
});

/**
 * نقطة النهاية للحصول على معلومات النماذج المتاحة
 * مثال:
 *   /api/ai/models
 */
router.get("/models", async (req, res) => {
    try {
        const vertexAI = new VertexAI();
        
        res.json({
            status: 200,
            success: true,
            models: {
                chat: vertexAI.model.chat,
                search: vertexAI.model.search
            },
            usage: {
                chat: `${global.t}/api/ai/chat?question=مرحبا&model=gemini-1.5-flash`,
                chat_with_search: `${global.t}/api/ai/chat?question=ما هو الطقس؟&model=gemini-2.0-flash&search=true`
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ أثناء جلب المعلومات.",
            error: err.message
        });
    }
});

module.exports = {
  path: "/api/aii",
  name: "VertexAI",
  type: "aii",
  url: `${global.t}/api/aii/chatt?question=مرحبا&model=gemini-1.5-flash`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "واجهة برمجة تطبيقات الذكاء الاصطناعي من جوجل VertexAI - الدردشة فقط",
  router
};