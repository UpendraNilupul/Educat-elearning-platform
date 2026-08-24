import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Camera, Save, User, Mail, Phone, Calendar,
  Users, GraduationCap, BookOpen, Layers, MapPin, Shield,
  Loader2
} from 'lucide-react';

// Configuration for image validation
const MAX_FILE_SIZE = 5000000; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// 1. Updated validation rules using Zod based on SQL tables
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(5, "Address is required"),
  dob: z.string()
    .min(1, "Date of birth is required")
    .refine((val) => {
      if (!val) return false;
      const d = new Date(val);
      const limitDate = new Date('2016-02-01');
      const minDate = new Date('1900-01-01');
      return d < limitDate && d >= minDate && val.split('-')[0].length === 4;
    }, "Date of birth must be between 1900-01-01 and 2016-02-01"),
  gender: z.string().min(1, "Please select a gender"),
  schoolName: z.string().min(2, "School name is required"),
  gradeLevel: z.string().min(1, "Grade level is required"),
  guardianName: z.string().min(2, "Guardian name is required"),
  guardianPhone: z.string().min(10, "Guardian phone must be at least 10 digits"),

  // New: Optional picture validation
  picture: z.any()
    .optional()
    .refine(
      (files) => !files || files.length === 0 || files[0]?.size <= MAX_FILE_SIZE,
      "Max file size is 5MB."
    )
    .refine(
      (files) => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files[0]?.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
});

