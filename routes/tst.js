const express = require("express");
const { spawn } = require("child_process");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

// كائن إدارة البثوث
const freeFireStream = {
  activeStreams: {},
  STREAM_DURATION: 8 * 60 * 60,

  // دالة تشغيل البث
  startStream: function(streamKey, m3u8Url) {
    return new Promise((resolve, reject) => {
      try {
        const streamUrl = `rtmps://live-api-s.facebook.com:443/rtmp/${streamKey}`;
        
        const ffmpegArgs = [
          "-re",
          "-i", m3u8Url,
          "-c:v", "libx264",
          "-preset", "veryfast",
          "-maxrate", "3000k",
          "-bufsize", "6000k",
          "-pix_fmt", "yuv420p",
          "-g", "50",
          "-c:a", "aac",
          "-b:a", "128k",
          "-ar", "44100",
          "-f", "flv",
          streamUrl
        ];

        console.log(`🎬 بدء البث إلى: ${streamUrl}`);
        console.log(`📹 المصدر: ${m3u8Url}`);

        const ffmpegProcess = spawn("ffmpeg", ffmpegArgs, {
          stdio: ["ignore", "pipe", "pipe"]
        });

        const streamId = Math.random().toString(36).substring(7);
        
        // جمع output للتصحيح
        let stdout = '';
        let stderr = '';

        ffmpegProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        ffmpegProcess.stderr.on('data', (data) => {
          stderr += data.toString();
          console.log(`FFmpeg: ${data.toString()}`);
        });

        const streamInfo = {
          process: ffmpegProcess,
          startTime: Date.now(),
          streamKey: streamKey,
          m3u8Url: m3u8Url,
          id: streamId,
          status: "starting"
        };

        this.activeStreams[streamId] = streamInfo;

        // التحقق من نجاح البث بعد 10 ثواني
        const successCheck = setTimeout(() => {
          if (this.activeStreams[streamId] && this.activeStreams[streamId].status === "starting") {
            this.activeStreams[streamId].status = "active";
            console.log(`✅ البث ${streamId} يعمل بنجاح`);
          }
        }, 10000);

        ffmpegProcess.on("close", (code) => {
          clearTimeout(successCheck);
          console.log(`🔴 البث ${streamId} توقف مع كود: ${code}`);
          if (this.activeStreams[streamId]) {
            delete this.activeStreams[streamId];
          }
        });

        ffmpegProcess.on("error", (error) => {
          clearTimeout(successCheck);
          console.error(`❌ خطأ في البث ${streamId}:`, error);
          delete this.activeStreams[streamId];
          reject(error);
        });

        // إيقاف البث تلقائياً بعد المدة المحددة
        setTimeout(() => {
          this.stopStream(streamId);
        }, this.STREAM_DURATION * 1000);

        resolve({
          success: true,
          streamId: streamId,
          message: "✅ تم بدء البث بنجاح",
          duration: this.STREAM_DURATION,
          streamUrl: streamUrl,
          source: m3u8Url
        });

      } catch (error) {
        console.error('❌ خطأ في startStream:', error);
        reject(error);
      }
    });
  },

  // دالة إيقاف البث
  stopStream: function(streamId) {
    return new Promise((resolve, reject) => {
      try {
        const streamInfo = this.activeStreams[streamId];
        if (!streamInfo) {
          reject(new Error("❌ البث غير موجود"));
          return;
        }

        console.log(`🛑 إيقاف البث: ${streamId}`);

        if (streamInfo.process && !streamInfo.process.killed) {
          streamInfo.process.kill("SIGTERM");
          
          // تأكيد الإيقاف
          setTimeout(() => {
            if (!streamInfo.process.killed) {
              streamInfo.process.kill("SIGKILL");
            }
          }, 5000);
        }

        delete this.activeStreams[streamId];
        
        resolve({
          success: true,
          message: "🛑 تم إيقاف البث بنجاح",
          streamId: streamId
        });

      } catch (error) {
        console.error('❌ خطأ في stopStream:', error);
        reject(error);
      }
    });
  },

  // دالة الحصول على البثوث النشطة
  getActiveStreams: function() {
    const activeStreams = Object.values(this.activeStreams).map(stream => ({
      id: stream.id,
      streamKey: stream.streamKey,
      m3u8Url: stream.m3u8Url,
      startTime: stream.startTime,
      duration: Math.floor((Date.now() - stream.startTime) / 1000),
      status: stream.status || "active"
    }));

    return {
      success: true,
      total: activeStreams.length,
      streams: activeStreams
    };
  },

  // دالة التحقق من صحة رابط m3u8
  validateM3u8: async function(m3u8Url) {
    try {
      const response = await axios.get(m3u8Url, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      return response.status === 200 && response.data.includes('#EXTM3U');
    } catch (error) {
      console.error('❌ رابط m3u8 غير صالح:', error.message);
      return false;
    }
  }
};

// نقطة النهاية لبدء البث
router.get("/hh_start", async (req, res) => {
  try {
    const { key, m3u8 } = req.query;

    if (!key || !m3u8) {
      return res.json({
        success: false,
        message: "⚠️ يرجى تقديم مفتاح البث (key) ورابط m3u8"
      });
    }

    // التحقق من صحة رابط m3u8
    const isValidM3u8 = await freeFireStream.validateM3u8(m3u8);
    if (!isValidM3u8) {
      return res.json({
        success: false,
        message: "❌ رابط m3u8 غير صالح أو غير قابل للوصول"
      });
    }

    console.log(`🚀 طلب بدء بث جديد:`);
    console.log(`   🔑 المفتاح: ${key}`);
    console.log(`   📹 المصدر: ${m3u8}`);

    const result = await freeFireStream.startStream(key, m3u8);
    
    console.log(`✅ بدء البث بنجاح: ${result.streamId}`);
    res.json(result);

  } catch (error) {
    console.error('❌ خطأ في بدء البث:', error);
    res.json({
      success: false,
      message: `❌ خطأ في بدء البث: ${error.message}`,
      debug: "تأكد من تثبيت FFmpeg وتوفر رابط m3u8 صالح"
    });
  }
});

// نقطة النهاية لإيقاف البث
router.get("/stream/stop", async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.json({
        success: false,
        message: "⚠️ يرجى تقديم معرف البث (id)"
      });
    }

    console.log(`🛑 طلب إيقاف البث: ${id}`);
    const result = await freeFireStream.stopStream(id);
    res.json(result);

  } catch (error) {
    console.error('❌ خطأ في إيقاف البث:', error);
    res.json({
      success: false,
      message: `❌ خطأ في إيقاف البث: ${error.message}`
    });
  }
});

