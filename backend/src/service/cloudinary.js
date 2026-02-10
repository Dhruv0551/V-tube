import { v2 as cloudinary } from "cloudinary";
import { log } from "console";
import fs from "fs";

const cloudinaryConfig = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

const uploadOnCloudinary = async (localFilePath) => {
  cloudinaryConfig();
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "image",
    });

    fs.unlinkSync(localFilePath);

    return response;
  } catch (err) {
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    console.error("Cloudinary error:", err);
    return null;
  }
};

export default uploadOnCloudinary;
