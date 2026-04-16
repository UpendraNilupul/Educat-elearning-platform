import { v2 as cloudinary } from 'cloudinary';
import { createRequire } from 'module';
import dotenv from 'dotenv';

// Bring back 'require' to load the package
const require = createRequire(import.meta.url);
const multerCloudinary = require('multer-storage-cloudinary');

// 🌟 THE BULLETPROOF FIX PT 1: 
// Safely extract the Storage object regardless of the NPM version or ESM quirks
const CloudinaryStorage = multerCloudinary.CloudinaryStorage || multerCloudinary.default?.CloudinaryStorage || multerCloudinary.default || multerCloudinary;

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("❌ CLOUDINARY CONFIGURATION MISSING! Uploads will fail.");
  console.log("Check your .env file for CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
} else {
  console.log("✅ Cloudinary configured successfully.");
}

// 🌟 THE BULLETPROOF FIX PT 2: 
// A helper function that works whether the library wants `new` (v4) or just a function call (v2)
const createStorage = (options) => {
  try {
    return new CloudinaryStorage(options);
  } catch (err) {
    return CloudinaryStorage(options);
  }
};

// Storage for Profile Pictures
const profileStorage = createStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'teacher_profiles',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
});

// Storage for Verification Docs (NIC, Resume)
const verificationStorage = createStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'teacher_verification',
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
    resource_type: 'auto', // Important for PDFs
  },
});

// Storage for Assignment Attachments
const assignmentStorage = createStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'course_assignments',
    resource_type: 'auto',
  },
});

// Storage for Student Submissions
const submissionStorage = createStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'student_submissions',
    resource_type: 'auto',
  },
});

export { cloudinary, profileStorage, verificationStorage, assignmentStorage, submissionStorage };