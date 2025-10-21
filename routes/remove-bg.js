const express = require("express");
const axios = require("axios");
const FormData = require("form-data");
const { Readable } = require("stream");

// ===================================
// X-DESIGN VIDEO BACKGROUND REMOVER - VERCEL COMPATIBLE
// ===================================

class XDesignBackgroundRemover {
  constructor() {
    this.baseURL = "https://www.x-design.com";
    this.apiEndpoint = "/video-background-remover/edit";
    
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
      'Content-Type': 'application/json',
      'Origin': this.baseURL,
      'Referer': `${this.baseURL}/video-background-remover/edit?default_tab=agent`,
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin'
    };
  }

  /**
   * Download video as buffer (without filesystem)
   */
  async downloadVideo(videoUrl) {
    try {
      console.log(`Downloading video from: ${videoUrl}`);
      
      const response = await axios({
        method: 'GET',
        url: videoUrl,
        responseType: 'arraybuffer', // استخدام arraybuffer بدلاً من stream
        timeout: 60000,
        maxContentLength: 50 * 1024 * 1024, // 50MB max
      });

      console.log(`Video downloaded successfully, size: ${response.data.length} bytes`);
      return response.data;
      
    } catch (error) {
      if (error.response) {
        throw new Error(`Download failed: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.code === 'ENOTFOUND') {
        throw new Error('Cannot resolve video URL. Please check the link.');
      } else {
        throw new Error(`Download failed: ${error.message}`);
      }
    }
  }

  /**
   * Upload video buffer directly to X-Design
   */
  async uploadVideo(videoBuffer, originalUrl) {
    try {
      console.log('Uploading video to X-Design...');

      const formData = new FormData();
      
      // إنشاء stream من buffer
      const videoStream = Readable.from(videoBuffer);
      
      // إضافة الملف مع اسم مناسب
      const fileName = `video_${Date.now()}.mp4`;
      formData.append('file', videoStream, {
        filename: fileName,
        contentType: 'video/mp4'
      });
      
      formData.append('type', 'video');

      const uploadResponse = await axios.post(
        `${this.baseURL}/api/upload`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'User-Agent': this.headers['User-Agent'],
            'Referer': this.headers['Referer']
          },
          timeout: 120000,
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      console.log('Upload successful:', uploadResponse.data);
      return uploadResponse.data;
      
    } catch (error) {
      console.error('Upload error:', error.response?.data || error.message);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Process video background removal
   */
  async removeBackground(uploadData) {
    try {
      console.log('Starting background removal process...');

      const payload = {
        file_id: uploadData.file_id || uploadData.id,
        file_name: uploadData.file_name || uploadData.name,
        file_size: uploadData.file_size || uploadData.size,
        settings: {
          mode: 'agent',
          quality: 'high',
          format: 'mp4',
          background: 'transparent'
        }
      };

      console.log('Sending processing request:', JSON.stringify(payload));

      const processResponse = await axios.post(
        `${this.baseURL}/api/video/remove-background`,
        payload,
        {
          headers: this.headers,
          timeout: 300000 // 5 minutes for processing
        }
      );

      console.log('Process response received');
      return processResponse.data;
      
    } catch (error) {
      console.error('Background removal error:', error.response?.data || error.message);
      throw new Error(`Background removal failed: ${error.message}`);
    }
  }

  /**
   * Check processing status
   */
  async checkStatus(taskId) {
    try {
      const statusResponse = await axios.get(
        `${this.baseURL}/api/task/${taskId}`,
        {
          headers: this.headers,
          timeout: 30000
        }
      );

      return statusResponse.data;
    } catch (error) {
      throw new Error(`Status check failed: ${error.message}`);
    }
  }

  /**
   * Main method to remove background from video URL - VERCEL COMPATIBLE
   */
  async processVideo(videoUrl) {
    try {
      // Step 1: Download video as buffer (no filesystem)
      const videoBuffer = await this.downloadVideo(videoUrl);
      
      // Step 2: Upload directly to X-Design
      const uploadData = await this.uploadVideo(videoBuffer, videoUrl);
      
      if (!uploadData.file_id && !uploadData.id) {
        throw new Error('No file ID received from upload');
      }

      // Step 3: Start background removal
      const processResult = await this.removeBackground(uploadData);
      
      if (!processResult.task_id && !processResult.id) {
        throw new Error('No task ID received for processing');
      }

      const taskId = processResult.task_id || processResult.id;

      // Step 4: Poll for completion
      console.log(`Polling for task completion: ${taskId}`);
      
      const POLL_INTERVAL = 10000; // 10 seconds
      const MAX_ATTEMPTS = 30; // 5 minutes max
      
      let attempts = 0;
      
      while (attempts < MAX_ATTEMPTS) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));

        const status = await this.checkStatus(taskId);
        console.log(`Status check ${attempts}:`, status.status);

        if (status.status === 'completed') {
          return {
            success: true,
            task_id: taskId,
            download_url: status.download_url || status.result_url,
            message: 'تم إزالة الخلفية بنجاح'
          };
        } else if (status.status === 'failed') {
          throw new Error(status.error || 'فشل في معالجة الفيديو');
        }
        
        // Continue polling if still processing
      }

      throw new Error('انتهى وقت المعالجة');

    } catch (error) {
      throw error;
    }
  }
}

// ===================================
// EXPRESS ROUTER IMPLEMENTATION - VERCEL COMPATIBLE
// ===================================

const bgRemover = new XDesignBackgroundRemover();

const router = express.Router();

// زيادة حجم payload لاستيعاب الفيديوهات
router.use(express.json({ limit: '50mb' }));
router.use(express.urlencoded({ extended: true, limit: '50mb' }));

/**
 * Video Background Removal API - VERCEL COMPATIBLE
 */
router.get("/remove-bg", async (req, res) => {
  // تعيين رؤوس CORS لتفادي مشاكل Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: false,
      message: "يرجى تقديم رابط الفيديو عبر المعلمة ?url="
    });
  }

  // Validate URL
  try {
    new URL(url);
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: "رابط الفيديو غير صالح"
    });
  }

  try {
    console.log(`Processing video background removal for: ${url}`);
    
    const result = await bgRemover.processVideo(url);
    
    res.json({
      status: true,
      message: "تم إزالة خلفية الفيديو بنجاح!",
      task_id: result.task_id,
      download_url: result.download_url,
      original_url: url
    });

  } catch (error) {
    console.error("[BACKGROUND REMOVAL ERROR]:", error.message);
    
    res.status(500).json({
      status: false,
      message: "حدث خطأ أثناء إزالة خلفية الفيديو",
      error: error.message,
      suggestion: "تأكد من أن الرابط صالح وأن الفيديو لا يتعدى 50MB"
    });
  }
});

/**
 * Status check endpoint
 */
router.get("/remove-bg/status", async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { task_id } = req.query;

  if (!task_id) {
    return res.status(400).json({
      status: false,
      message: "يرجى تقديم معرف المهمة (task_id)"
    });
  }

  try {
    const status = await bgRemover.checkStatus(task_id);
    
    res.json({
      status: true,
      task_id: task_id,
      processing_status: status.status,
      progress: status.progress || 0,
      download_url: status.download_url || status.result_url,
      estimated_time: status.estimated_time
    });

  } catch (error) {
    console.error("[STATUS CHECK ERROR]:", error.message);
    
    res.status(500).json({
      status: false,
      message: "حدث خطأ أثناء التحقق من الحالة",
      error: error.message
    });
  }
});

/**
 * Proxy download endpoint (لتفادي مشاكل CORS)
 */
router.get("/remove-bg/download", async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: false,
      message: "يرجى تقديم رابط التحميل"
    });
  }

  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 120000
    });

    // تعيين الرؤوس المناسبة
    res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="video_no_bg_${Date.now()}.mp4"`);
    res.setHeader('Cache-Control', 'no-cache');

    // توجيه البيانات مباشرة
    response.data.pipe(res);

  } catch (error) {
    console.error("[DOWNLOAD ERROR]:", error.message);
    
    res.status(500).json({
      status: false,
      message: "حدث خطأ أثناء تحميل الفيديو",
      error: error.message
    });
  }
});

