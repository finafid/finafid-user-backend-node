const AWS = require("aws-sdk");
const multer = require("multer");
const sharp = require("sharp");

async function compressAndResizeImage(
  inputImagePath,
  outputFormat,
  width,
  compressionQuality
) {
  try {
    let image = sharp(inputImagePath);
    if (width) {
      image = image.resize({ width });
    }
    if (
      outputFormat === "jpeg" ||
      outputFormat === "jpg" ||
      outputFormat === "JPG"
    ) {
      image = image.jpeg({ quality: compressionQuality * 10 || 80 });
    } else if (outputFormat === "png") {
      image = image.png({ compressionLevel: compressionQuality || 6 });
    } else if (outputFormat === "webp") {
      image = image.webp({ quality: compressionQuality * 10 || 80 });
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


AWS.config.update({
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
  region: process.env.region,
});

const s3 = new AWS.S3();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});


async function generateStringOfImageList(body, key, res) {
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
          message: "Error uploading file",
        });
      }
    });
  } catch {
    console.error(error);
    throw new Error("Failed to upload image to S3");
  }
}
const uploadImageToS3 = async (buffer, fileName) => {
  const params = {
    Bucket: process.env.bucket_name,
    Key: fileName,
    Body: buffer,
   // ACL: "public-read",
    ContentType: "image/jpeg", // Adjust based on your image type
  };

  return s3.upload(params).promise();
};


const getImageLinks = async (files) => {
  try {
    const imageLinks = [];
 
    const fileArray = Array.isArray(files) ? files : [files]; // Ensure files is an array
    console.log(files)
    for (const file of fileArray) {
      const inputImagePath = file.buffer;
      const extension = file.originalname.split(".").pop();
      const width = 800; // Desired width
      const compressionQuality = 5; // Desired compression quality

      const imageBuffer = await compressAndResizeImage(
        inputImagePath,
        extension,
        width,
        compressionQuality
      );

      const newFileName = `${file.originalname
        .split(".")[0]
        .split(" ")
        .join("-")}-${Date.now()}.${extension}`;

      const uploadResult = await uploadImageToS3(imageBuffer, newFileName);
      const imgUrl = "https://d2w5oj0jmt3sl6.cloudfront.net/" + newFileName;

      imageLinks.push(imgUrl);
    }

    return imageLinks;
  } catch (error) {
    console.error("Error in getImageLinks:", error);
    throw error;
  }
};
const uploadFiles = async (files) => {
  try {
    const imageLinks = [];
    const fileArray = Array.isArray(files) ? files : [files]; // Ensure files is an array
    for (const file of fileArray) {
      const inputImagePath = file.buffer;
      const extension = file.originalname.split(".").pop();
      const width = 800; // Desired width
      const compressionQuality = 5; // Desired compression quality

      const imageBuffer = await compressAndResizeImage(
        inputImagePath,
        extension,
        width,
        compressionQuality
      );

      const newFileName = `${file.originalname
        .split(".")[0]
        .split(" ")
        .join("-")}-${Date.now()}.${extension}`;

      await uploadImageToS3(imageBuffer, newFileName);
      const imgUrl = "https://d2w5oj0jmt3sl6.cloudfront.net/" + newFileName;

      imageLinks.push(imgUrl);
    }

    return imageLinks;
  } catch (error) {
    console.error("Error in uploadFiles:", error);
    throw error;
  }
};

module.exports = {
  generateStringOfImageList,
  upload,
  compressAndResizeImage,
  uploadImageToS3,
  getImageLinks,
  uploadFiles,
};
