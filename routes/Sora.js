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
// 2. SORA VIDEO SERVICE CLASS
// ===================================

class SoraVideo {
  constructor() {
    this.config = {
      baseURL: "https://aiomnigen.com",
      endpoint: "/video/sora",
      timeout: 3e4, // 30 seconds
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
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
      "accept-language": "id-ID",
      "cache-control": "no-cache",
      "content-type": "text/plain;charset=UTF-8",
      "next-action": action,
      "next-router-state-tree": routerState,
      origin: "https://aiomnigen.com",
      pragma: "no-cache",
      priority: "u=1, i",
      referer: "https://aiomnigen.com/video/sora",
      "sec-ch-ua": '"Chromium";v="127", "Not)A;Brand";v="99", "Microsoft Edge Simulate";v="127", "Lemur";v="127"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
      ...SpoofHead()
    };
  }

  /**
   * Parses the multi-line, colon-separated response format (e.g., 1:{"key":"value"}).
   */
  pr(dt) {
    const result = {};
    const lines = dt.split("\n").filter(line => line.trim());
    for (const line of lines) {
      const match = line.match(/^(\d+):(.+)$/);
      if (match) {
        const index = parseInt(match[1]);
        const jsonStr = match[2].trim();
        try {
          const parsed = JSON.parse(jsonStr);
          result[index] = parsed;
        } catch (e) {
          // Warning silenced for cleaner output
        }
      }
    }
    return result;
  }

