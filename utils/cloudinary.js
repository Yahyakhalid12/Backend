import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (path)=>{
    try {
        if(!localFilePath) throw new Error("File path is required")
            const result = await cloudinary.uploader.upload(localFilePath, {
                resource_type: "auto"
            })
        console.log("File is uploaded on cloudinary",result.url)
        return result
    } catch (error) {
        fs.unlinkSync(localFilePath) // delete file if upload failed
        return null
    }
}

// cloudinary.v2.uploader
// .upload("dog.mp4", {
//   resource_type: "video", 
//   public_id: "my_dog",
//   overwrite: true, 
//   notification_url: "https://mysite.example.com/notify_endpoint"})
// .then(result=>console.log(result));