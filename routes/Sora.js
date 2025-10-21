const express = require("express");
const axios = require("axios");
const https = require("https");
const crypto = require("crypto");

// ===================================
// 1. UTILITY FUNCTION: SpoofHead (IP Spoofing)
// ===================================

/**
 * SpoofHead: Generates spoofed IP headers (X-Forwarded-For, X-Real-IP, etc.).
 * @returns {object} Spoofed IP headers.
 */
const SpoofHead = (extra = {}) => {
  const ip = [10, crypto.randomInt(256), crypto.randomInt(256), crypto.randomInt(256)].join(".");
  const genericHeaders = {
    "x-forwarded-for": ip,
    "x-real-ip": ip,
    "client-ip": ip,
    "x-client-ip": ip,
    "x-cluster-client-ip": ip,
    "x-original-forwarded-for": ip
  };
  return {
    ...genericHeaders,
    ...extra
  };
};

// ===================================
// 2. SORA VIDEO SERVICE CLASS - IMPROVED
// ===================================

class SoraVideo {
  constructor() {
    this.config = {
      baseURL: "https://aiomnigen.com",
      endpoint: "/video/sora",
      timeout: 60000, // Increased to 60 seconds
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
        keepAlive: true
      })
    };
    this.axiosInstance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      httpsAgent: this.config.httpsAgent
    });
  }

  buildHeader(action, routerState) {
    return {
      accept: "text/x-component",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "no-cache",
      "content-type": "text/plain;charset=UTF-8",
      "next-action": action,
      "next-router-state-tree": routerState,
      origin: "https://aiomnigen.com",
      pragma: "no-cache",
      priority: "u=1, i",
      referer: "https://aiomnigen.com/video/sora",
      "sec-ch-ua": '"Chromium";v="127", "Not)A;Brand";v="99", "Microsoft Edge";v="127"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0",
      ...SpoofHead()
    };
  }

  /**
   * Improved response parser with better error handling
   */
  parseResponse(data) {
    try {
      const result = {};
      const lines = data.split("\n").filter(line => line.trim());
      
      for (const line of lines) {
        const match = line.match(/^(\d+):(.+)$/);
        if (match) {
          const index = parseInt(match[1]);
          const jsonStr = match[2].trim();
          try {
            const parsed = JSON.parse(jsonStr);
            result[index] = parsed;
          } catch (parseError) {
            console.warn(`Failed to parse JSON at index ${index}:`, jsonStr.substring(0, 100));
          }
        }
      }
      return result;
    } catch (error) {
      console.error("Error parsing response:", error.message);
      return {};
    }
  }

  async generate({ prompt, imageUrl, ...rest }) {
    try {
      console.log("Starting video generation with prompt:", prompt.substring(0, 100) + "...");
      
      let controlImages = [];
      
      // Handle image URL if provided
      if (imageUrl) {
        try {
          if (typeof imageUrl === "string" && imageUrl.startsWith("http")) {
            console.log("Downloading reference image...");
            const imgRes = await axios.get(imageUrl, { 
              responseType: "arraybuffer",
              timeout: 30000 
            });
            const b64 = Buffer.from(imgRes.data).toString("base64");
            controlImages = [`data:image/jpeg;base64,${b64}`];
          } else if (Buffer.isBuffer(imageUrl)) {
            const b64 = imageUrl.toString("base64");
            controlImages = [`data:image/jpeg;base64,${b64}`];
          } else {
            controlImages = [imageUrl];
          }
          console.log("Reference image processed successfully");
        } catch (imgError) {
          console.warn("Failed to process image, continuing without reference image:", imgError.message);
        }
      }

      // Build parameters
      const aspectRatio = rest?.aspect_ratio || "9:16";
      const videoType = rest?.video_type || "standard";
      const seconds = rest?.seconds || "15";
      
      const processedPrompt = `create video: orientation : portrait , ${prompt}`;
      
      const payload = [{
        model_id: "sora-2-tuzi",
        prompt: prompt,
        prompt_process: processedPrompt,
        seed: 0,
        randomize_seed: true,
        aspect_ratio: aspectRatio,
        control_images: controlImages,
        control_images_2: [],
        control_files: [],
        control_files_2: [],
        disable_safety_checker: false,
        enable_safety_checker: false,
        output_format: "png",
        num_outputs: 1,
        meta_data: {
          prompt_preset: "default",
          video_type: videoType,
          seconds: seconds
        },
        use_credits: 1,
        width: aspectRatio === "16:9" ? 1280 : 720,
        height: aspectRatio === "16:9" ? 720 : 1280,
        duration: "5",
        resolution: "480p",
        generation_type: "video",
        model_config: { 
          id: "sora-2-tuzi",
          apiInput: "$0:0:model_config:apiInputs:free"
        }
      }];
      
      console.log("Sending generation request...");
      
      const response = await this.axiosInstance.post(
        this.config.endpoint, 
        JSON.stringify(payload), 
        {
          headers: this.buildHeader(
            "7f3d38b141c801aaf1ab2783bf1b968689332943ce", 
            "%5B%22%22%2C%7B%22children%22%3A%5B%5B%22locale%22%2C%22en%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22video%22%2C%7B%22children%22%3A%5B%5B%22casePage%22%2C%22sora%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2C%22%2Fvideo%2Fsora%22%2C%22refresh%22%5D%7D%5D%7D%5D%7D%5D%7D%2Cnull%2Cnull%2Ctrue%5D"
          )
        }
      );
      
      console.log("Raw response received:", response.data.substring(0, 500) + "...");
      
      const parsedResponse = this.parseResponse(response.data);
      console.log("Parsed response:", JSON.stringify(parsedResponse, null, 2));
      
      // Multiple possible locations for task_id
      const taskId = 
        parsedResponse?.[1]?.data || 
        parsedResponse?.[1]?.task_id ||
        parsedResponse?.[0]?.data ||
        parsedResponse?.[2]?.data;
      
      if (!taskId) {
        console.error("No task ID found in response. Full response:", parsedResponse);
        throw new Error("No task ID received in response. Service may be unavailable or parameters invalid.");
      }
      
      console.log("Task ID obtained:", taskId);
      return { 
        status: true, 
        task_id: taskId,
        message: "Generation started successfully"
      };
      
    } catch (error) {
      console.error("Generation error details:", error.response?.data || error.message);
      throw new Error(`Generation failed: ${error.message}`);
    }
  }

  async status({ task_id }) {
    try {
      console.log("Checking status for task:", task_id);
      
      const payload = [task_id];
      const response = await this.axiosInstance.post(
        this.config.endpoint, 
        JSON.stringify(payload), 
        {
          headers: this.buildHeader(
            "7f19b44cadf964c6497251f7dbb02e01c93d256a4e", 
            "%5B%22%22%2C%7B%22children%22%3A%5B%5B%22locale%22%2C%22en%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22video%22%2C%7B%22children%22%3A%5B%5B%22casePage%22%2C%22sora%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2C%22%2Fvideo%2Fsora%22%2C%22refresh%22%5D%7D%5D%7D%5D%7D%5D%7D%2Cnull%2Cnull%2Ctrue%5D"
          )
        }
      );
      
      const parsedResponse = this.parseResponse(response.data);
      const responseData = parsedResponse?.[1]?.body || parsedResponse?.[1] || {};
      
      console.log("Status response:", JSON.stringify(responseData, null, 2));
      
      const status = responseData.status === 'succeeded' ? 'completed' : 
                    responseData.status === 'failed' ? 'failed' : 
                    responseData.status || "processing";

      return {
        status: status,
        data: responseData.data || responseData,
        progress: responseData.progress || 0,
        message: responseData.message || ""
      };
      
    } catch (error) {
      console.error("Status check error:", error.message);
      throw new Error(`Status check failed: ${error.message}`);
    }
  }
}

