import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "test",
    api_key: process.env.CLOUDINARY_API_KEY || "test",   // ✅ lowercase
    api_secret: process.env.CLOUDINARY_API_SECRET || "test" // ✅ lowercase
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) throw new Error("File path is required");
        
        if (!fs.existsSync(localFilePath)) {
            throw new Error("File does not exist");
        }
        
        const result = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        console.log("✅ File uploaded on Cloudinary:", result.secure_url);
        
        // delete local file after successful upload
        fs.unlinkSync(localFilePath);

        return result.secure_url; // return only the public URL
    } catch (error) {
        console.error("❌ Cloudinary upload error:", error.message);
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath); // delete file if upload failed
        }
        return null;
    }
};

export { uploadOnCloudinary };
