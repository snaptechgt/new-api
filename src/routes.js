import express from "express";
import { uploadFile, uploadPDF, uploadVideo } from "./services/s3.js";
import { streamObject } from "./services/s3.js";
import { uploadImage, uploadPDF as uploadPDFMiddleware, uploadVideo as uploadVideoMiddleware } from "./services/common.js";
import fs from "fs";
import { unlink } from "fs/promises";
import { handler as emailHandler } from "./services/email.js";

const routes = express.Router();

// Email sending endpoint (server-side AgentMail)
// POST /v2/send/mail
// Body: { from, to, subject, html }
routes.post("/v2/send/mail", async (req, res) => {
  try {
    const result = await emailHandler(req, res);

    if (!result) {
      return res.status(500).json({ error: 'Error: emailHandler returned null' });
    }

    if (result.error) {
      const status = result.status || 500;
      console.error('emailHandler error:', result.error);
      return res.status(status).json({ error: result.error });
    }

    console.log('emailHandler result:', result);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in /v2/send/mail route:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET asset from S3 with CORS — streams the object back so both <img> display
// and canvas export work from a cross-origin S3 bucket that has no CORS config.
// Auth is skipped for GET on this route so the app can load it directly.
routes.get("/asset/:type/:key(*)", async (req, res) => {
  try {
    const { type, key } = req.params;
    const allowed = ["img", "videos", "pdfs"];
    if (!allowed.includes(type)) return res.status(400).json({ error: "Invalid asset type" });
    const s3Key = type + "/" + key;
    const { stream, contentType, contentLength } = await streamObject({ key: s3Key });
    res.setHeader("Content-Type", contentType);
    if (contentLength) res.setHeader("Content-Length", contentLength);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=86400");
    stream.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: "Asset not found" });
  }
});

routes.post("/single", uploadImage.single("image"), async (req, res) => {
  if (req.file !== undefined) {
    try {
      // uploading to AWS S3
      const returnData = await uploadFile(req.file);
      console.log(returnData);
      
      // Deleting from local if uploaded in S3 bucket
      await unlink(req.file.path);
      
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.json(returnData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Upload failed" });
    }
  } else {
    res.status(400).send("error, no file submitted.");
  }
});

// PDF Upload endpoint
routes.post("/pdf", uploadPDFMiddleware.single("pdf"), async (req, res) => {
  if (req.file !== undefined) {
    try {
      // uploading to AWS S3
      const returnData = await uploadPDF(req.file);
      console.log(returnData);
      
      // Deleting from local if uploaded in S3 bucket
      await unlink(req.file.path);
      
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.json(returnData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "PDF upload failed" });
    }
  } else {
    res.status(400).send("error, no PDF file submitted.");
  }
});

// Video Upload endpoint
routes.post("/video", uploadVideoMiddleware.single("video"), async (req, res) => {
  if (req.file !== undefined) {
    try {
      const returnData = await uploadVideo(req.file);
      console.log(returnData);
      
      await unlink(req.file.path);
      
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.json(returnData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Video upload failed" });
    }
  } else {
    res.status(400).send("error, no video file submitted.");
  }
});

export default routes;
