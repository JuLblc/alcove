const cloudinary = require('cloudinary').v2;
const {CloudinaryStorage} = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET 
})

const storage = new CloudinaryStorage({
  cloudinary,
  folder: 'alcoves', // The name of the folder in cloudinary
  allowedFormats: ['jpg', 'png', 'gif'],
  // params: { resource_type: 'raw' }, => this is in case you want to upload other type of files, not just images
  filename: function (req, res, cb) {
    cb(null, res.originalname); // The file on cloudinary would have the same name as the original file name
  }
});

const uploader = multer({ storage });
module.exports = uploader;