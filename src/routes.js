import express from 'express';
const { uploadFile } = require("./services/s3");
const upload = require("./services/common");
const fs = require("fs");
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);
const routes = express.Router()

routes.get('/', (req, res) => res.json({ status: "Server running." }));

routes.post("/single", upload.single("image"), async (req, res) => {
    // console.log(req.file);
    if (req.file !== undefined) {
        // uploading to AWS S3
        var response = uploadFile(req.file, res);
        console.log(response);
        // Deleting from local if uploaded in S3 bucket
        unlinkFile(req.file.path);
    } else {
        res.send("error, no file submitted.");
    }
});

module.exports = routes;
