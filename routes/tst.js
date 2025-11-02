// بسم الله الرحمن الرحيم ✨
// YouTube Downloader API
// API لتحميل فيديوهات يوتيوب بجميع الجودات

const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const router = express.Router();

// تكوين الـ API
const savetube = {
  api: {
    base: "https://media.savetube.me/api",
    cdn: "/random-cdn",
    info: "/v2/info", 
    download: "/download"
  },
  headers: {
    'accept': '*/*',
    'content-type': 'application/json',
    'origin': 'https://yt.savetube.me',
    'referer': 'https://yt.savetube.me/',
    'user-agent': 'Postify/1.0.0'
  },
  formats: ['144', '240', '360', '480', '720', '1080', 'mp3'],

  crypto: {
    hexToBuffer: (hexString) => {
      const matches = hexString.match(/.{1,2}/g);
      return Buffer.from(matches.join(''), 'hex');
    },

    decrypt: async (enc) => {
      try {
        const secretKey = 'C5D58EF67A7584E4A29F6C35BBC4EB12';
        const data = Buffer.from(enc, 'base64');
        const iv = data.slice(0, 16);
        const content = data.slice(16);
        const key = savetube.crypto.hexToBuffer(secretKey);
        
        const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
        let decrypted = decipher.update(content);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        return JSON.parse(decrypted.toString());
      } catch (error) {
        throw new Error(`${error.message}`);
      }
    }
  },

  isUrl: str => { 
    try { 
      new URL(str); 
      return true; 
    } catch (_) { 
      return false; 
    } 
  },

  youtube: url => {
    if (!url) return null;
    const patterns = [
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/
    ];
    for (let pattern of patterns) {
      if (pattern.test(url)) return url.match(pattern)[1];
    }
    return null;
  },

  request: async (endpoint, data = {}, method = 'post') => {
    try {
      const { data: response } = await axios({
        method,
        url: `${endpoint.startsWith('http') ? '' : savetube.api.base}${endpoint}`,
        data: method === 'post' ? data : undefined,
        params: method === 'get' ? data : undefined,
        headers: savetube.headers,
        timeout: 30000
      });
      return {
        status: true,
        code: 200,
        data: response
      };
    } catch (error) {
      return {
        status: false,
        code: error.response?.status || 500,
        error: error.message
      };
    }
  },

  getCDN: async () => {
    const response = await savetube.request(savetube.api.cdn, {}, 'get');
    if (!response.status) return response;
    return {
      status: true,
      code: 200,
      data: response.data.cdn
    };
  },

  download: async (link, format) => {
    if (!link) {
      return {
        status: false,
        code: 400,
        error: "Please provide a link."
      };
    }

    if (!savetube.isUrl(link)) {
      return {
        status: false,
        code: 400,
        error: "Invalid link! Please enter a valid YouTube link."
      };
    }

    if (!format || !savetube.formats.includes(format)) {
      return {
        status: false,
        code: 400,
        error: "Invalid format! Choose from the available formats.",
        available_fmt: savetube.formats
      };
    }

    const id = savetube.youtube(link);
    if (!id) {
      return {
        status: false,
        code: 400,
        error: "Cannot extract YouTube video ID. Please check the link."
      };
    }

    try {
      const cdnx = await savetube.getCDN();
      if (!cdnx.status) return cdnx;
      const cdn = cdnx.data;

      const result = await savetube.request(`https://${cdn}${savetube.api.info}`, {
        url: `https://www.youtube.com/watch?v=${id}`
      });
      if (!result.status) return result;
      const decrypted = await savetube.crypto.decrypt(result.data.data);

      const dl = await savetube.request(`https://${cdn}${savetube.api.download}`, {
        id: id,
        downloadType: format === 'mp3' ? 'audio' : 'video',
        quality: format === 'mp3' ? '128' : format,
        key: decrypted.key
      });

      return {
        status: true,
        code: 200,
        result: {
          title: decrypted.title || "Unknown",
          type: format === 'mp3' ? 'audio' : 'video',
          format: format,
          thumbnail: decrypted.thumbnail || `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
          download: dl.data.data.downloadUrl,
          id: id,
          key: decrypted.key,
          duration: decrypted.duration,
          quality: format === 'mp3' ? '128' : format,
          downloaded: dl.data.data.downloaded || false
        }
      };

    } catch (error) {
      return {
        status: false,
        code: 500,
        error: error.message
      };
    }
  },

  // دالة جديدة لجلب جميع الجودات المتاحة
  getAllQualities: async (link) => {
    if (!link) {
      return {
        status: false,
        code: 400,
        error: "Please provide a link."
      };
    }

    if (!savetube.isUrl(link)) {
      return {
        status: false,
        code: 400,
        error: "Invalid link! Please enter a valid YouTube link."
      };
    }

    const id = savetube.youtube(link);
    if (!id) {
      return {
        status: false,
        code: 400,
        error: "Cannot extract YouTube video ID. Please check the link."
      };
    }

    try {
      const cdnx = await savetube.getCDN();
      if (!cdnx.status) return cdnx;
      const cdn = cdnx.data;

      const result = await savetube.request(`https://${cdn}${savetube.api.info}`, {
        url: `https://www.youtube.com/watch?v=${id}`
      });
      if (!result.status) return result;
      const decrypted = await savetube.crypto.decrypt(result.data.data);

      return {
        status: true,
        code: 200,
        result: {
          title: decrypted.title || "Unknown",
          id: id,
          thumbnail: decrypted.thumbnail || `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
          duration: decrypted.duration,
          key: decrypted.key,
          available_formats: savetube.formats
        }
      };

    } catch (error) {
      return {
        status: false,
        code: 500,
        error: error.message
      };
    }
  }
};

/**
 * نقطة النهاية الرئيسية - تحميل فيديو/صوت
 * مثال:
 *   GET /api/youtube/download?url=https://youtube.com/watch?v=xxx&format=720
 */
router.get("/download", async (req, res) => {
  const url = req.query.url;
  const format = req.query.format || '720';
  
  if (!url) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى تقديم رابط يوتيوب بعد ?url="
    });
  }

  try {
    console.log(`Download request for: ${url}, format: ${format}`);
    
    const result = await savetube.download(url, format);

    if (!result.status) {
      return res.status(result.code).json({
        status: result.code,
        success: false,
        message: result.error,
        available_formats: result.available_fmt
      });
    }

    res.json({
      status: 200,
      success: true,
      data: {
        video_info: {
          title: result.result.title,
          id: result.result.id,
          duration: result.result.duration,
          thumbnail: result.result.thumbnail
        },
        download_info: {
          type: result.result.type,
          format: result.result.format,
          quality: result.result.quality,
          download_url: result.result.download,
          file_size: "غير معروف",
          direct_link: true
        },
        available_formats: savetube.formats
      }
    });
    
  } catch (err) {
    console.error('YouTube Download API Error:', err.message);
    
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء تحميل الفيديو",
      error: err.message
    });
  }
});

/**
 * نقطة النهاية - معلومات الفيديو مع جميع الجودات
 * مثال:
 *   GET /api/youtube/info?url=https://youtube.com/watch?v=xxx
 */
router.get("/info", async (req, res) => {
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى تقديم رابط يوتيوب بعد ?url="
    });
  }

  try {
    console.log(`Video info request for: ${url}`);
    
    const result = await savetube.getAllQualities(url);

    if (!result.status) {
      return res.status(result.code).json({
        status: result.code,
        success: false,
        message: result.error
      });
    }

    // إنشاء روابط تحميل لجميع الجودات
    const downloadLinks = savetube.formats.map(format => ({
      format: format,
      type: format === 'mp3' ? 'audio' : 'video',
      quality: format === 'mp3' ? '128kbps' : `${format}p`,
      download_url: `${global.t}/api/youtube/download?url=${encodeURIComponent(url)}&format=${format}`
    }));

    res.json({
      status: 200,
      success: true,
      data: {
        video_info: {
          title: result.result.title,
          id: result.result.id,
          duration: result.result.duration,
          thumbnail: result.result.thumbnail,
          youtube_url: `https://www.youtube.com/watch?v=${result.result.id}`
        },
        available_downloads: {
          total_formats: downloadLinks.length,
          formats: downloadLinks
        }
      }
    });
    
  } catch (err) {
    console.error('YouTube Info API Error:', err.message);
    
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء جلب معلومات الفيديو",
      error: err.message
    });
  }
});

