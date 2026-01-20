import { useState, useRef, useCallback } from 'react';
import type { Post as PostType } from '../types/post';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';

interface CreatePostProps {
  onPostCreated: (newPost: PostType) => void;
  username: string;
  userInitial: string;
  profilePictureUrl?: string | null;
  program: string;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const CreatePost = ({ onPostCreated, username, userInitial, profilePictureUrl, program}: CreatePostProps) => {
  // Post creation state
  const [isExpanded, setIsExpanded] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedpostType, setSelectedpostType] = useState<string | null>(null);
  const [showpostTypeDropdown, setShowpostTypeDropdown] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Crop state
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const postTypes = [
    { emoji: '📢', label: 'general', display: 'General', color: 'bg-gray-100 text-gray-700' },
    { emoji: '💼', label: 'career', display: 'Career', color: 'bg-blue-100 text-blue-700' },
    { emoji: '📚', label: 'academic', display: 'Academic', color: 'bg-green-100 text-green-700' },
    { emoji: '❓', label: 'question', display: 'Question', color: 'bg-yellow-100 text-yellow-700' },
    { emoji: '🎯', label: 'opportunity', display: 'Opportunity', color: 'bg-orange-100 text-orange-700' },
    { emoji: '🏆', label: 'achievement', display: 'Achievement', color: 'bg-purple-100 text-purple-700' },
  ];

  const MAX_CHARS = 500;

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size must be less than 5MB');
        return;
      }
      
      // Create preview for cropping
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
      setError(null);
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
      const croppedFile = new File([croppedBlob], 'post-image.jpg', {
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

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlepostTypeClick = () => {
    setShowpostTypeDropdown(!showpostTypeDropdown);
  };

  const handlepostTypeSelect = (postType: { emoji: string; label: string }) => {
    setSelectedpostType(postType.label);
    setShowpostTypeDropdown(false);
  };

  const handleRemovepostType = () => {
    setSelectedpostType(null);
  };

  const handleCancel = () => {
    setIsExpanded(false);
    setPostContent('');
    setSelectedImage(null);
    setImagePreview(null);
    setSelectedpostType(null);
    setError(null);
  };

  const handlePost = async () => {
    // Validation
    if (!postContent.trim() && !selectedImage) {
      setError('Please add some content or an image to your post');
      return;
    }

    setIsPosting(true);
    setError(null);

    try {
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        setError('You must be logged in to post');
        setIsPosting(false);
        return;
      }

      // upload image to cloudinary and return the link in imageURL to store in database
      let imageUrl = null;
      if (selectedImage) {
        const formData = new FormData();
        formData.append('image', selectedImage);

        const uploadResponse = await fetch(`${import.meta.env.VITE_API_URL}/upload/image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }

        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.url; // Cloudinary URL!
      }
    
      // Send POST request to backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: postContent,
          image_url: imageUrl, // store the cloudinary url in the PostGreSQL database instead of the raw file for better performance
          post_type: selectedpostType || 'general',
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to create post');
      }
  
      const savedPost = await response.json();

      // Create mock post object (replace with actual response from backend)
      const newPost: PostType = {
        id: savedPost.post.id,
        user_id: savedPost.post.user_id, 
        username: username,
        content: selectedpostType 
          ? `${postContent}`
          : postContent,
        image_url: imageUrl,
        post_type: selectedpostType || 'general',
        created_at: new Date().toISOString(),
        profile_picture_url: profilePictureUrl || null,
        program: program
      };

      // Call parent's callback with new post
      onPostCreated(newPost);

      // Reset form
      handleCancel();
    } catch (err) {
      setError('Failed to create post. Please try again.');
      console.error('Error creating post:', err);
    } finally {
      setIsPosting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const isPostButtonDisabled = (!postContent.trim() && !selectedImage) || isPosting;

return (
  <div className="bg-white rounded-lg shadow mb-4 p-4">
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
              aspect={16 / 9}
              cropShape="rect"
              showGrid={true}
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

    <div className="flex items-start space-x-3">
      {profilePictureUrl ? (
        <img 
          src={profilePictureUrl} 
          alt={username}
          className="w-10 h-10 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center text-white font-semibold shrink-0">
          {userInitial}
        </div>
      )}
      <div className="flex-1">
        {!isExpanded ? (
          <input
            type="text"
            placeholder={`What's on your mind, ${username}?`}
            className="w-full bg-gray-100 rounded-full px-4 cursor-text py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            onClick={handleExpand}
            readOnly
          />
        ) : (
          <div>
            <textarea
              ref={textareaRef}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value.slice(0, MAX_CHARS))}
              onKeyDown={handleKeyDown}
              placeholder={`What's on your mind, ${username}?`}
              className="w-full bg-gray-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows={5}
              maxLength={MAX_CHARS}
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {postContent.length}/{MAX_CHARS}
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Image Preview */}
    {imagePreview && (
      <div className="mt-3 relative">
        <img
          src={imagePreview}
          alt="Preview"
          className="w-full rounded-lg max-h-96 object-cover"
        />
        <button
          onClick={handleRemoveImage}
          className="absolute top-2 right-2 bg-gray-800 bg-opacity-75 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-90 transition"
        >
          ✕
        </button>
      </div>
    )}

    {/* Selected postType Display */}
    {isExpanded && selectedpostType && (
      <div className="mt-3 flex items-center space-x-2">
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${postTypes.find(f => f.label === selectedpostType)?.color}`}>
          <span className="text-lg">{postTypes.find(f => f.label === selectedpostType)?.emoji}</span>
          <span className="text-sm font-medium capitalize">
            {postTypes.find(f => f.label === selectedpostType)?.display || selectedpostType}
          </span>
        </div>
        <button
          onClick={handleRemovepostType}
          className="text-gray-500 hover:text-gray-700 transition"
        >
          ✕
        </button>
      </div>
    )}

    {/* Error Message */}
    {error && (
      <div className="mt-3 text-red-600 text-sm">
        {error}
      </div>
    )}

    <div className="border-t mt-3 pt-3 flex items-center justify-between">
      {isExpanded && (
        <div className="flex items-center space-x-2">
          <button 
            onClick={handlePhotoClick}
            className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth="1.5" 
              stroke="currentColor" 
              className="w-5 h-5 text-gray-600"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" 
              />
            </svg>
            <span className="text-gray-600 font-medium">Photo</span>
          </button>
          
          <div className="relative">
            <button 
              onClick={handlepostTypeClick}
              className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth="1.5" 
                stroke="currentColor" 
                className="w-5 h-5 text-gray-600"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" 
                />
              </svg>
              <span className="text-gray-600 font-medium">Post Type</span>
            </button>

            {/* postType Dropdown */}
            {showpostTypeDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-20 w-90">
                <div className="grid grid-cols-2 gap-2">
                  {postTypes.map((postType) => (
                    <button
                      key={postType.label}
                      onClick={() => handlepostTypeSelect(postType)}
                      className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition text-left"
                    >
                      <span className="text-xl">{postType.emoji}</span>
                      <span className="text-gray-700 capitalize">{postType.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post/Cancel Buttons */}
      {isExpanded && (
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handlePost}
            disabled={isPostButtonDisabled}
            className={`px-6 py-2 rounded-lg font-medium transition cursor-pointer ${
              isPostButtonDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-700 text-white hover:bg-[#F2A900]'
            }`}
          >
            {isPosting ? 'Posting...' : 'Post'}
          </button>
        </div>
      )}
    </div>

    {/* Hidden File Input */}
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      onChange={handleFileChange}
      className="hidden"
    />
  </div>
);
};

export default CreatePost;