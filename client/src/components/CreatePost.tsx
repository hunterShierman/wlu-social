import { useState, useRef } from 'react';
import type { Post as PostType } from '../types/post';

interface CreatePostProps {
  onPostCreated: (newPost: PostType) => void;
  username: string;
  userInitial: string;
  profilePictureUrl?: string | null;
}

const CreatePost = ({ onPostCreated, username, userInitial, profilePictureUrl }: CreatePostProps) => {
  // Post creation state
  const [isExpanded, setIsExpanded] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedpostType, setSelectedpostType] = useState<string | null>(null);
  const [showpostTypeDropdown, setShowpostTypeDropdown] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const postTypes = [
    { emoji: '📢', label: 'general', display: 'General', color: 'bg-gray-100 text-gray-700' },
    { emoji: '💼', label: 'career', display: 'Career', color: 'bg-blue-100 text-blue-700' },
    { emoji: '🎉', label: 'club_event', display: 'Club/Event', color: 'bg-pink-100 text-pink-700' },
    { emoji: '📚', label: 'academic', display: 'Academic', color: 'bg-green-100 text-green-700' },
    { emoji: '❓', label: 'question', display: 'Question', color: 'bg-yellow-100 text-yellow-700' },
    { emoji: '🎯', label: 'opportunity', display: 'Opportunity', color: 'bg-orange-100 text-orange-700' },
    { emoji: '🏆', label: 'achievement', display: 'Achievement', color: 'bg-purple-100 text-purple-700' },
    { emoji: '🤝', label: 'collaboration', display: 'Collaboration', color: 'bg-teal-100 text-teal-700' },
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
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
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
      // TODO: Replace with your actual API call
      // const formData = new FormData();
      // formData.append('content', postContent);
      // if (selectedImage) formData.append('image', selectedImage);
      // if (selectedpostType) formData.append('postType', selectedpostType);
      // const response = await fetch('/api/posts', {
      //   method: 'POST',
      //   headers: { Authorization: `Bearer ${token}` },
      //   body: formData,
      // });
      // const newPost = await response.json();

      // Simulated API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create mock post object (replace with actual response from backend)
      const newPost: PostType = {
        id: Date.now(), // Temporary ID, backend will provide real one
        user_id: 1, // TODO: Get from auth context
        username: username,
        content: selectedpostType 
          ? `${postContent}`
          : postContent,
        image_url: imagePreview,
        post_type: selectedpostType || 'general',
        created_at: new Date().toISOString(),
        profile_picture_url: profilePictureUrl || null,
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
      <div className="flex items-start space-x-3">
        {profilePictureUrl ? (
          <img 
            src={profilePictureUrl} 
            alt={username}
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold shrink-0">
            {userInitial}
          </div>
        )}
        <div className="flex-1">
          {!isExpanded ? (
            <input
              type="text"
              placeholder={`What's on your mind, ${username}?`}
              className="w-full bg-gray-100 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
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

      {/* Error Message */}
      {error && (
        <div className="mt-3 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="border-t mt-3 pt-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button 
            onClick={handlePhotoClick}
            className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition"
          >
            <span className="text-2xl">📷</span>
            <span className="text-gray-600 font-medium">Photo</span>
          </button>
          
          <div className="relative">
            <button 
              onClick={handlepostTypeClick}
              className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition"
            >
              <span className="text-2xl">📄</span>
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

        {/* Post/Cancel Buttons */}
        {isExpanded && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handlePost}
              disabled={isPostButtonDisabled}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                isPostButtonDisabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
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