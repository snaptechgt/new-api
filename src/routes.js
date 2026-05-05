import express from "express";
import { uploadFile } from "./services/s3.js";
import upload from "./services/common.js";
import fs from "fs";
import { unlink } from "fs/promises";

const routes = express.Router();

routes.get("/", (req, res) => res.json({ status: "Server running." }));

routes.post("/single", upload.single("image"), async (req, res) => {
  if (req.file !== undefined) {
    // uploading to AWS S3
    const response = uploadFile(req.file, res);
    console.log(response);
    // Deleting from local if uploaded in S3 bucket
    await unlink(req.file.path);
  } else {
    res.send("error, no file submitted.");
  }
});

export default routes;
