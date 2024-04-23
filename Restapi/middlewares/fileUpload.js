const AWS = require('aws-sdk');


const s3 = new AWS.S3({
    accessKeyId: 'YOUR_ACCESS_KEY_ID',
    secretAccessKey: 'YOUR_SECRET_ACCESS_KEY'
});

async function uploadImageToCDN(imageFile) {
    const params = {
        Bucket: 'your-bucket-name',
        Key: 'unique-key-for-image.jpg', 
        Body: imageFile.buffer, 
        ContentType: imageFile.mimetype 
    };

    try {
        const data = await s3.upload(params).promise();
        return data.Location;
    } catch (error) {
        console.error('Error uploading image to CDN:', error);
        throw error; 
}}
