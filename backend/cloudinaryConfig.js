import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import path from 'path';

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
  params: async (req, file) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isPdf = file.mimetype === 'application/pdf' || ext === '.pdf';
    const isZip = file.mimetype === 'application/zip' || ext === '.zip';
    const resource_type = (isPdf || isZip) ? 'raw' : 'auto';
    
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    const uniqueId = `${cleanName}-${Date.now()}`;
    
    let public_id = uniqueId;
    if (isPdf) {
      public_id = `${uniqueId}.pdftemp`;
    } else if (isZip) {
      public_id = `${uniqueId}.ziptemp`;
    } else if (resource_type === 'raw') {
      public_id = `${uniqueId}${ext}`;
    }
    
    return {
      folder: 'teacher_verification',
      allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
      resource_type: resource_type,
      public_id: public_id,
    };
  },
});

// Storage for Assignment Attachments
const assignmentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isPdf = file.mimetype === 'application/pdf' || ext === '.pdf';
    const isZip = file.mimetype === 'application/zip' || ext === '.zip';
    const resource_type = (isPdf || isZip) ? 'raw' : 'auto';
    
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    const uniqueId = `${cleanName}-${Date.now()}`;
    
    let public_id = uniqueId;
    if (isPdf) {
      public_id = `${uniqueId}.pdftemp`;
    } else if (isZip) {
      public_id = `${uniqueId}.ziptemp`;
    } else if (resource_type === 'raw') {
      public_id = `${uniqueId}${ext}`;
    }
    
    return {
      folder: 'course_assignments',
      resource_type: resource_type,
      public_id: public_id,
    };
  },
});

// Storage for Student Submissions
const submissionStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isPdf = file.mimetype === 'application/pdf' || ext === '.pdf';
    const isZip = file.mimetype === 'application/zip' || ext === '.zip';
    const resource_type = (isPdf || isZip) ? 'raw' : 'auto';
    
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    const uniqueId = `${cleanName}-${Date.now()}`;
    
    let public_id = uniqueId;
    if (isPdf) {
      public_id = `${uniqueId}.pdftemp`;
    } else if (isZip) {
      public_id = `${uniqueId}.ziptemp`;
    } else if (resource_type === 'raw') {
      public_id = `${uniqueId}${ext}`;
    }
    
    return {
      folder: 'student_submissions',
      resource_type: resource_type,
      public_id: public_id,
    };
  },
});

// Storage for Payment Slips
const slipStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'payment_slips',
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
    resource_type: 'auto',
  },
});

// Storage for Course Resources (PDFs, Videos, etc)
const resourceStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'course_resources',
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

export { cloudinary, profileStorage, verificationStorage, assignmentStorage, submissionStorage, slipStorage, resourceStorage, advertisementStorage };