const StudentProfileEdit = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 2. Initialize React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      address: '',
      dob: '',
      gender: '',
      schoolName: '',
      gradeLevel: '',
      guardianName: '',
      guardianPhone: '',
    },
  });

  // 3. Fetch data on mount
  useEffect(() => {
    const fetchProfileData = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:3000/api/student/profile/${userId}`, {
          credentials: 'include'
        });
        const result = await response.json();

        if (result.success && result.data) {
          const dbData = result.data;
          // Map snake_case from DB to camelCase for React Hook Form
          const formData = {
            name: dbData.name || '',
            email: dbData.email || '',
            phoneNumber: dbData.phone_number || '',
            address: dbData.address || '',
            dob: dbData.dob || '',
            gender: dbData.gender || '',
            schoolName: dbData.school_name || '',
            gradeLevel: dbData.grade_level || '',
            guardianName: dbData.guardian_name || '',
            guardianPhone: dbData.guardian_phone || '',
          };
          
          reset(formData);

          // If picture exists, set preview (Cloudinary or local fallback)
          if (dbData.picture) {
            const pic = dbData.picture;
            if (pic.startsWith('http')) {
              setPreviewImage(pic);
            } else {
              setPreviewImage(`http://localhost:3000/uploads/${pic}`);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [reset]);

  // 4. Submit handler
  const onSubmit = async (data) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('Error: User session not found. Please log in again.');
      return;
    }

    const formData = new FormData();
    // Append standard fields
    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('phone_number', data.phoneNumber);
    formData.append('address', data.address);
    formData.append('dob', data.dob);
    formData.append('gender', data.gender);
    formData.append('school_name', data.schoolName);
    formData.append('grade_level', data.gradeLevel);
    formData.append('guardian_name', data.guardianName);
    formData.append('guardian_phone', data.guardianPhone);

    // Append removePhoto flag if true
    if (removePhoto) {
      formData.append('removePhoto', 'true');
    }

    // Append file if present
    if (data.picture && data.picture[0]) {
      formData.append('picture', data.picture[0]);
    }

    setIsUploading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/student/profile/${userId}`, {
        method: 'PUT',
        body: formData,
        credentials: 'include'
      });
      const result = await response.json();

      if (result.success) {
        alert('Profile updated successfully!');
        if (onClose) onClose();
      } else {
        alert('Failed to update: ' + (result.error || result.message));
      }
    } catch (error) {
      console.error('Update Error:', error);
      alert('Network Error: Could not reach the server.');
    } finally {
      setIsUploading(false);
    }
  };

  // 4. Helper function for styling inputs
  const getInputClassName = (error) =>
    `w-full border rounded-lg p-2 focus:outline-none focus:ring-2 transition-colors bg-white/60 backdrop-blur-sm ${error
      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
      : "border-gray-300 focus:ring-purple-500 focus:border-purple-500"
    }`;

  const labelClassName = "block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
        <p className="text-gray-500 mt-1">Manage your personal and academic information.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Profile Photo Section */}
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-6">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center border-4 border-white shadow-sm overflow-hidden text-purple-400 relative">
              {(previewImage && !removePhoto) ? (
                <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10" />
              )}
              
              {isUploading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-20">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer pointer-events-none">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">Profile Photo</h3>
            <p className="text-sm text-gray-500 mb-3">Upload a professional looking portrait (Max 5MB).</p>
            <div className="flex items-center gap-3">
              <div className="relative inline-block">
                <input
                  type="file"
                  {...register("picture", {
                    onChange: (e) => {
                      if (e.target.files && e.target.files[0]) {
                        setRemovePhoto(false);
                        const reader = new FileReader();
                        reader.onload = (event) => setPreviewImage(event.target.result);
                        reader.readAsDataURL(e.target.files[0]);
                      }
                    }
                  })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  accept="image/png, image/jpeg, image/webp"
                />
                <button
                  type="button"
                  className={`px-5 py-2.5 font-semibold text-sm rounded-lg transition-colors border ${errors.picture
                    ? "bg-red-50 text-red-600 border-red-200"
                    : "bg-purple-50 text-brand-purple hover:bg-purple-100 border-purple-200"
                    }`}
                >
                  Choose File
                </button>
              </div>

              {previewImage && !removePhoto && (
                <button
                  type="button"
                  onClick={() => setRemovePhoto(true)}
                  className="px-5 py-2.5 font-semibold text-sm rounded-lg transition-colors border border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
                >
                  Remove
                </button>
              )}
            </div>
            {errors.picture && (
              <p className="text-red-500 text-xs mt-2 font-medium">{errors.picture.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Card 1: Personal Information (Matches `users` table) */}
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-2 bg-purple-50 rounded-xl">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
            </div>

            <div className="space-y-5">
              <div>
                <label className={labelClassName}>
                  <User className="w-4 h-4 text-gray-400" /> Full Name
                </label>
                <input
                  type="text"
                  {...register("name")}
                  className={getInputClassName(errors.name)}
                  placeholder="John Doe"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className={labelClassName}>
                  <Mail className="w-4 h-4 text-gray-400" /> Email Address
                </label>
                <input
                  type="email"
                  {...register("email")}
                  className={getInputClassName(errors.email)}
                  placeholder="john.doe@example.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClassName}>
                    <Phone className="w-4 h-4 text-gray-400" /> Phone Number
                  </label>
                  <input
                    type="tel"
                    {...register("phoneNumber")}
                    className={getInputClassName(errors.phoneNumber)}
                    placeholder="0777777777"
                  />
                  {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber.message}</p>}
                </div>
                <div>
                  <label className={labelClassName}>
                    <MapPin className="w-4 h-4 text-gray-400" /> Address
                  </label>
                  <input
                    type="text"
                    {...register("address")}
                    className={getInputClassName(errors.address)}
                    placeholder="City, Region"
                  />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClassName}>
                    <Calendar className="w-4 h-4 text-gray-400" /> Date of Birth
                  </label>
                  <input
                    type="date"
                    {...register("dob")}
                    min="1900-01-01"
                    max="2016-01-31"
                    className={getInputClassName(errors.dob)}
                  />
                  {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob.message}</p>}
                </div>
                <div>
                  <label className={labelClassName}>
                    <Users className="w-4 h-4 text-gray-400" /> Gender
                  </label>
                  <select
                    {...register("gender")}
                    className={getInputClassName(errors.gender)}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Academic & Guardian Information (Matches `students` table) */}
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-2 bg-blue-50 rounded-xl">
                <GraduationCap className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Academic & Guardian Info</h3>
            </div>

            <div className="space-y-5">
              <div>
                <label className={labelClassName}>
                  <BookOpen className="w-4 h-4 text-gray-400" /> School/University
                </label>
                <input
                  type="text"
                  {...register("schoolName")}
                  className={getInputClassName(errors.schoolName)}
                  placeholder="e.g. Springfield High School"
                />
                {errors.schoolName && <p className="text-red-500 text-xs mt-1">{errors.schoolName.message}</p>}
              </div>

              <div>
                <label className={labelClassName}>
                  <Layers className="w-4 h-4 text-gray-400" /> Grade/Level
                </label>
                <select
                  {...register("gradeLevel")}
                  className={getInputClassName(errors.gradeLevel)}
                >
                  <option value="">Select Grade</option>
                  {[...Array(13)].map((_, i) => (
                    <option key={i + 1} value={`Grade ${i + 1}`}>Grade {i + 1}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                {errors.gradeLevel && <p className="text-red-500 text-xs mt-1">{errors.gradeLevel.message}</p>}
              </div>

              {/* Guardian Fields */}
              <div className="pt-2 border-t border-gray-100 mt-2">
                <h4 className="text-sm font-bold text-gray-900 mb-4">Guardian Contact</h4>
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className={labelClassName}>
                      <Shield className="w-4 h-4 text-gray-400" /> Guardian Name
                    </label>
                    <input
                      type="text"
                      {...register("guardianName")}
                      className={getInputClassName(errors.guardianName)}
                      placeholder="e.g. Jane Doe"
                    />
                    {errors.guardianName && <p className="text-red-500 text-xs mt-1">{errors.guardianName.message}</p>}
                  </div>

                  <div>
                    <label className={labelClassName}>
                      <Phone className="w-4 h-4 text-gray-400" /> Guardian Phone
                    </label>
                    <input
                      type="tel"
                      {...register("guardianPhone")}
                      className={getInputClassName(errors.guardianPhone)}
                      placeholder="0777777777"
                    />
                    {errors.guardianPhone && <p className="text-red-500 text-xs mt-1">{errors.guardianPhone.message}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bottom */}
        <div className="flex justify-end pt-2 pb-6">
          <button
            type="submit"
            disabled={isUploading}
            className={`flex items-center gap-2 px-8 py-3.5 font-bold rounded-xl transition-all shadow-lg active:scale-95 ${
              isUploading 
                ? "bg-gray-400 cursor-not-allowed shadow-none" 
                : "bg-gray-900 text-white hover:bg-brand-purple hover:shadow-brand-purple/30"
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default StudentProfileEdit;