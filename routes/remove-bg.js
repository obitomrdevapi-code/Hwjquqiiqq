const express = require("express");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require('uuid');

// ===================================
// X-DESIGN VIDEO BACKGROUND REMOVER - IMPROVED
// ===================================

class XDesignBackgroundRemover {
  constructor() {
    this.baseURL = "https://www.x-design.com";
    this.apiEndpoint = "/video-background-remover/edit";
    this.tempDir = path.join(process.cwd(), 'temp'); // استخدام المسار الحالي للعمل
    
    // إنشاء مجلد temp إذا لم يكن موجوداً
    this.ensureTempDir();
    
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
   * التأكد من وجود مجلد temp
   */
  ensureTempDir() {
    try {
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
        console.log(`Created temp directory: ${this.tempDir}`);
      }
    } catch (error) {
      console.error('Error creating temp directory:', error);
      // استخدام مجلد مؤقت بديل
      this.tempDir = path.join(__dirname, '..', 'temp');
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
      }
    }
  }

  /**
   * Download video from URL - IMPROVED
   */
  async downloadVideo(videoUrl) {
    let tempPath = null;
    
    try {
      console.log(`Downloading video from: ${videoUrl}`);
      
      // التحقق من صحة الرابط أولاً
      const headResponse = await axios.head(videoUrl, { timeout: 10000 });
      const contentType = headResponse.headers['content-type'];
      
      if (!contentType || !contentType.includes('video')) {
        console.warn('URL might not be a video. Content-Type:', contentType);
      }

      const response = await axios({
        method: 'GET',
        url: videoUrl,
        responseType: 'stream',
        timeout: 120000, // 2 minutes
        maxContentLength: 100 * 1024 * 1024, // 100MB max
      });

      // إنشاء اسم ملف فريد
      const fileId = uuidv4();
      tempPath = path.join(this.tempDir, `video_${fileId}.mp4`);
      
      const writer = fs.createWriteStream(tempPath);

      return new Promise((resolve, reject) => {
        let downloadedBytes = 0;
        let totalBytes = parseInt(response.headers['content-length'], 10) || 0;

        response.data.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          if (totalBytes > 0) {
            const progress = (downloadedBytes / totalBytes * 100).toFixed(2);
            console.log(`Download progress: ${progress}%`);
          }
        });

        response.data.pipe(writer);
        
        writer.on('finish', () => {
          console.log(`Video downloaded successfully to: ${tempPath}`);
          
          // التحقق من وجود الملف وحجمه
          const stats = fs.statSync(tempPath);
          if (stats.size === 0) {
            fs.unlinkSync(tempPath);
            reject(new Error('Downloaded file is empty'));
            return;
          }
          
          resolve(tempPath);
        });
        
        writer.on('error', (error) => {
          if (tempPath && fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
          reject(new Error(`File write error: ${error.message}`));
        });
        
        response.data.on('error', (error) => {
          if (tempPath && fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
          reject(new Error(`Download stream error: ${error.message}`));
        });
      });
      
    } catch (error) {
      // تنظيف الملف المؤقت في حالة الخطأ
      if (tempPath && fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      
      if (error.code === 'ENOENT') {
        throw new Error('Cannot create temporary directory. Check filesystem permissions.');
      } else if (error.response) {
        throw new Error(`Download failed: ${error.response.status} - ${error.response.statusText}`);
      } else {
        throw new Error(`Download failed: ${error.message}`);
      }
    }
  }

  /**
   * Upload video to X-Design service - IMPROVED
   */
  async uploadVideo(videoPath) {
    try {
      console.log('Uploading video to X-Design...');

      // التحقق من وجود الملف
      if (!fs.existsSync(videoPath)) {
        throw new Error('Video file not found for upload');
      }

      const stats = fs.statSync(videoPath);
      if (stats.size === 0) {
        throw new Error('Video file is empty');
      }

      const formData = new FormData();
      formData.append('file', fs.createReadStream(videoPath));
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
          timeout: 180000, // 3 minutes
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      console.log('Upload successful:', uploadResponse.data);
      return uploadResponse.data;
      
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Process video background removal - IMPROVED
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

      console.log('Sending processing request:', payload);

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
   * Clean up temporary files
   */
  cleanupTempFiles() {
    try {
      if (fs.existsSync(this.tempDir)) {
        const files = fs.readdirSync(this.tempDir);
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        files.forEach(file => {
          const filePath = path.join(this.tempDir, file);
          const stats = fs.statSync(filePath);
          
          // حذف الملفات الأقدم من ساعة
          if (now - stats.mtime.getTime() > oneHour) {
            fs.unlinkSync(filePath);
            console.log(`Cleaned up old file: ${file}`);
          }
        });
      }
    } catch (error) {
      console.error('Error cleaning temp files:', error);
    }
  }

  /**
   * Main method to remove background from video URL - IMPROVED
   */
  async processVideo(videoUrl) {
    let tempVideoPath = null;

    try {
      // تنظيف الملفات المؤقتة القديمة
      this.cleanupTempFiles();

      // Step 1: Download video
      tempVideoPath = await this.downloadVideo(videoUrl);

      // Step 2: Upload to X-Design
      const uploadData = await this.uploadVideo(tempVideoPath);
      
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
      
      const POLL_INTERVAL = 15000; // 15 seconds
      const MAX_ATTEMPTS = 40; // 10 minutes max
      
      let attempts = 0;
      
      while (attempts < MAX_ATTEMPTS) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));

        let status;
        try {
          status = await this.checkStatus(taskId);
          console.log(`Status check ${attempts}:`, status.status, status.progress || 0);
        } catch (statusError) {
          console.warn(`Status check ${attempts} failed:`, statusError.message);
          continue; // استمر في المحاولة
        }

        if (status.status === 'completed') {
          // تنظيف الملف المؤقت
          if (tempVideoPath && fs.existsSync(tempVideoPath)) {
            fs.unlinkSync(tempVideoPath);
          }

          return {
            success: true,
            task_id: taskId,
            download_url: status.download_url || status.result_url,
            message: 'تم إزالة الخلفية بنجاح'
          };
        } else if (status.status === 'failed') {
          throw new Error(status.error || 'فشل في معالجة الفيديو');
        }
      }

      throw new Error('انتهى وقت المعالجة');

    } catch (error) {
      // تنظيف الملف المؤقت في حالة الخطأ
      if (tempVideoPath && fs.existsSync(tempVideoPath)) {
        try {
          fs.unlinkSync(tempVideoPath);
        } catch (cleanupError) {
          console.error('Error cleaning temp file:', cleanupError);
        }
      }
      
      throw error;
    }
  }
}

