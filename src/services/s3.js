import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const bucketName = process.env.AWSS3_BUCKET;
const region = process.env.AWSREGION;
const accessKeyId = process.env.AWSACCESS_KEY_ID;
const secretAccessKey = process.env.AWSSECRET_ACCESS_KEY;

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

// UPLOAD FILE TO S3
async function uploadFile(file) {
  const fileStream = fs.createReadStream(file.path);
  const fileName = file.filename;
  const key = "img/" + fileName;

  const s3Params = {
    Bucket: bucketName,
    Body: fileStream,
    Key: key,
    ACL: 'public-read', // Make images publicly accessible
  };

  console.log(s3Params);

  try {
    await s3Client.send(new PutObjectCommand(s3Params));
    return {
      url: "https://" + bucketName + ".s3.amazonaws.com/" + key,
    };
  } catch (err) {
    console.log(err);
    throw err;
  }
}

// UPLOAD PDF TO S3
async function uploadPDF(file) {
  const fileStream = fs.createReadStream(file.path);
  const fileName = file.filename;
  const key = "pdfs/" + fileName;

  const s3Params = {
    Bucket: bucketName,
    Body: fileStream,
    Key: key,
    ContentType: 'application/pdf',
    ACL: 'public-read',
  };

  console.log(s3Params);

  try {
    await s3Client.send(new PutObjectCommand(s3Params));
    return {
      url: "https://" + bucketName + ".s3.amazonaws.com/" + key,
      fileName: file.originalname,
    };
  } catch (err) {
    console.log(err);
    throw err;
  }
}

// UPLOAD VIDEO TO S3
async function uploadVideo(file) {
  const fileStream = fs.createReadStream(file.path);
  const fileName = file.filename;
  const key = "videos/" + fileName;

  const contentType = file.mimetype || 'video/mp4';

  const s3Params = {
    Bucket: bucketName,
    Body: fileStream,
    Key: key,
    ContentType: contentType,
    ACL: 'public-read',
  };

  console.log(s3Params);

  try {
    await s3Client.send(new PutObjectCommand(s3Params));
    return {
      url: "https://" + bucketName + ".s3.amazonaws.com/" + key,
      fileName: file.originalname,
    };
  } catch (err) {
    console.log(err);
    throw err;
  }
}

// export { uploadFile, uploadPDF, uploadVideo };

// STREAM AN OBJECT FROM S3 (used to serve assets with CORS so the browser
// can draw them on a canvas without tainting it). The public S3 bucket has no
// CORS configuration, so serving through this backend (which has CORS enabled
// for the app origin) makes cross-origin canvas reads work.
async function streamObject({ key }) {
  const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
  const { Body, ContentType, ContentLength } = await s3Client.send(command);
  return { stream: Body, contentType: ContentType || 'application/octet-stream', contentLength: ContentLength };
}

export { uploadFile, uploadPDF, uploadVideo, streamObject };
