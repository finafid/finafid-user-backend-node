const AWS = require('aws-sdk');
const multer = require('multer')
const sharp = require("sharp");

async function compressAndResizeImage(inputImagePath, outputFormat,width, compressionQuality) {
    try {
        let image = sharp(inputImagePath);    
        if (width) {
            image = image.resize({ width });
        }     
        if (outputFormat === "jpeg" || outputFormat === "jpg" || outputFormat === "JPG") {
            image = image.jpeg({ quality: compressionQuality*10 || 80 });
        } else if (outputFormat === "png") {
            image = image.png({ compressionLevel: compressionQuality || 6 });
        } else if (outputFormat === "webp") {
            image = image.webp({ quality: compressionQuality*10 || 80 });
        } else {
            throw new Error("Unsupported output format");
        }   
        const imageBuffer = await image.toBuffer();
        return imageBuffer;
    } catch (error) {
        console.error("Error compressing and resizing image:", error);
        throw error;
    }
}

console.log(process.env.bucket_name,"access key")
AWS.config.update({
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
    region: process.env.region
})

const s3 = new AWS.S3()
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
});

async function genarateStringOfImageList(body, key, res) {
    try {
        const params = {
            Bucket: process.env.bucket_name,
            Key: key,
            Body: body,

        };

        s3.upload(params, (err, data) => {
            if (err) {
                console.log(err);
                console.log(data);
                return res.status(500).json({
                    success: false,
                    message: "Error uploading file"
                })
            }

            res.status(200).json({
                success: true,
                message: "File uploaded sucessfully"
            })
        })
    } catch {
        console.error(error);
        throw new Error('Failed to upload image to S3');
    }
}

module.exports = {
    genarateStringOfImageList,
    upload,
    compressAndResizeImage
}