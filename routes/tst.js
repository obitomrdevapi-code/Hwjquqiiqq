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
        this.ratio = ['1:1', '3:4', '4:3', '9:16', '16:9'];
        this.model = {
            search: ['gemini-2.0-flash', 'gemini-2.0-flash-001', 'gemini-2.5-flash', 'gemini-2.5-flash-lite-preview-06-17', 'gemini-2.5-pro'], 
            chat: ['gemini-2.0-flash', 'gemini-2.0-flash-001', 'gemini-2.0-flash-lite', 'gemini-2.0-flash-lite-001', 'gemini-2.5-flash', 'gemini-2.5-flash-lite-preview-06-17', 'gemini-2.5-pro'],
            image: ['imagen-3.0-generate-002', 'imagen-3.0-generate-001', 'imagen-3.0-fast-generate-001', 'imagen-4.0-generate-preview-06-06', 'imagen-4.0-fast-generate-preview-06-06']
        };
    }
    
    chat = async function (question, { model = 'gemini-2.0-flash', system_instruction = null, search = false } = {}) {
        if (!question) throw new Error('Question is required');
        if (!this.model.chat.includes(model)) throw new Error(`Available models: ${this.model.chat.join(', ')}`);
        if (search && !this.model.search.includes(model)) throw new Error(`Available search models: ${this.model.search.join(', ')}`);
        
        const parts = [{ text: question }];
        
        const url = `${this.api_url}/${this.model_url}/${model}:generateContent`;
        
        console.log('Chat Request URL:', url);
        
        const requestBody = {
            contents: [
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
        };
        
        if (system_instruction) {
            requestBody.systemInstruction = {
                parts: [{ text: system_instruction }]
            };
        }
        
        try {
            const r = await axios.post(url, requestBody, {
                headers: this.headers,
                timeout: 30000
            });
            
            console.log('Chat Response Status:', r.status);
            
            if (r.status !== 200) throw new Error(`API returned status ${r.status}`);
            
            if (!r.data.candidates || r.data.candidates.length === 0) {
                throw new Error('No response generated from AI');
            }
            
            return r.data.candidates;
        } catch (error) {
            console.error('Chat API Error:', error.response?.data || error.message);
            
            if (error.response) {
                throw new Error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
                throw new Error('No response received from API server');
            } else {
                throw new Error(`Request setup error: ${error.message}`);
            }
        }
    }
    
    image = async function (prompt, { model = 'imagen-3.0-generate-001', aspect_ratio = '1:1' } = {}) {
        if (!prompt) throw new Error('Prompt is required');
        if (!this.model.image.includes(model)) throw new Error(`Available models: ${this.model.image.join(', ')}`);
        if (!this.ratio.includes(aspect_ratio)) throw new Error(`Available ratios: ${this.ratio.join(', ')}`);
        
        const url = `${this.api_url}/${this.model_url}/${model}:predict`;
        
        console.log('Image Request URL:', url);
        
        const requestBody = {
            instances: [
                {
                    prompt: prompt,
                }
            ],
            parameters: {
                sampleCount: 1,
                aspectRatio: aspect_ratio,
                safetySetting: 'block_only_high',
                personGeneration: 'allow_adult',
                addWatermark: false,
                includeRaiReason: false
            }
        };
        
        console.log('Image Request Body:', JSON.stringify(requestBody, null, 2));
        
        try {
            const r = await axios.post(url, requestBody, {
                headers: this.headers,
                timeout: 60000
            });
            
            console.log('Image Response Status:', r.status);
            
            if (r.status !== 200) throw new Error(`API returned status ${r.status}`);
            
            if (!r.data.predictions || r.data.predictions.length === 0) {
                throw new Error('No images generated');
            }
            
            return r.data.predictions;
        } catch (error) {
            console.error('Image API Error:', error.response?.data || error.message);
            
            if (error.response) {
                throw new Error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
                throw new Error('No response received from API server');
            } else {
                throw new Error(`Request setup error: ${error.message}`);
            }
        }
    }
}

/**
 * نقطة النهاية للدردشة مع الذكاء الاصطناعي
 * مثال:
 *   /api/ai/chat?question=مرحبا&model=gemini-2.0-flash
 *   /api/ai/chat?question=ما هو الطقس؟&model=gemini-2.0-flash&search=true
 */
