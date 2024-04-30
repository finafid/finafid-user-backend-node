const AWS = require('aws-sdk');
const multer =require('multer')

AWS.config.update({
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
    region: process.env.region
})
const s3=new AWS.S3();
const bucketParams = {
    Bucket: 'image_upload_for_finafid_user'
};
s3.createBucket(bucketParams, (err, data) => {
    if (err) {
        console.error('Error creating bucket:', err);
    } else {
        console.log('Bucket created successfully:', data.Location);
    }
});
const uploadParams = {
    Bucket: image_upload_for_finafid_user,
    Key: 'example.jpg',
    Body: '/path/to/local/file.jpg'
};
const storage= multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') 
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname) 
    }
})