  async generate({ prompt, imageUrl, ...rest }) {
    try {
      let ctrlImg = [];
      if (imageUrl) {
        if (typeof imageUrl === "string" && imageUrl.startsWith("http")) {
          const imgRes = await axios.get(imageUrl, { responseType: "arraybuffer" });
          const b64 = Buffer.from(imgRes.data).toString("base64");
          ctrlImg = [`data:image/jpeg;base64,${b64}`];
        } else if (Buffer.isBuffer(imageUrl)) {
          const b64 = imageUrl.toString("base64");
          ctrlImg = [`data:image/jpeg;base64,${b64}`];
        } else {
          ctrlImg = [imageUrl];
        }
      }

      const ar = rest?.aspect_ratio || "9:16";
      const w = ar === "16:9" ? 1280 : 720;
      const h = ar === "16:9" ? 720 : 1280;
      const vt = rest?.video_type || "standard";
      const secs = rest?.seconds || "15";
      const prc = `create video: orientation : portrait , ${prompt}`;
      
      const pd = [{
        model_id: "sora-2-tuzi",
        prompt: prompt,
        prompt_process: prc,
        seed: 0,
        randomize_seed: true,
        aspect_ratio: ar,
        control_images: ctrlImg,
        control_images_2: [],
        control_files: [],
        control_files_2: [],
        disable_safety_checker: false,
        enable_safety_checker: false,
        output_format: "png",
        num_outputs: 1,
        meta_data: {
          prompt_preset: "default",
          video_type: vt,
          seconds: secs
        },
        use_credits: 1,
        width: w,
        height: h,
        duration: "5",
        resolution: "480p",
        generation_type: "video",
        model_config: { 
            id: "sora-2-tuzi",
            label: "Sora 2 (Slow Beta)",
            description: "Most advanced video model from openai",
            supportedAspectRatios: ["9:16", "16:9"],
            tag: ["Text to Video", "Image to Video"],
            badge: [],
            useCredits: 1,
            supportAddFiles: [{
              name: "control_images",
              label: "Reference Image",
              type: "image",
              isRequired: false,
              isSupport: 1
            }],
            customParameters: [{
              name: "video_type",
              label: "Type",
              type: "select",
              defaultValue: "standard",
              description: "Choose the duration of the video.",
              multiple: 4,
              options: [{
                value: "standard",
                label: "Standard"
              }, {
                value: "pro",
                label: "Pro (Support 25s)"
              }]
            }, {
              name: "seconds",
              label: "Seconds",
              type: "select",
              defaultValue: "15",
              description: "Choose the duration of the video.",
              options: [{
                value: "15",
                label: "15"
              }, {
                value: "25",
                label: "25 (Only Pro)"
              }]
            }],
            type: "video",
            options: {
              note: ["This version uses fewer credits but runs more slowly.", "Input images with faces of humans are currently rejected.", "Pro video wait time is approximately 6-8 minutes, more than twice that of the standard version."]
            },
            apiInputs: {
              default: {
                provider: "tuzi",
                endpoint: "https://api.tu-zi.com/v1/videos",
                rules: [{
                  to: "model",
                  from: "meta_data.video_type",
                  transform: [{
                    op: "enumMap",
                    map: {
                      standard: "sora-2",
                      pro: "sora-2-pro"
                    },
                    default: "sora-2"
                  }]
                }, {
                  to: "prompt",
                  from: ["prompt_process", "prompt"],
                  transform: [{
                    op: "coalesce"
                  }]
                }, {
                  to: "seconds",
                  from: "meta_data.seconds",
                  when: {
                    equals: ["meta_data.video_type", "pro"]
                  },
                  transform: [{
                    op: "toString"
                  }, {
                    op: "default",
                    value: "15"
                  }]
                }, {
                  to: "input_reference",
                  from: "control_images",
                  transform: [{
                    op: "pick",
                    index: 0
                  }, {
                    op: "toFile"
                  }]
                }, {
                  to: "size",
                  from: "aspect_ratio",
                  transform: [{
                    op: "enumMap",
                    map: {
                      "9:16": "720x1280",
                      "16:9": "1280x720"
                    },
                    default: "1280x720"
                  }]
                }]
              },
              free: {
                provider: "tuzi",
                endpoint: "https://api.tu-zi.com/v1/videos",
                rules: [{
                  to: "model",
                  from: "meta_data.video_type",
                  transform: [{
                    op: "enumMap",
                    map: {
                      standard: "sora-2",
                      pro: "sora-2-pro"
                    },
                    default: "sora-2"
                  }]
                }, {
                  to: "prompt",
                  from: ["prompt_process", "prompt"],
                  transform: [{
                    op: "coalesce"
                  }]
                }, {
                  to: "seconds",
                  from: "meta_data.seconds",
                  when: {
                    equals: ["meta_data.video_type", "pro"]
                  },
                  transform: [{
                    op: "toString"
                  }, {
                    op: "default",
                    value: "15"
                  }]
                }, {
                  to: "input_reference",
                  from: "control_images",
                  transform: [{
                    op: "pick",
                    index: 0
                  }, {
                    op: "toFile"
                  }]
                }, {
                  to: "size",
                  from: "aspect_ratio",
                  transform: [{
                    op: "enumMap",
                    map: {
                      "9:16": "720x1280",
                      "16:9": "1280x720"
                    },
                    default: "1280x720"
                  }]
                }]
              },
              default_completion: {
                provider: "tuzi",
                endpoint: "https://asyncdata.net/tran/https://api.tu-zi.com/v1/chat/completions",
                rules: [{
                  to: "model",
                  from: "meta_data.video_type",
                  transform: [{
                    op: "enumMap",
                    map: {
                      standard: "sora-2",
                      pro: "sora-2-pro"
                    },
                    default: "sora-2"
                  }]
                }, {
                  to: "messages",
                  from: "raw",
                  transform: [{
                    op: "customFn",
                    fn: "build_messages"
                  }]
                }]
              }
            },
            apiInput: "$0:0:model_config:apiInputs:free"
        }
      }];
      
      const ds = JSON.stringify(pd);
      
      const res = await this.axiosInstance.post(this.config.endpoint, ds, {
        headers: this.buildHeader("7f3d38b141c801aaf1ab2783bf1b968689332943ce", "%5B%22%22%2C%7B%22children%22%3A%5B%5B%22locale%22%2C%22en%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22video%22%2C%7B%22children%22%3A%5B%5B%22casePage%22%2C%22sora%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2C%22%2Fvideo%2Fsora%22%2C%22refresh%22%5D%7D%5D%7D%5D%7D%5D%7D%2Cnull%2Cnull%2Ctrue%5D")
      });
      
      const ps = this.pr(res.data);
      const tsk = ps?.[1]?.data;
      if (!tsk) throw new Error("No task ID received in response.");
      return { task_id: tsk };
    } catch (e) {
      throw new Error(`Generation failed: ${e.message}`);
    }
  }

