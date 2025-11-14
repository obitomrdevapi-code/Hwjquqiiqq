import express from "express";
import axios from "axios";
import CryptoJS from "crypto-js";

const router = express.Router();
const encryptionKey = "website:teraboxvideodownloader.pro";

// ======== Helper Class ========
class TeraboxDownloader {
  async download(url) {
    if (!url) throw new Error("Link missing.");

    const encrypted = CryptoJS.AES.encrypt(url, encryptionKey).toString();
    const res = await axios.post(
      "https://teraboxvideodownloader.pro/api/video-downloader",
      { link: encrypted },
      { headers: { "Content-Type": "application/json" } }
    );

    return res.data;
  }
}

// ======== Router ========
router.get("/terabox", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ success: false, error: "url is required" });

  const downloader = new TeraboxDownloader();
  try {
    const data = await downloader.download(url);
    return res.json({ success: true, url, data });
  } catch (error) {
    console.error("[Terabox Router] Error:", error.message || error);
    return res.status(500).json({ success: false, error: error.message || "Download failed" });
  }
});

module.exports = {
  path: "/api/download",
  name: "terabox download",
  type: "download",
  url: `${global.t}/api/download/terabox?url=https://1024terabox.com/s/1REdTPbZqbw9RHZImo8QXOg`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "تحميل من terabox",
  router
};