// ===================================
// 3. EXPRESS ROUTER IMPLEMENTATION
// ===================================

const soraAPI = new SoraVideo();
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const router = express.Router();

/**
 * Sora AI Video Generation API - IMPROVED
 */
router.get("/sora", async (req, res) => {
  const { q, aspect_ratio, video_type, seconds, image_url } = req.query;
  const prompt = q || "";

  if (!prompt || prompt.trim().length < 3) {
    return res.status(400).json({
      status: false,
      message: "يرجى إدخال وصف مفصل لتوليد الفيديو (3 أحرف على الأقل)."
    });
  }

  try {
    console.log(`Received generation request: "${prompt.substring(0, 50)}..."`);
    
    // 1. Send generation request
    const genResponse = await soraAPI.generate({ 
      prompt: prompt.trim(), 
      imageUrl: image_url,
      aspect_ratio: aspect_ratio || "9:16",
      video_type: video_type || "standard",
      seconds: seconds || "15"
    });
    
    if (!genResponse.status) {
      throw new Error(genResponse.message || "Failed to start generation");
    }
    
    const task_id = genResponse.task_id;

    // 2. Start polling for result with improved logic
    const POLL_INTERVAL = 15000; // 15 seconds
    const MAX_ATTEMPTS = 40; // 10 minutes max
    let attempts = 0;

    while (attempts < MAX_ATTEMPTS) {
      attempts++;
      await sleep(POLL_INTERVAL);

      let statusResponse;
      try {
        statusResponse = await soraAPI.status({ task_id });
        console.log(`Polling attempt ${attempts}:`, statusResponse.status, statusResponse.progress + "%");
      } catch (pollError) {
        console.error(`Status check error for ${task_id}:`, pollError.message);
        // Continue polling on status errors
        continue;
      }

      const { status, progress, data, message } = statusResponse;

      if (status === 'completed') {
        const videoUrl = data?.url || data?.video_url || data?.output?.[0] || data?.result_url;
        
        if (videoUrl) {
          return res.json({
            status: true,
            message: "تم توليد الفيديو بنجاح!",
            task_id: task_id,
            video_url: videoUrl,
            prompt: prompt,
            progress: 100,
            duration: "15-25 seconds"
          });
        } else {
          throw new Error("اكتملت المهمة ولكن لم يتم العثور على رابط الفيديو في الاستجابة.");
        }
      } 
      
      else if (status === 'failed') {
        throw new Error(message || "فشلت مهمة توليد الفيديو. قد يكون السبب محتوى غير مناسب أو خطأ في الخادم.");
      } 
      
      else if (status === 'pending' || status === 'processing') {
        // Send progress update for long polling
        if (attempts % 3 === 0) { // Every 45 seconds
          res.write(JSON.stringify({
            status: "processing",
            message: "جاري توليد الفيديو...",
            task_id: task_id,
            progress: progress,
            attempts: attempts
          }) + "\n");
        }
      }
      
      else {
        console.warn(`Unknown status '${status}' for task ${task_id}`);
      }
    }

    throw new Error(`انتهى وقت الانتظار (10 دقائق) ولم تكتمل المهمة. حاول مرة أخرى لاحقًا.`);

  } catch (err) {
    console.error("[SORA AI ERROR]:", err.message);
    res.status(500).json({
      status: false,
      message: "حدث خطأ أثناء توليد الفيديو.",
      error: err.message,
      suggestion: "جرب وصفًا مختلفًا أو انتظر قليلاً ثم حاول مرة أخرى"
    });
  }
});

