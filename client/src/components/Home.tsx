import { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import Post from '../components/Post';
import type { Post as PostType } from '../types/post';
import CreatePost from './CreatePost';
import type { User as User } from '../types/user';


const Home = () => {
  const [posts, setPosts] = useState<PostType[]>([
    {
      id: 1,
      user_id: 1,
      username: 'Dev Patel',
      content: "Excited to share that I'm moving to San Francisco for the next 8 months and joining purplejay (YC X25) as a Software Engineer! Looking forward to working on innovative solutions in the fintech space.",
      image_url: 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=800',
      post_type: 'career',
      created_at: '2025-12-25T10:30:00.000Z',
      profile_picture_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    },
    {
      id: 2,
      user_id: 2,
      username: 'Sarah Johnson',
      content: "Just wrapped up an amazing hackathon at WLU! Our team built an AI-powered study buddy that helps students prepare for exams. Huge thanks to my teammates and the organizers for making this possible. Can't wait to see where this project goes! 🚀",
      image_url: null,
      post_type: 'general',
      created_at: '2025-12-26T14:20:00.000Z',
      profile_picture_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    },
    {
      id: 3,
      user_id: 3,
      username: 'Alex Chen',
      content: "Really proud of our CS club for organizing the largest tech networking event in WLU history! Over 200 students connected with industry professionals from companies like Google, Microsoft, and Amazon. If you're interested in joining our club, drop me a message!",
      image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      post_type: 'club_event',
      created_at: '2025-12-27T11:45:00.000Z',
      profile_picture_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    },
  ]);

  const navigate = useNavigate();

  const [userSignedIn, setUserSignedIn] = useState(() => {
    return Boolean(localStorage.getItem('accessToken'));
  });

  const [userData, setUserData] = useState<User | null>(null); // save the user data in browser so we dont have to prevent unecessary API calls


  // Fetch user info when component loads
  useEffect(() => {
    const fetchUserInfo = async () => {
      const accessToken = localStorage.getItem('accessToken');
      
      // Check if user has a token
      if (!accessToken) {
        console.log('No access token found');
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/users/me/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          console.error('Failed to fetch user info:', response.status);
          
          // If token is invalid, remove it and sign out
          if (response.status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setUserSignedIn(false);
          }
          return;
        }

        const userData = await response.json(); // returns the user data record from the database
        setUserData(userData);
        
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchUserInfo();
  }, []);

  const handlePostCreated = (newPost: PostType) => {
    setPosts([newPost, ...posts]);
  };

  const handleLogout = () => {
    // Remove tokens from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUserSignedIn(false);
    navigate('/login');
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-2xl font-bold text-purple-800">WLU Connect</h1>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search"
                className="bg-gray-100 rounded-full px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              
              {userSignedIn ? (
                // Show logout button and profile when signed in
                <>
                  <button
                    onClick={handleLogout}
                    className="bg-white text-purple-600 border border-purple-600 px-4 py-2 rounded-full font-semibold hover:bg-purple-50 transition"
                  >
                    Logout
                  </button>
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold overflow-hidden">
                    {userData?.profile_picture_url ? (
                      <img 
                        src={userData.profile_picture_url} 
                        alt={userData.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{userData?.username?.[0].toUpperCase() || 'U'}</span>
                    )}
                  </div>
                </>
              ) : (
                // Show sign in button when signed out
                <button
                  onClick={handleSignIn}
                  className="bg-purple-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-purple-700 transition"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
          </div>
        </nav>
  
        {/* Main Content */}
        <div className="pt-20 pb-8 justify-center">
          <div className="max-w-2xl mx-auto px-4">
            {/* Welcome message when signed in */}
            {userSignedIn && userData && (
              <div className="bg-white rounded-lg shadow mb-4 p-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Welcome back, {userData.username}! 👋
                </h2>
                {userData.bio && (
                  <p className="text-gray-600 text-sm mt-1">{userData.bio}</p>
                )}
              </div>
            )}
  
            {/* Create Post Box - only show when signed in */}
            {userSignedIn && userData && (
              <CreatePost 
                onPostCreated={handlePostCreated}
                username={userData.username}
                userInitial={userData.username[0].toUpperCase()}
                profilePictureUrl={userData.profile_picture_url}
              />
            )}
  
            {/* Posts Feed */}
            {posts.map((post) => (
              <Post key={post.id} post={post} />
            ))}
          </div>
        </div>
      </div>
    );
  };
  
export default Home;