/**
 * نقطة النهاية - تحميل صوت فقط
 * مثال:
 *   GET /api/youtube/audio?url=https://youtube.com/watch?v=xxx
 */
router.get("/audio", async (req, res) => {
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى تقديم رابط يوتيوب بعد ?url="
    });
  }

  try {
    console.log(`Audio download request for: ${url}`);
    
    const result = await savetube.download(url, 'mp3');

    if (!result.status) {
      return res.status(result.code).json({
        status: result.code,
        success: false,
        message: result.error
      });
    }

    res.json({
      status: 200,
      success: true,
      data: {
        audio_info: {
          title: result.result.title,
          id: result.result.id,
          duration: result.result.duration,
          thumbnail: result.result.thumbnail
        },
        download_info: {
          type: "audio",
          format: "mp3",
          quality: "128kbps",
          download_url: result.result.download,
          file_name: `${result.result.title}.mp3`,
          direct_link: true
        }
      }
    });
    
  } catch (err) {
    console.error('YouTube Audio API Error:', err.message);
    
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء تحميل الصوت",
      error: err.message
    });
  }
});

/**
 * نقطة النهاية - جميع الجودات المتاحة
 * مثال:
 *   GET /api/youtube/all?url=https://youtube.com/watch?v=xxx
 */