// ===================================
// EXPRESS ROUTER IMPLEMENTATION - IMPROVED
// ===================================

const bgRemover = new XDesignBackgroundRemover();

const router = express.Router();

/**
 * Video Background Removal API - IMPROVED
 */
router.get("/remove-bg", async (req, res) => {
  const { url, quality, format } = req.query;

  if (!url) {
    return res.status(400).json({
      status: false,
      message: "يرجى تقديم رابط الفيديو عبر المعلمة ?url="
    });
  }

  // Validate URL
  try {
    const urlObj = new URL(url);
    
    // التحقق من البروتوكولات المسموحة
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return res.status(400).json({
        status: false,
        message: "الرابط يجب أن يستخدم HTTP أو HTTPS"
      });
    }
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
    
    // رسائل خطأ أكثر تحديداً
    let userMessage = "حدث خطأ أثناء إزالة خلفية الفيديو";
    let suggestion = "تأكد من أن الرابط صالح وأن الفيديو لا يتعدى 100MB";
    
    if (error.message.includes('ENOENT') || error.message.includes('permissions')) {
      userMessage = "مشكلة في نظام الملفات";
      suggestion = "تحقق من صلاحيات الكتابة في المجلد";
    } else if (error.message.includes('timeout')) {
      userMessage = "انتهت مهلة العملية";
      suggestion = "حاول مرة أخرى مع فيديو أصغر حجماً";
    } else if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
      userMessage = "مشكلة في الاتصال بالخادم";
      suggestion = "تحقق من اتصال الإنترنت وحاول مرة أخرى";
    }
    
    res.status(500).json({
      status: false,
      message: userMessage,
      error: error.message,
      suggestion: suggestion
    });
  }
});

// الباقي من الكود يبقى كما هو...
// [Status check endpoint, Download endpoint, Test endpoint]

/**
 * Status check endpoint
 */
router.get("/remove-bg/status", async (req, res) => {
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
 * Direct download endpoint
 */
router.get("/remove-bg/download", async (req, res) => {
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

    // Set appropriate headers
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="video_no_bg_${Date.now()}.mp4"`);

    // Pipe the video stream to response
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

// ===================================
// SIMPLE TEST ENDPOINT
// ===================================

/**
 * Test endpoint - Simulate background removal
 */
router.get("/remove-bg/test", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: false,
      message: "يرجى تقديم رابط الفيديو"
    });
  }

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Return mock response for testing
  res.json({
    status: true,
    message: "وضع الاختبار - تم محاكاة إزالة الخلفية بنجاح",
    task_id: `test_task_${Date.now()}`,
    download_url: "https://example.com/processed_video.mp4",
    note: "هذا استجابة تجريبية، الخدمة الفعلية تحتاج اتصال حقيقي",
    original_url: url
  });
});

module.exports = {
  path: "/api/ai",
  name: "X-Design Background Remover",
  type: "ai",
  url: `${global.t}/api/ai/remove-bg?url=https://files.catbox.moe/ry9yl8.mp4`,
  logo: "",
  description: "إزالة خلفية الفيديو باستخدام الذكاء الاصطناعي",
  router
};
