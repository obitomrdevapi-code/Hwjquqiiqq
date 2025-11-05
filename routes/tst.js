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
          "-c:v", "copy",
          "-c:a", "copy",
          "-f", "flv",
          streamUrl
        ];

        const ffmpegProcess = spawn("ffmpeg", ffmpegArgs, {
          stdio: ["ignore", "ignore", "ignore"]
        });

        const streamId = Math.random().toString(36).substring(7);
        const streamInfo = {
          process: ffmpegProcess,
          startTime: Date.now(),
          streamKey: streamKey,
          m3u8Url: m3u8Url,
          id: streamId
        };

        this.activeStreams[streamId] = streamInfo;

        // إيقاف البث تلقائياً بعد المدة المحددة
        setTimeout(() => {
          this.stopStream(streamId);
        }, this.STREAM_DURATION * 1000);

        ffmpegProcess.on("close", (code) => {
          if (this.activeStreams[streamId]) {
            delete this.activeStreams[streamId];
          }
        });

        ffmpegProcess.on("error", (error) => {
          delete this.activeStreams[streamId];
          reject(error);
        });

        resolve({
          success: true,
          streamId: streamId,
          message: "✅ تم بدء البث بنجاح",
          duration: this.STREAM_DURATION
        });

      } catch (error) {
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

        if (streamInfo.process && !streamInfo.process.killed) {
          streamInfo.process.kill("SIGTERM");
        }

        delete this.activeStreams[streamId];
        
        resolve({
          success: true,
          message: "🛑 تم إيقاف البث بنجاح",
          streamId: streamId
        });

      } catch (error) {
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
      duration: Math.floor((Date.now() - stream.startTime) / 1000)
    }));

    return {
      success: true,
      total: activeStreams.length,
      streams: activeStreams
    };
  }
};

// نقطة النهاية لبدء البث
router.get("/stream/start", async (req, res) => {
  try {
    const { key, m3u8 } = req.query;

    if (!key || !m3u8) {
      return res.json({
        success: false,
        message: "⚠️ يرجى تقديم مفتاح البث ورابط m3u8"
      });
    }

    const result = await freeFireStream.startStream(key, m3u8);
    res.json(result);

  } catch (error) {
    res.json({
      success: false,
      message: `❌ خطأ في بدء البث: ${error.message}`
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
        message: "⚠️ يرجى تقديم معرف البث"
      });
    }

    const result = await freeFireStream.stopStream(id);
    res.json(result);

  } catch (error) {
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
    res.json(result);

  } catch (error) {
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
        message: "⚠️ يرجى تقديم معرف البث"
      });
    }

    const streamInfo = freeFireStream.activeStreams[id];
    if (!streamInfo) {
      return res.json({
        success: false,
        message: "❌ البث غير موجود"
      });
    }

    res.json({
      success: true,
      stream: {
        id: streamInfo.id,
        streamKey: streamInfo.streamKey,
        m3u8Url: streamInfo.m3u8Url,
        startTime: streamInfo.startTime,
        duration: Math.floor((Date.now() - streamInfo.startTime) / 1000),
        status: "نشط"
      }
    });

  } catch (error) {
    res.json({
      success: false,
      message: `❌ خطأ في جلب معلومات البث: ${error.message}`
    });
  }
});

module.exports = {
  path: "/api/info",
  name: "roblox id info",
  type: "info",
  url: `${global.t}/api/info/stream/start`,
  logo: "https://tr.rbxcdn.com/1c3a4c9c7c3b8c7c3b8c7c3b8c7c3b8c/150/150/Image/Png",
  description: "جلب معلومات حساب Roblox عبر الايدي",
  router
};