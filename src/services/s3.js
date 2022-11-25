require("dotenv").config();

const S3 = require("aws-sdk/clients/s3");
const fs = require("fs");

const bucketName = process.env.AWSS3_BUCKET;
const region = process.env.AWSREGION;
const accessKeyId = process.env.AWSACCESS_KEY_ID;
const secretAccessKey = process.env.AWSSECRET_ACCESS_KEY;

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

// UPLOAD FILE TO S3
function uploadFile(file, res) {
  const fileStream = fs.createReadStream(file.path);
  const fileName = file.filename;
  var key = "img/" + fileName;

  const s3Params = {
    Bucket: bucketName,
    Body: fileStream,
    ACL: 'public-read',
    Key: key,
  };

  console.log(s3Params);

  return s3.putObject(s3Params, (err, data) => {
    if(err){
      console.log(err);
      return res.end();
    }
    var returnData = {
      url: "https://" + bucketName + ".s3.amazonaws.com/" + key
    };
    console.log(returnData);
    res.setHeader('Content-Type', 'application/json');
    res.json(JSON.stringify(returnData));
    res.end();
  });
}

module.exports = { uploadFile };