/**
 * Health check endpoint for Vercel
 */
router.get("/health", (req, res) => {
  res.json({
    status: true,
    message: "Service is running",
    timestamp: new Date().toISOString()
  });
});

/**
 * Test endpoint - بدون استخدام نظام الملفات
 */
router.get("/remove-bg/test", async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: false,
      message: "يرجى تقديم رابط الفيديو"
    });
  }

  try {
    // اختبار التحميل فقط
    const testBuffer = await bgRemover.downloadVideo(url);
    
    res.json({
      status: true,
      message: "تم اختبار التحميل بنجاح",
      file_size: `${(testBuffer.length / 1024 / 1024).toFixed(2)} MB`,
      note: "الخدمة جاهزة للمعالجة",
      original_url: url
    });

  } catch (error) {
    res.json({
      status: false,
      message: "فشل اختبار التحميل",
      error: error.message,
      suggestion: "تأكد من صحة رابط الفيديو"
    });
  }
});

// معالجة طلبات OPTIONS لـ CORS
router.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
});

module.exports = {
  path: "/api/ai",
  name: "X-Design Background Remover",
  type: "ai",
  url: `/api/ai/remove-bg?url=https://files.catbox.moe/ry9yl8.mp4`,
  logo: "",
  description: "إزالة خلفية الفيديو باستخدام الذكاء الاصطناعي - متوافق مع Vercel",
  router
};
