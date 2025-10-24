
const express = require("express");
const { spawn} = require("child_process");

const router = express.Router();

const userSessions = new Map();
const streamProcesses = new Map();
const streamStartTimes = new Map();
const streamRestartFlags = new Map();

function startStream(sessionId, streamName, sourceUrl, rtmpsUrl) {
  const streamId = `${sessionId}:${streamName}`;
  const ffmpegCmd = [
    "-re",
    "-i", sourceUrl,
    "-c:v", "copy",
    "-c:a", "aac",
    "-f", "flv",
    rtmpsUrl
  ];

  try {
    const process = spawn("ffmpeg", ffmpegCmd);
    streamProcesses.set(streamId, process);
    streamStartTimes.set(streamId, Date.now());
    streamRestartFlags.set(streamId, true);

    process.stderr.on("data", (data) => {
      console.log(`[${streamId}] ffmpeg: ${data.toString()}`);
});

    process.on("exit", () => {
      console.log(`⚠️ البث '${streamName}' توقف`);
      streamProcesses.delete(streamId);
      streamStartTimes.delete(streamId);
      streamRestartFlags.delete(streamId);
      setTimeout(() => {
        console.log(`🔁 إعادة تشغيل '${streamName}'`);
        startStream(sessionId, streamName, sourceUrl, rtmpsUrl);
}, 5000);
});

    console.log(`✅ البث '${streamName}' بدأ`);
} catch (err) {
    console.error(`❌ خطأ أثناء بدء البث: ${err.message}`);
}
}

router.get("/start", (req, res) => {
  const { session, name, rtmps, source} = req.query;
  if (!session ||!name ||!rtmps ||!source) {
    return res.status(400).json({ success: false, message: "بيانات ناقصة"});
}

  const streamId = `${session}:${name}`;
  if (streamProcesses.has(streamId)) {
    return res.json({ success: true, message: "✅ البث جاري بالفعل"});
}

  userSessions.set(session, { streamName: name, rtmps, source});
  startStream(session, name, source, rtmps);
  res.json({ success: true, message: `🚀 تم بدء البث '${name}'`});
});

router.get("/stop", (req, res) => {
  const { session, name} = req.query;
  const streamId = `${session}:${name}`;
  const proc = streamProcesses.get(streamId);
  if (!proc) {
    return res.status(404).json({ success: false, message: "لا يوجد بث بهذا الاسم"});
}
  proc.kill("SIGTERM");
  streamProcesses.delete(streamId);
  streamStartTimes.delete(streamId);
  streamRestartFlags.delete(streamId);
  res.json({ success: true, message: `🛑 تم إيقاف البث '${name}'`});
});

router.get("/duration", (req, res) => {
  const { session, name} = req.query;
  const streamId = `${session}:${name}`;
  const startTime = streamStartTimes.get(streamId);
  if (!startTime) {
    return res.status(404).json({ success: false, message: "لا يوجد بث بهذا الاسم"});
}
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  res.json({ success: true, message: `⏱️ مدة البث: ${minutes} دقيقة و ${seconds} ثانية`});
});

router.get("/list", (req, res) => {
  const { session} = req.query;
  const active = [];
  for (const [key, proc] of streamProcesses.entries()) {
    if (key.startsWith(`${session}:`) && proc) {
      active.push(key.split(":")[1]);
}
}
  if (active.length === 0) {
    return res.json({ success: true, message: "📭 لا يوجد أي بث نشط حاليًا"});
}
  res.json({ success: true, streams: active});
});

module.exports = {
  path: "/api/live",
  name: "ffmpeg stream",
  type: "live",
  url: `${global.t}/api/live/start?session=123&name=test&rtmps=rtmps://...&source=https://...`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "تشغيل بث مباشر بنفس منطق البايثون",
  router
};
