// pages/EditProfile.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types/user';
import NavBar from './NavBar';

const EditProfile = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [program, setProgram] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/users/me/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('accessToken');
            navigate('/login');
            return;
          }
          setError('Failed to load profile');
          return;
        }

        const userData: User = await response.json();
        setUsername(userData.username);
        setEmail(userData.email || '');
        setBio(userData.bio || '');
        setProgram(userData.program || '');
        setProfilePictureUrl(userData.profile_picture_url || '');
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    const token = localStorage.getItem('accessToken');

    try {
      const response = await fetch(`http://localhost:8000/users/${username}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email || null,
          bio: bio || null,
          profile_picture_url: profilePictureUrl || null,
          program: program || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update profile');
        return;
      }

      setSuccessMessage('Profile updated successfully!');
      
      // Redirect to profile after 1.5 seconds
      setTimeout(() => {
        navigate(`/profile/${username}`);
      }, 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/profile/${username}`);
  };

  if (isLoading) {
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
    <div className="min-h-screen bg-purple-50">
      {/* Navigation Bar */}
      <NavBar />

      {/* Main Content */}
      <div className="pt-24 pb-12">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Profile</h1>
            <p className="text-gray-600">Update your profile information</p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {successMessage}
            </div>
          )}

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

            {/* Profile Picture URL */}
            <div className="mb-6">
              <label htmlFor="profilePicture" className="block text-sm font-semibold text-gray-700 mb-2">
                Profile Picture URL
              </label>
              <input
                type="url"
                id="profilePicture"
                value={profilePictureUrl}
                onChange={(e) => setProfilePictureUrl(e.target.value)}
                placeholder="https://example.com/your-image.jpg"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-text"
              />
              <p className="text-xs text-gray-500 mt-1">Enter a URL to an image hosted online</p>
              
              {/* Preview */}
              {profilePictureUrl && (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Preview:</p>
                  <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-2 border-gray-300">
                    <img
                      src={profilePictureUrl}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-8 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;