import express from "express";
import { uploadFile } from "./services/s3.js";
import upload from "./services/common.js";
import fs from "fs";
import { unlink } from "fs/promises";

const routes = express.Router();

routes.get("/", (req, res) => res.json({ status: "Server running." }));

routes.post("/single", upload.single("image"), async (req, res) => {
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

export default routes;
