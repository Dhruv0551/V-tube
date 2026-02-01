import { v2 as cloudinary } from 'cloudinary'
import { log } from 'console'
import fs from 'fs'

cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async(localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload logic
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // if file has been uploaded
        console.log('File uploaded successfully', response.url);
        return response.url
    } catch (err) {
        fs.unlinkSync(localFilePath) //remove the local temp file if the upload operation fails
    }
}


export default uploadOnCloudinary