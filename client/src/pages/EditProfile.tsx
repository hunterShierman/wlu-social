// pages/EditProfile.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
import { useAuth } from '../context/AuthContext';  // ← Add this

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const EditProfile = () => {
  const navigate = useNavigate();
  
  // ← Replace the entire useEffect with this
  const { userData, isLoading: authLoading, userSignedIn, refreshUser } = useAuth();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form fields - Initialize with userData
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [program, setProgram] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Crop state
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // get global user information from auth context 
  useEffect(() => {
    // Redirect if not signed in
    if (!authLoading && !userSignedIn) {
      navigate('/login');
      return;
    }

    // Populate form fields when userData is available
    if (userData) {
      setUsername(userData.username);
      setEmail(userData.email || '');
      setBio(userData.bio || '');
      setProgram(userData.program || '');
      setProfilePictureUrl(userData.profile_picture_url || '');
      setImagePreview(userData.profile_picture_url || null);
    }
  }, [userData, userSignedIn, authLoading, navigate]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const onCropComplete = useCallback((_croppedArea: CropArea, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    try {
      // Get cropped image as blob
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      
      // Convert blob to File
      const croppedFile = new File([croppedBlob], 'profile-picture.jpg', {
        type: 'image/jpeg',
      });

      setSelectedImage(croppedFile);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(croppedFile);

      // Close modal
      setShowCropModal(false);
      setImageToCrop(null);
    } catch (error) {
      console.error('Error cropping image:', error);
      setError('Failed to crop image');
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageToCrop(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setProfilePictureUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    const token = localStorage.getItem('accessToken');

    try {
      // Step 1: Upload image to Cloudinary if user selected a new one
      let finalImageUrl = profilePictureUrl;
      
      if (selectedImage) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', selectedImage);

        const uploadResponse = await fetch(`${import.meta.env.VITE_API_URL}/upload/image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }

        const uploadData = await uploadResponse.json();
        finalImageUrl = uploadData.url; // Cloudinary URL
        setIsUploading(false);
      }

      // Step 2: Update profile with Cloudinary URL
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/${username}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email || null,
          bio: bio || null,
          profile_picture_url: finalImageUrl || null,
          program: program || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update profile');
        return;
      }

      setSuccessMessage('Profile updated successfully!');
      
      // ← Refresh user data in AuthContext so navbar updates
      await refreshUser();
      
      // Redirect to profile after 1.5 seconds
      setTimeout(() => {
        navigate(`/profile/${username}`);
      }, 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
      setIsUploading(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/profile/${username}`);
  };

  // ← Use authLoading instead of local isLoading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

return (
  <div className="min-h-screen bg-gradient-to-br from-[#EBE0F5] via-white to-[#924DA7]/20">
    {/* Crop Modal */}
    {showCropModal && imageToCrop && (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Crop Your Photo</h2>
          
          {/* Cropper Container */}
          <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden mb-4">
            <Cropper
              image={imageToCrop}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          {/* Zoom Slider */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Zoom
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleCropConfirm}
              className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition cursor-pointer"
            >
              Crop & Continue
            </button>
            <button
              onClick={handleCropCancel}
              className="px-8 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Main Content */}
    <div className="pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Profile</h1>
          <p className="text-gray-600">Update your profile information</p>
        </div>

        {/* Success Message - Full screen when successful */}
        {successMessage ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Updated!</h2>
            <p className="text-gray-600">{successMessage}</p>
          </div>
        ) : (
          <>
            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
              {/* Username (Read-only) */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
              </div>

              {/* Email */}
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-text"
                  required
                />
              </div>

              {/* Program */}
              <div className="mb-6">
                <label htmlFor="program" className="block text-sm font-semibold text-gray-700 mb-2">
                  Program
                </label>
                <input
                  type="text"
                  id="program"
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  placeholder="e.g., Computer Science, Business Administration"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-text"
                />
              </div>

              {/* Bio */}
              <div className="mb-6">
                <label htmlFor="bio" className="block text-sm font-semibold text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none cursor-text"
                />
                <p className="text-xs text-gray-500 mt-1">{bio.length}/500 characters</p>
              </div>

              {/* Profile Picture Upload */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Profile Picture
                </label>
                
                {/* Preview */}
                <div className="flex items-center space-x-4 mb-3">
                  <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-4 border-purple-200 flex items-center justify-center">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-gray-400 text-3xl">{username[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button
                      type="button"
                      onClick={handleUploadClick}
                      className="bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#F2A900] transition cursor-pointer"
                    >
                      {isUploading ? 'Uploading...' : 'Upload Photo'}
                    </button>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition cursor-pointer"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Max size: 5MB. Supported formats: JPG, PNG, GIF, WebP
                </p>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="flex-1 bg-purple-700 text-white py-3 rounded-lg font-semibold hover:bg-[#F2A900] transition disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isUploading ? 'Uploading Image...' : isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving || isUploading}
                  className="px-8 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  </div>
);
};

export default EditProfile;