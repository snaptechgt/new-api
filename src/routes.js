import express from "express";
import { uploadFile, uploadPDF, uploadVideo } from "./services/s3.js";
import { uploadImage, uploadPDF as uploadPDFMiddleware, uploadVideo as uploadVideoMiddleware } from "./services/common.js";
import fs from "fs";
import { unlink } from "fs/promises";

const routes = express.Router();

routes.get("/", (req, res) => res.json({ status: "Server running." }));

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
