import { useState, useEffect} from 'react';
import Post from '../components/Post';
import type { Post as PostType } from '../types/post';
import CreatePost from './CreatePost';
import type { User as User } from '../types/user';

const Home = () => {
  const [posts, setPosts] = useState<PostType[]>([]);

  const [userSignedIn, setUserSignedIn] = useState(() => {
    return Boolean(localStorage.getItem('accessToken'));
  });

  const [userData, setUserData] = useState<User | null>(null); // save the user data in browser so we dont have to prevent unecessary API calls

  useEffect(() => {

    const fetchPosts = async () => {
      
      try {
        // Fetch posts
        const postsResponse = await fetch('process.env.VITE_API_URL/posts/all?limit=30');

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
        const response = await fetch('process.env.VITE_API_URL/users/me/profile', {
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

  const handlePostDeleted = (postId: number) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  };

  return (
    <div className="min-h-screen bg-purple-50">
      {/* Navigation Bar */}
      {/* Main Content */}
      <div className="pt-20 pb-8 justify-center">


      <div className="max-w-xl mx-auto px-4">
            {userSignedIn && userData ? (
              <div key="welcome" className="bg-white rounded-lg shadow mb-4 p-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Welcome back, {userData.username}! 👋
                </h2>
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
                <Post key={post.id} post={post} onPostDeleted={handlePostDeleted}/>
              ))
            ) : (
              <div className="text-center text-gray-500 mt-8">
                Loading posts...
              </div>
          )}
        </div>
      </div>
    </div>
  );
  };
  
export default Home;