const cloudinary = require("cloudinary").v2;

// Configure with your Cloudinary credentials
cloudinary.config({
  cloud_name: "doss8vias", // from Cloudinary dashboard
  api_key: "521887823533577", // from Cloudinary dashboard
  api_secret: "ThipVAY_Mq-eqb-70gjVlAZZFXE", // from Cloudinary dashboard
});

module.exports = cloudinary;
