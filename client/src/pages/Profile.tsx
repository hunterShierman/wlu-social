// pages/Profile.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { User } from '../types/user';
import type { ProfileStats } from '../types/profile';
import type { Post as PostType } from '../types/post';
import Post from '../components/Post'
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ followers: 0, following: 0 });
  const [posts, setPosts] = useState<PostType[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // fetch global user information
  const { userData, userSignedIn, logout } = useAuth();
  const currentUsername = userData?.username || '';

  const handleLogout = () => {
    logout();
    navigate('/');
  };


  // load in all the necessary data to populate the page for specific user
  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
  
      try {
  
        // Single API call for all profile data
        const response = await fetch(`${import.meta.env.VITE_API_URL}/users/${username}/complete?limit=2&offset=0`, {
          headers: token ? {
            'Authorization': `Bearer ${token}`,
          } : {},
        });
  
        if (!response.ok) {
          setError('User not found');
          setIsLoading(false);
          return;
        }
  
        const data = await response.json();
        setUser(data.user);
        setStats(data.stats);
        setPosts(data.posts);
        setTotalPosts(data.totalPosts);
        setHasMore(data.hasMore);

        // Check follow status (only if signed in and not own profile)
        if (token && currentUsername && currentUsername !== username) {
          const followStatusResponse = await fetch(
            `${import.meta.env.VITE_API_URL}/users/${username}/follow/status`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );
          
          if (followStatusResponse.ok) {
            const followData = await followStatusResponse.json();
            setIsFollowing(followData.isFollowing);
          }
        }
  
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };
  
    if (username) {
      fetchProfileData();
    }
  }, [username, currentUsername]);

  // Load more posts (5 at a time)
  const loadMorePosts = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const token = localStorage.getItem('accessToken');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/${username}/posts/paginated?limit=5&offset=${posts.length}`,
        {
          headers: token ? {
            'Authorization': `Bearer ${token}`,
          } : {},
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPosts(prev => [...prev, ...data.posts]);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleFollowClick = async () => {
    if (!userSignedIn) {
      alert('Please sign in to follow users');
      return;
    }

    if (isFollowLoading) return;

    setIsFollowLoading(true);
    const token = localStorage.getItem('accessToken');

    try {
      if (isFollowing) {
        // Unfollow
        const response = await fetch(`${import.meta.env.VITE_API_URL}/users/${username}/follow`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setIsFollowing(false);
          setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
        } else {
          console.error('Failed to unfollow user');
        }
      } else {
        // Follow
        const response = await fetch(`${import.meta.env.VITE_API_URL}/users/${username}/follow`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setIsFollowing(true);
          setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
        } else {
          console.error('Failed to follow user');
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#EBE0F5] via-white to-[#924DA7]/20">
        {/* Navigation */}
  
        {/* Skeleton Loader */}
        <div className="pt-20 pb-8">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6 animate-pulse">
              <div className="p-6">
                <div className="flex gap-6">
                  {/* Left Side - Profile Picture Skeleton */}
                  <div className="shrink-0">
                    <div className="w-32 h-32 rounded-full bg-gray-300"></div>
                  </div>
  
                  {/* Right Side - Info Skeleton */}
                  <div className="flex-1">
                    {/* Name and Button Row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-8 bg-gray-300 rounded w-40"></div>
                      <div className="h-10 bg-gray-300 rounded-full w-32"></div>
                    </div>
  
                    {/* Program and University */}
                    <div className="mb-3">
                      <div className="h-5 bg-gray-300 rounded w-48 mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-56"></div>
                    </div>
  
                    {/* Bio */}
                    <div className="mb-3">
                      <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    </div>
  
                    {/* Stats */}
                    <div className="flex items-center space-x-6 mb-3">
                      <div className="h-4 bg-gray-300 rounded w-24"></div>
                      <div className="h-4 bg-gray-300 rounded w-24"></div>
                      <div className="h-4 bg-gray-300 rounded w-20"></div>
                    </div>
  
                    {/* Member Since */}
                    <div className="h-4 bg-gray-300 rounded w-40"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#EBE0F5] via-white to-[#924DA7]/20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{error || 'User not found'}</h2>
          <button
            onClick={() => navigate('/')}
            className="text-purple-600 hover:underline cursor-pointer"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  const handlePostDeleted = (postId: number) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    setTotalPosts(prev => prev - 1);
  };

  const isOwnProfile = userSignedIn && currentUsername === username;

  return (
     <div className="min-h-screen bg-gradient-to-br from-[#EBE0F5] via-white to-[#924DA7]/20">
      {/* Navigation Bar */}

      {/* Main Content */}
      <div className="pt-20 pb-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Profile Top Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
            {/* Profile Info */}
            <div className="p-6">
              <div className="flex gap-6">
                {/* Left Side - Profile Picture */}
                <div className="shrink-0">
                  <div className="w-32 h-32 rounded-full border-4 border-purple-200 bg-purple-700 flex items-center justify-center overflow-hidden">
                    {user.profile_picture_url ? (
                      <img
                        src={user.profile_picture_url}
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-4xl">
                        {user.username[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Side - All Info */}
                <div className="flex-1">
                  {/* Name and Button Row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
                      <span className="text-purple-600 text-lg">✓</span>
                    </div>

                    {isOwnProfile ? (
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => navigate('/profile/edit')}
                          className="cursor-pointer px-6 py-2 bg-purple-800 text-white hover:bg-[#F2A900] transition-colors rounded-lg font-semibold"
                        >
                          Edit Profile
                        </button>
                        <button 
                          onClick={handleLogout}
                          className="cursor-pointer px-6 py-2 bg-white/60 backdrop-blur-sm text-[#330072] border border-[#330072]/20 hover:border-[#330072] transition-colors rounded-lg font-semibold"
                        >
                          Log Out
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={handleFollowClick}
                        disabled={isFollowLoading}
                        className={`px-6 py-2 rounded-lg font-semibold transition cursor-pointer ${
                          isFollowing 
                            ? 'bg-[#330072] text-white hover:bg-[#F2A900]' 
                            : 'bg-white/60 backdrop-blur-sm text-[#330072] border border-[#330072]/20 hover:border-[#330072]'
                        } ${isFollowLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isFollowLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>

                  {/* Program and University */}
                  <div className="mb-3">
                    {user.program && (
                      <p className="text-gray-700 font-medium">{user.program}</p>
                    )}
                    <p className="text-gray-600 text-sm">Wilfrid Laurier University</p>
                  </div>

                  {/* Bio */}
                  {user.bio && (
                    <p className="text-gray-700 mb-3">{user.bio}</p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center space-x-6 mb-3">
                    <div 
                      className="cursor-pointer hover:underline"
                      onClick={() => navigate(`/profile/${username}/connections?type=followers`)}
                    >
                      <span className="font-bold text-gray-900">{stats.followers}</span>
                      <span className="text-gray-600 ml-1 text-sm">followers</span>
                    </div>
                    <div 
                      className="cursor-pointer hover:underline"
                      onClick={() => navigate(`/profile/${username}/connections?type=following`)}
                    >
                      <span className="font-bold text-gray-900">{stats.following}</span>
                      <span className="text-gray-600 ml-1 text-sm">following</span>
                    </div>
                    <div className="">
                      <span className="font-bold text-gray-900">{totalPosts}</span>
                      <span className="text-gray-600 ml-1 text-sm">posts</span>
                    </div>
                  </div>

                  {/* Member Since */}
                  <p className="text-gray-500 text-sm">
                    Member since {formatDate(user.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Posts Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Posts</h2>
            {posts.length > 0 ? (
              <>
                <div className="space-y-4">
                  {posts.map((post) => (
                    <Post key={post.id} post={post} onPostDeleted={handlePostDeleted}/>
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={loadMorePosts}
                      disabled={isLoadingMore}
                      className="bg-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isLoadingMore ? 'Loading...' : `Load More Posts (${totalPosts - posts.length} remaining)`}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">
                  {isOwnProfile ? "You haven't posted anything yet." : `${user.username} hasn't posted anything yet.`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;