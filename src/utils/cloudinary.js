import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config'
import fs from "fs"

cloudinary.config({ 
        cloud_name: process.env.CLOUD_NAME, 
        api_key: process.env.API_KEY, 
        api_secret: process.env.API_SECRET
    });


const uploadOnCloudinary = async function(localFilePath){
    try {
        if (localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        })
        console.log('file is uploaded', response.url)
        return response

    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the locally saved temporay file
        return null
    }
}

export default uploadOnCloudinary