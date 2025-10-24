// بسم الله الرحمن الرحيم ✨
// Facebook Live Stream API
// إطلاق بث مباشر على فيسبوك باستخدام مفتاح البث ورابط m3u8

const express = require("express");
const { spawn } = require('child_process');

const router = express.Router();


const activeStreams = new Map();


async function startLiveStream(key, m3u8) {
  return new Promise((resolve, reject) => {
    const rtmps = `rtmps://live-api-s.facebook.com:443/rtmp/${key}`;
    
    const args = [
      '-reconnect', '1',
      '-reconnect_streamed', '1',
      '-reconnect_delay_max', '300',
      '-rw_timeout', '30000000',
      '-timeout', '30000000',
      '-i', m3u8,
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-ar', '44100',
      '-ac', '2',
      '-f', 'flv',
      rtmps
    ];

    try {
      const ffmpeg = spawn('ffmpeg', args);
      const streamId = Date.now().toString();
      
      const streamInfo = {
        id: streamId,
        key: key,
        m3u8: m3u8,
        rtmps: rtmps,
        process: ffmpeg,
        startTime: new Date(),
        status: 'running'
      };


      activeStreams.set(streamId, streamInfo);

      let output = '';
      
      ffmpeg.stderr.on('data', (data) => {
        const line = data.toString();
        output += line;
        

        if (line.includes('frame=') && line.includes('fps=')) {
          resolve({
            success: true,
            streamId: streamId,
            message: "✅ تم إطلاق البث المباشر بنجاح",
            info: {
              streamId: streamId,
              key: key,
              m3u8: m3u8,
              rtmps: rtmps,
              startTime: streamInfo.startTime,
              status: 'live',
              platform: 'facebook'
            }
          });
        }
      });

      ffmpeg.on('close', (code) => {
        const stream = activeStreams.get(streamId);
        if (stream) {
          stream.status = 'closed';
          stream.endTime = new Date();
        }
        
        if (code !== 0 && !output.includes('frame=')) {
          reject(new Error("❌ فشل في إطلاق البث - تحقق من الرابط أو المفتاح"));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(error);
      });


      setTimeout(() => {
        if (!output.includes('frame=')) {
          reject(new Error("⏰ انتهى وقت الانتظار لبدء البث"));
        }
      }, 10000);

    } catch (error) {
      reject(error);
    }
  });
}


router.get("/live", async (req, res) => {
  const { key, m3u8 } = req.query;

  if (!key || !m3u8) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى إدخال مفتاح البث ورابط m3u8",
      usage: "/api/facebook/live?key=مفتاح_البث&m3u8=رابط_m3u8"
    });
  }

  try {
    const result = await startLiveStream(key, m3u8);
    
    res.json({
      status: 200,
      success: true,
      message: "🚀 تم إطلاق البث المباشر بنجاح!",
      data: result.info,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    res.status(500).json({
      status: 500,
      success: false,
      message: "❌ فشل في إطلاق البث المباشر",
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});


router.get("/streams", (req, res) => {
  const streams = [];
  
  activeStreams.forEach((stream, id) => {
    streams.push({
      id: stream.id,
      key: stream.key,
      m3u8: stream.m3u8,
      status: stream.status,
      startTime: stream.startTime,
      endTime: stream.endTime || null,
      platform: 'facebook'
    });
  });

  res.json({
    status: 200,
    success: true,
    total: streams.length,
    active: streams.filter(s => s.status === 'running').length,
    streams: streams
  });
});

module.exports = {
  path: "/api/facebook",
  name: "facebook live stream",
  type: "facebook",
  url: `${global.t}/api/facebook/live?key=FB-123abc&m3u8=https://example.com/live.m3u8`,
  logo: "",
  description: "إطلاق بث مباشر على فيسبوك باستخدام مفتاح البث ورابط m3u8",
  router
};