/**
 * Sora Status Check Endpoint - IMPROVED
 */
router.get("/sora/status", async (req, res) => {
  const { task_id } = req.query;

  if (!task_id) {
    return res.status(400).json({
      status: false,
      message: "يرجى إدخال رقم المهمة (task_id)."
    });
  }

  try {
    const response = await soraAPI.status({ task_id });
    
    const result = {
      status: true,
      task_id: task_id,
      generation_status: response.status,
      progress: response.progress,
      message: response.message || ""
    };

    if (response.status === 'completed') {
      const videoUrl = response.data?.url || response.data?.video_url || response.data?.output?.[0];
      if (videoUrl) {
        result.video_url = videoUrl;
        result.message = "تم الانتهاء من توليد الفيديو بنجاح!";
      }
    }

    res.json(result);

  } catch (err) {
    console.error("[SORA STATUS ERROR]:", err.message);
    res.status(500).json({
      status: false,
      message: "حدث خطأ أثناء التحقق من حالة المهمة.",
      error: err.message
    });
  }
});

module.exports = {
  path: "/api/ai",
  name: "Sora AI Video",
  type: "ai",
  url: `${global.baseURL}/api/ai/sora?q=a cat flying in space`,
  logo: "",
  description: "توليد فيديو باستخدام Sora AI من وصف نصي أو صورة مرجعية",
  router
};
