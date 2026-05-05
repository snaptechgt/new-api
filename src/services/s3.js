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
function uploadFile(file, res) {
  const fileStream = fs.createReadStream(file.path);
  const fileName = file.filename;
  const key = "img/" + fileName;

  const s3Params = {
    Bucket: bucketName,
    Body: fileStream,
    ACL: "public-read",
    Key: key,
  };

  console.log(s3Params);

  return s3Client.send(new PutObjectCommand(s3Params), (err, data) => {
    if (err) {
      console.log(err);
      return res.end();
    }
    const returnData = {
      url: "https://" + bucketName + ".s3.amazonaws.com/" + key,
    };
    console.log(returnData);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(JSON.stringify(returnData));
    res.end();
  });
}

export { uploadFile };
