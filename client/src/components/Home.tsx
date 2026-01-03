import { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import Post from '../components/Post';
import type { Post as PostType } from '../types/post';
import CreatePost from './CreatePost';
import type { User as User } from '../types/user';


const Home = () => {
  const [posts, setPosts] = useState<PostType[]>([]);

  const navigate = useNavigate();

  const [userSignedIn, setUserSignedIn] = useState(() => {
    return Boolean(localStorage.getItem('accessToken'));
  });

  const [userData, setUserData] = useState<User | null>(null); // save the user data in browser so we dont have to prevent unecessary API calls

  useEffect(() => {

    const fetchPosts = async () => {
      
      try {
        // Fetch posts
        const postsResponse = await fetch('http://localhost:8000/posts/all?limit=30');

        // display all the posts, overwrite if there are new posts
        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          setPosts(postsData);
        }
      } catch(error) {
        console.error('Error fetching user info:', error);
      }
    }

    fetchPosts();

  }, []);

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
  }, [userSignedIn]);

  const handlePostCreated = (newPost: PostType) => {
    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);

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
            {userSignedIn && userData ? (
              <div key="welcome" className="bg-white rounded-lg shadow mb-4 p-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Welcome back, {userData.username}! 👋
                </h2>
                {userData.bio && (
                  <p className="text-gray-600 text-sm mt-1">{userData.bio}</p>
                )}
              </div>
            ) : null}

            {userSignedIn && userData ? (
              <CreatePost 
                key="create-post"
                onPostCreated={handlePostCreated}
                username={userData.username}
                userInitial={userData.username[0].toUpperCase()}
                profilePictureUrl={userData.profile_picture_url}
                program={userData.program}
              />
            ) : null}

            {/* Posts Feed */}
            {posts.length > 0 ? (
              posts.map((post) => (
                <Post key={post.id} post={post} />
              ))
            ) : (
              <div className="text-center text-gray-500 mt-8">
                No posts yet. Be the first to post!
              </div>
          )}
        </div>
      </div>
    </div>
  );
  };
  
export default Home;