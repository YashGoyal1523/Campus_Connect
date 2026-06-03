import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

// Configure Cloudinary with credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// multer handles multipart/form-data (file uploads)
// memoryStorage() keeps the file in memory as a Buffer instead of saving to disk
// We then pass the buffer directly to Cloudinary
export const upload = multer({ storage: multer.memoryStorage() });

// Uploads a file buffer to Cloudinary and returns the result
// buffer = raw file data in memory (from multer)
// mimetype = e.g. "image/jpeg", "video/mp4" — used to determine resource type
export const uploadToCloudinary = async (buffer, mimetype) => {
  const resourceType = mimetype.startsWith("video") ? "video" : "image";

  // Cloudinary requires base64 encoded data URI for direct upload
  const b64 = buffer.toString("base64");
  const dataUri = `data:${mimetype};base64,${b64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "campusconnect", // organizes uploads in Cloudinary dashboard
    resource_type: resourceType,
  });

  return result; // result.secure_url is the public HTTPS URL of the uploaded file
};

export default cloudinary;
