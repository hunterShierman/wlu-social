import type { Post as PostType } from '../types/post';

interface PostProps {
  post: PostType;
}

const Post = ({ post }: PostProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInHours < 48) return '1d';
    return `${Math.floor(diffInHours / 24)}d`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-300 mb-4">
      {/* Post Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-start">
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
            {post.profile_picture_url ? (
              <img src={post.profile_picture_url} alt={post.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-700 font-semibold text-lg">{post.username[0].toUpperCase()}</span>
            )}
          </div>
          <div className="ml-3">
            <div className="flex items-center">
              <p className="font-semibold text-sm text-gray-900 hover:underline cursor-pointer">{post.username}</p>
              <span className="ml-1 text-blue-600 text-sm">✓</span>
            </div>
            <p className="text-xs text-gray-600">CS @ Wilfrid Laurier University</p>
            <p className="text-xs text-gray-500">{formatDate(post.created_at)} • 🌎</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="bg-white text-black font-semibold text-sm hover:bg-blue-50 px-4 py-1 rounded-full transition border border-blue-600">
            + Follow
          </button>
          <button className="bg-white text-black hover:bg-gray-100 p-2 rounded-full text-lg">
            ⋮
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-gray-900 whitespace-pre-wrap leading-5">
          {post.content.length > 200 ? (
            <>
              {post.content.substring(0, 200)}...
              <button className="bg-white text-black font-semibold ml-1">more</button>
            </>
          ) : (
            post.content
          )}
        </p>
      </div>

      {/* Post Image */}
      {post.image_url && (
        <div className="w-full bg-gray-100">
          <img src={post.image_url} alt="Post content" className="w-full object-cover max-h-64" />
        </div>
      )}

      {/* Engagement Stats */}
      <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <span className="text-blue-600">👍</span>
            <span className="text-red-500">❤️</span>
            <span className="text-green-600">💡</span>
          </div>
          <span className="hover:text-blue-600 hover:underline cursor-pointer">46 reactions</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="hover:text-blue-600 hover:underline cursor-pointer">13 comments</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t border-gray-300 px-2 py-2 flex items-center justify-around">
        <button className="bg-white text-black flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded flex-1 justify-center transition">
          <span className="text-xl">👍</span>
          <span className="text-sm font-semibold">Like</span>
        </button>
        <button className="bg-white text-black flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded flex-1 justify-center transition">
          <span className="text-xl">💬</span>
          <span className="text-sm font-semibold">Comment</span>
        </button>
        <button className="bg-white text-black flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded flex-1 justify-center transition">
          <span className="text-xl">🔄</span>
          <span className="text-sm font-semibold">Repost</span>
        </button>
        <button className="bg-white text-black flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded flex-1 justify-center transition">
          <span className="text-xl">📤</span>
          <span className="text-sm font-semibold">Send</span>
        </button>
      </div>
    </div>
  );
};

export default Post;