router.get("/chatt", async (req, res) => {
    const { question, model = 'gemini-2.0-flash', search = false, system_instruction = null } = req.query;
    
    if (!question) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: "⚠️ يرجى إدخال سؤال"
        });
    }

    try {
        const vertexAI = new VertexAI();
        
        if (!vertexAI.model.chat.includes(model)) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: `⚠️ النموذج غير مدعوم. النماذج المتاحة: ${vertexAI.model.chat.join(', ')}`,
                available_models: vertexAI.model.chat
            });
        }
        
        if (search === 'true' && !vertexAI.model.search.includes(model)) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: `⚠️ البحث غير مدعوم لهذا النموذج. النماذج المدعومة للبحث: ${vertexAI.model.search.join(', ')}`,
                available_search_models: vertexAI.model.search
            });
        }

        console.log(`Processing chat request:`, { question, model, search: search === 'true' });

        const response = await vertexAI.chat(question, { 
            model, 
            search: search === 'true',
            system_instruction 
        });

        let answer = "لا توجد إجابة";
        if (response && response[0] && response[0].content && response[0].content.parts) {
            answer = response[0].content.parts.map(part => part.text).join(' ');
        }

        res.json({
            status: 200,
            success: true,
            question: question,
            model: model,
            search: search === 'true',
            answer: answer,
            full_response: response
        });
    } catch (err) {
        console.error('Chat endpoint error:', err);
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ أثناء معالجة الطلب.",
            error: err.message,
            debug: {
                question: question,
                model: model,
                search: search
            }
        });
    }
});

/**
 * نقطة النهاية لإنشاء الصور
 * مثال:
 *   /api/ai/image?prompt=منظر طبيعي جميل&model=imagen-3.0-generate-001&aspect_ratio=16:9
 */
router.get("/image", async (req, res) => {
    const { prompt, model = 'imagen-3.0-generate-001', aspect_ratio = '1:1' } = req.query;
    
    if (!prompt) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: "⚠️ يرجى إدخال وصف للصورة"
        });
    }

    try {
        const vertexAI = new VertexAI();
        
        if (!vertexAI.model.image.includes(model)) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: `⚠️ النموذج غير مدعوم. النماذج المتاحة: ${vertexAI.model.image.join(', ')}`,
                available_models: vertexAI.model.image
            });
        }
        
        if (!vertexAI.ratio.includes(aspect_ratio)) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: `⚠️ نسبة الأبعاد غير مدعومة. النسب المتاحة: ${vertexAI.ratio.join(', ')}`,
                available_ratios: vertexAI.ratio
            });
        }

        console.log(`Processing image request:`, { prompt, model, aspect_ratio });

        const response = await vertexAI.image(prompt, { 
            model, 
            aspect_ratio 
        });

        res.json({
            status: 200,
            success: true,
            prompt: prompt,
            model: model,
            aspect_ratio: aspect_ratio,
            images: response,
            note: "الصور تُرجع كبيانات base64 في حقل bytes"
        });
    } catch (err) {
        console.error('Image endpoint error:', err);
        res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ أثناء إنشاء الصورة.",
            error: err.message,
            debug: {
                prompt: prompt,
                model: model,
                aspect_ratio: aspect_ratio
            }
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
                search: vertexAI.model.search,
                image: vertexAI.model.image
            },
            ratios: vertexAI.ratio,
            default_models: {
                chat: "gemini-2.0-flash",
                image: "imagen-3.0-generate-001"
            },
            usage_examples: {
                basic_chat: `${global.t}/api/ai/chat?question=مرحبا&model=gemini-2.0-flash`,
                chat_with_search: `${global.t}/api/ai/chat?question=ما هو الطقس؟&model=gemini-2.0-flash&search=true`,
                image_generation: `${global.t}/api/ai/image?prompt=منظر طبيعي جميل&model=imagen-3.0-generate-001&aspect_ratio=16:9`
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

/**
 * نقطة النهاية للصحة
 * مثال:
 *   /api/ai/health
 */
router.get("/health", async (req, res) => {
    try {
        const vertexAI = new VertexAI();
        
        res.json({
            status: 200,
            success: true,
            message: "VertexAI API is running",
            timestamp: new Date().toISOString(),
            features: {
                chat: true,
                image_generation: true,
                search: true
            },
            available_models: {
                chat: vertexAI.model.chat.length,
                image: vertexAI.model.image.length
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 500,
            success: false,
            message: "Health check failed",
            error: err.message
        });
    }
});

module.exports = {
  path: "/api/ai",
  name: "VertexAI",
  type: "ai",
  url: `${global.t}/api/ai/chatt?question=مرحبا&model=gemini-2.0-flash`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "واجهة برمجة تطبيقات الذكاء الاصطناعي من جوجل VertexAI - الدردشة وإنشاء الصور",
  router
};