// نقطة النهاية لعرض البثوث النشطة
router.get("/stream/active", async (req, res) => {
  try {
    const result = freeFireStream.getActiveStreams();
    console.log(`📊 البثوث النشطة: ${result.total}`);
    res.json(result);

  } catch (error) {
    console.error('❌ خطأ في جلب البثوث النشطة:', error);
    res.json({
      success: false,
      message: `❌ خطأ في جلب البثوث النشطة: ${error.message}`
    });
  }
});

// نقطة النهاية للحصول على معلومات البث
router.get("/stream/info", async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.json({
        success: false,
        message: "⚠️ يرجى تقديم معرف البث (id)"
      });
    }

    const streamInfo = freeFireStream.activeStreams[id];
    if (!streamInfo) {
      return res.json({
        success: false,
        message: "❌ البث غير موجود"
      });
    }

    const duration = Math.floor((Date.now() - streamInfo.startTime) / 1000);
    const status = streamInfo.status || "active";

    res.json({
      success: true,
      stream: {
        id: streamInfo.id,
        streamKey: streamInfo.streamKey,
        m3u8Url: streamInfo.m3u8Url,
        startTime: streamInfo.startTime,
        duration: duration,
        status: status,
        remaining: freeFireStream.STREAM_DURATION - duration
      }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب معلومات البث:', error);
    res.json({
      success: false,
      message: `❌ خطأ في جلب معلومات البث: ${error.message}`
    });
  }
});

// نقطة النهاية للتحقق من صحة رابط m3u8
router.get("/stream/validate", async (req, res) => {
  try {
    const { m3u8 } = req.query;

    if (!m3u8) {
      return res.json({
        success: false,
        message: "⚠️ يرجى تقديم رابط m3u8"
      });
    }

    const isValid = await freeFireStream.validateM3u8(m3u8);
    
    res.json({
      success: true,
      valid: isValid,
      message: isValid ? "✅ رابط m3u8 صالح" : "❌ رابط m3u8 غير صالح"
    });

  } catch (error) {
    res.json({
      success: false,
      message: `❌ خطأ في التحقق: ${error.message}`
    });
  }
});

module.exports = {
  path: "/api/info",
  name: "freefire stream",
  type: "info",
  url: `${global.t}/api/info/hh_start?key=YOUR_KEY&m3u8=YOUR_M3U8_URL`,
  logo: "",
  description: "بث مباشر لـ Free Fire إلى Facebook",
  router
};