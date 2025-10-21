const express = require("express");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

// ===================================
// X-DESIGN VIDEO BACKGROUND REMOVER
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
   * Download video from URL
   */
  async downloadVideo(videoUrl) {
    try {
      console.log(`Downloading video from: ${videoUrl}`);
      
      const response = await axios({
        method: 'GET',
        url: videoUrl,
        responseType: 'stream',
        timeout: 60000
      });

      const tempDir = path.join(__dirname, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempPath = path.join(tempDir, `video_${Date.now()}.mp4`);
      const writer = fs.createWriteStream(tempPath);

      return new Promise((resolve, reject) => {
        response.data.pipe(writer);
        writer.on('finish', () => {
          console.log(`Video downloaded to: ${tempPath}`);
          resolve(tempPath);
        });
        writer.on('error', reject);
      });
    } catch (error) {
      throw new Error(`Failed to download video: ${error.message}`);
    }
  }

  /**
   * Upload video to X-Design service
   */
  async uploadVideo(videoPath) {
    try {
      console.log('Uploading video to X-Design...');

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
          timeout: 120000
        }
      );

      console.log('Upload response:', uploadResponse.data);
      return uploadResponse.data;
    } catch (error) {
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
   * Main method to remove background from video URL
   */
  async processVideo(videoUrl) {
    let tempVideoPath = null;

    try {
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
      
      const POLL_INTERVAL = 10000; // 10 seconds
      const MAX_ATTEMPTS = 30; // 5 minutes max
      
      let attempts = 0;
      
      while (attempts < MAX_ATTEMPTS) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));

        const status = await this.checkStatus(taskId);
        console.log(`Status check ${attempts}:`, status.status);

        if (status.status === 'completed') {
          // Clean up temp file
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
        
        // Continue polling if still processing
      }

      throw new Error('انتهى وقت المعالجة');

    } catch (error) {
      // Clean up temp file on error
      if (tempVideoPath && fs.existsSync(tempVideoPath)) {
        fs.unlinkSync(tempVideoPath);
      }
      
      throw error;
    }
  }
}

// ===================================
// EXPRESS ROUTER IMPLEMENTATION
// ===================================

const bgRemover = new XDesignBackgroundRemover();

const router = express.Router();

/**
 * Video Background Removal API
 * مثال: /api/remove-bg?url=https://example.com/video.mp4
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
    new URL(url);
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: "رابط الفيديو غير صالح"
    });
  }

  // Validate video URL extension
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
  const hasVideoExtension = videoExtensions.some(ext => 
    url.toLowerCase().includes(ext)
  );

  if (!hasVideoExtension) {
    return res.status(400).json({
      status: false,
      message: "الرابط يجب أن يكون لفيديو (mp4, mov, avi, etc.)"
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
      timeout: 60000
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
  description: "تست",
  router
};
