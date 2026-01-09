// pages/Profile.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { User } from '../types/user';
import type { ProfileStats } from '../types/profile';
import type { Post as PostType } from '../types/post';
import Post from '../components/Post'

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
  const [currentUsername, setCurrentUsername] = useState('');
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // load in all the necessary data to populate the page for specific user
  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      setIsSignedIn(!!token);
  
      try {
        // Fetch current user (only if signed in)
        if (token) {
          const currentUserResponse = await fetch('http://localhost:8000/users/me/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
  
          if (currentUserResponse.ok) {
            const currentUserData = await currentUserResponse.json();
            setCurrentUsername(currentUserData.username);
          }
        }
  
        // Single API call for all profile data
        const response = await fetch(`http://localhost:8000/users/${username}/complete?limit=2&offset=0`, {
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
            `http://localhost:8000/users/${username}/follow/status`,
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
        `http://localhost:8000/users/${username}/posts/paginated?limit=5&offset=${posts.length}`,
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
    if (!isSignedIn) {
      alert('Please sign in to follow users');
      navigate('/login');
      return;
    }

    if (isFollowLoading) return;

    setIsFollowLoading(true);
    const token = localStorage.getItem('accessToken');

    try {
      if (isFollowing) {
        // Unfollow
        const response = await fetch(`http://localhost:8000/users/${username}/follow`, {
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
        const response = await fetch(`http://localhost:8000/users/${username}/follow`, {
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
      <div className="min-h-screen bg-gray-100">
        {/* Navigation */}
        <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              <button onClick={() => navigate('/')} className="text-2xl font-bold text-purple-800 cursor-pointer">
                WLU Connect
              </button>
            </div>
          </div>
        </nav>
  
        {/* Skeleton Loader */}
        <div className="pt-20 pb-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6 animate-pulse">
              <div className="h-32 bg-gray-300"></div>
              <div className="px-6 pb-6">
                <div className="w-32 h-32 rounded-full bg-gray-300 -mt-16 mb-4"></div>
                <div className="h-6 bg-gray-300 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
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

  const isOwnProfile = isSignedIn && currentUsername === username;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <button
              onClick={() => navigate('/')}
              className="text-2xl font-bold text-purple-800 hover:text-purple-900 transition cursor-pointer"
            >
              WLU Connect
            </button>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-purple-600 hover:underline font-semibold cursor-pointer"
              >
                Back to Home
              </button>
              {!isSignedIn && (
                <button
                  onClick={() => navigate('/login')}
                  className="bg-purple-600 cursor-pointer text-white px-4 py-2 rounded-full font-semibold hover:bg-purple-700 transition"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Profile Top Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
            {/* Cover Image/Background */}
            <div className="h-32 bg-linear-to-r from-purple-600 to-purple-800"></div>

            {/* Profile Info */}
            <div className="px-6 pb-6">
              {/* Profile Picture */}
              <div className="flex justify-between items-start -mt-16 mb-4">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-300 flex items-center justify-center overflow-hidden">
                  {user.profile_picture_url ? (
                    <img
                      src={user.profile_picture_url}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-700 font-bold text-4xl">
                      {user.username[0].toUpperCase()}
                    </span>
                  )}
                </div>

                {isOwnProfile ? (
                  <button className="cursor-pointer mt-4 px-6 py-2 bg-gray-100 text-black border border-gray-300 rounded-full font-semibold hover:bg-gray-200 transition">
                    Edit Profile
                  </button>
                ) : (
                  <button 
                    onClick={handleFollowClick}
                    disabled={isFollowLoading}
                    className={`mt-4 px-6 py-2 rounded-full font-semibold cursor-pointer ${
                      isFollowing 
                        ? 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200' 
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    } ${isFollowLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isFollowLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>

              {/* Name and Info */}
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
                  <span className="text-purple-600 text-lg">✓</span>
                </div>
                {user.program && (
                  <p className="text-gray-700 font-medium">{user.program}</p>
                )}
                <p className="text-gray-600 text-sm">Wilfrid Laurier University</p>
              </div>

              {/* Bio */}
              {user.bio && (
                <p className="text-gray-700 mb-4">{user.bio}</p>
              )}

              {/* Stats */}
              <div className="flex items-center space-x-6 mb-4">
                <div className="cursor-pointer hover:underline">
                  <span className="font-bold text-gray-900">{stats.followers}</span>
                  <span className="text-gray-600 ml-1">followers</span>
                </div>
                <div className="cursor-pointer hover:underline">
                  <span className="font-bold text-gray-900">{stats.following}</span>
                  <span className="text-gray-600 ml-1">following</span>
                </div>
                <div className="cursor-pointer hover:underline">
                  <span className="font-bold text-gray-900">{totalPosts}</span>
                  <span className="text-gray-600 ml-1">posts</span>
                </div>
              </div>

              {/* Member Since */}
              <p className="text-gray-500 text-sm">
                Member since {formatDate(user.created_at)}
              </p>
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