import { useState, useEffect} from 'react';
import Post from '../components/Post';
import type { Post as PostType } from '../types/post';
import CreatePost from '../components/CreatePost';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const [posts, setPosts] = useState<PostType[]>([]);

  const { userData, isLoading, userSignedIn } = useAuth();

  useEffect(() => {

    const fetchPosts = async () => {
      
      try {
        // Fetch posts
        const postsResponse = await fetch(`${import.meta.env.VITE_API_URL}/posts/all?limit=30`);

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

  const handlePostCreated = (newPost: PostType) => {
    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);

  };

  const handlePostDeleted = (postId: number) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  };

return (
  <div className="min-h-screen bg-gradient-to-br from-[#EBE0F5] via-white to-[#924DA7]/20">
    <div className="pt-20 pb-8 justify-center">
      <div className="max-w-xl mx-auto px-4">
        {/* Optional: Show loading state while fetching user */}
        {isLoading ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#F2A900]"></div>
          </div>
        ) : (
          <>
            {userSignedIn && userData && (
              <div key="welcome" className="backdrop-blur-xl bg-white border-l-4 border-[#F2A900] rounded-xl shadow-lg mb-4 p-6 hover:shadow-xl transition-all duration-300">
                <h2 className="text-xl font-semibold text-[#330072]">
                  Welcome back, {userData.username}! 👋
                </h2>
              </div>
            )}

            {userSignedIn && userData && (
              <CreatePost 
                key="create-post"
                onPostCreated={handlePostCreated}
                username={userData.username}
                userInitial={userData.username[0].toUpperCase()}
                profilePictureUrl={userData.profile_picture_url}
                program={userData.program}
              />
            )}
          </>
        )}

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