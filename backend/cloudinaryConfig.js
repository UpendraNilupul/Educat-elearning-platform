import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

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

// Storage for Profile Pictures
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'teacher_profiles',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
});

// Storage for Verification Docs (NIC, Resume)
const verificationStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'teacher_verification',
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
    resource_type: 'auto', // Important for PDFs
  },
});

// Storage for Assignment Attachments
const assignmentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'course_assignments',
    resource_type: 'auto',
  },
});

// Storage for Student Submissions
const submissionStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'student_submissions',
    resource_type: 'auto',
  },
});

// Storage for Teacher Advertisements
const advertisementStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'teacher_advertisements',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

export { cloudinary, profileStorage, verificationStorage, assignmentStorage, submissionStorage, advertisementStorage };