router.get("/all", async (req, res) => {
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "⚠️ يرجى تقديم رابط يوتيوب بعد ?url="
    });
  }

  try {
    console.log(`All formats request for: ${url}`);
    
    const videoInfo = await savetube.getAllQualities(url);
    
    if (!videoInfo.status) {
      return res.status(videoInfo.code).json({
        status: videoInfo.code,
        success: false,
        message: videoInfo.error
      });
    }

    // جلب روابط لجميع الجودات
    const allDownloads = await Promise.all(
      savetube.formats.map(async (format) => {
        try {
          const downloadResult = await savetube.download(url, format);
          return {
            format: format,
            type: format === 'mp3' ? 'audio' : 'video',
            quality: format === 'mp3' ? '128kbps' : `${format}p`,
            status: downloadResult.status ? "available" : "unavailable",
            download_url: downloadResult.status ? downloadResult.result.download : null,
            error: downloadResult.status ? null : downloadResult.error
          };
        } catch (error) {
          return {
            format: format,
            type: format === 'mp3' ? 'audio' : 'video',
            quality: format === 'mp3' ? '128kbps' : `${format}p`,
            status: "unavailable",
            download_url: null,
            error: error.message
          };
        }
      })
    );

    const availableDownloads = allDownloads.filter(item => item.status === "available");
    const unavailableDownloads = allDownloads.filter(item => item.status === "unavailable");

    res.json({
      status: 200,
      success: true,
      data: {
        video_info: {
          title: videoInfo.result.title,
          id: videoInfo.result.id,
          duration: videoInfo.result.duration,
          thumbnail: videoInfo.result.thumbnail
        },
        downloads: {
          total_available: availableDownloads.length,
          total_unavailable: unavailableDownloads.length,
          available_formats: availableDownloads,
          unavailable_formats: unavailableDownloads
        }
      }
    });
    
  } catch (err) {
    console.error('YouTube All Formats API Error:', err.message);
    
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء جلب جميع الجودات",
      error: err.message
    });
  }
});

module.exports = {
  path: "/api/youtube",
  name: "youtube downloader",
  type: "youtube",
  url: `${global.t}/api/youtube/info?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ`,
  logo: "https://cdn-icons-png.flaticon.com/512/1384/1384060.png",
  description: "تحميل فيديوهات يوتيوب بجميع الجودات والصوت",
  router
};