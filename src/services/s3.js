import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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

export { uploadFile, uploadPDF, uploadVideo };