  async status({ task_id }) {
    try {
      const ds = JSON.stringify([task_id]);
      const res = await this.axiosInstance.post(this.config.endpoint, ds, {
        headers: this.buildHeader("7f19b44cadf964c6497251f7dbb02e01c93d256a4e", "%5B%22%22%2C%7B%22children%22%3A%5B%5B%22locale%22%2C%22en%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22video%22%2C%7B%22children%22%3A%5B%5B%22casePage%22%2C%22sora%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2C%22%2Fvideo%2Fsora%22%2C%22refresh%22%5D%7D%5D%7D%5D%7D%5D%7D%2Cnull%2Cnull%2Ctrue%5D")
      });
      
      const ps = this.pr(res.data);
      const responseData = ps?.[1]?.body || {};
      
      const status = responseData.status === 'succeeded' ? 'completed' : responseData.status || "unknown";

      return {
        status: status,
        data: responseData.data || {},
        progress: responseData.progress || 0,
        httpStatus: ps?.[1]?.httpStatus
      };
    } catch (e) {
      throw new Error(`Status check failed: ${e.message}`);
    }
  }
}

// ===================================
// 3. EXPRESS ROUTER IMPLEMENTATION
// ===================================

const soraAPI = new SoraVideo();

/**
 * Helper function to pause execution.
 * @param {number} ms - Milliseconds to sleep.
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const router = express.Router();

/**
 * Sora AI Video Generation API
 * مثال:
 *   /api/sora?q=a cat flying in space
 *   /api/sora?q=a sunset on the beach&aspect_ratio=16:9&video_type=pro
 */
router.get("/sora", async (req, res) => {
  const { q, aspect_ratio, video_type, seconds, image_url } = req.query;
  const prompt = q || "";

  if (!prompt) {
    return res.status(400).json({
      status: false,
      message: "يرجى إدخال وصف لتوليد الفيديو."
    });
  }

  try {
    // 1. Send generation request
    const genResponse = await soraAPI.generate({ 
      prompt, 
      imageUrl: image_url,
      aspect_ratio: aspect_ratio || "9:16",
      video_type: video_type || "standard",
      seconds: seconds || "15"
    });
    
    const task_id = genResponse.task_id;

    // 2. Start polling for result
    const POLL_INTERVAL = 20000; // 20 seconds
    const MAX_ATTEMPTS = 30; // 10 minutes max
    let attempts = 0;

    while (attempts < MAX_ATTEMPTS) {
      attempts++;
      await sleep(POLL_INTERVAL);

      let statusResponse;
      try {
        statusResponse = await soraAPI.status({ task_id });
      } catch (pollError) {
        console.error(`Sora status check error for ${task_id}: ${pollError.message}`);
        continue;
      }

      const { status, progress, data } = statusResponse;

      if (status === 'completed') {
        const videoUrl = data?.url || data?.video_url;
        
        if (videoUrl) {
          return res.json({
            status: true,
            message: "تم توليد الفيديو بنجاح!",
            task_id: task_id,
            video_url: videoUrl,
            prompt: prompt,
            progress: 100
          });
        } else {
          throw new Error(`اكتملت المهمة ولكن لم يتم العثور على رابط الفيديو.`);
        }
      } 
      
      else if (status === 'failed') {
        throw new Error(`فشلت مهمة توليد الفيديو. قد يكون السبب محتوى غير مناسب أو خطأ في الخادم.`);
      } 
      
      else if (status === 'pending' || status === 'processing') {
        // Continue polling
        console.log(`Sora task ${task_id} progress: ${progress}%`);
      } 
      
      else {
        console.warn(`Sora: Received unknown status '${status}' for task ${task_id}`);
      }
    }

    throw new Error(`انتهى وقت الانتظار (10 دقائق) ولم تكتمل المهمة.`);

  } catch (err) {
    console.error("[ERROR] Sora AI:", err.message);
    res.status(500).json({
      status: false,
      message: "حدث خطأ أثناء توليد الفيديو.",
      error: err.message
    });
  }
});

/**
 * Sora Status Check Endpoint
 * مثال:
 *   /api/sora/status?task_id=sora-2:task_abc123
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
      progress: response.progress
    };

    if (response.status === 'completed') {
      const videoUrl = response.data?.url || response.data?.video_url;
      if (videoUrl) {
        result.video_url = videoUrl;
        result.message = "تم الانتهاء من توليد الفيديو بنجاح!";
      }
    }

    res.json(result);

  } catch (err) {
    console.error("[ERROR] Sora Status Check:", err.message);
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
  url: `${global.t}/api/ai/sora?q=a cat flying in space`,
  logo: "",
  description: "توليد فيديو باستخدام Sora AI من وصف نصي أو صورة مرجعية",
  router
};
