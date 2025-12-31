import type { Post as PostType } from '../types/post';

interface PostProps {
  post: PostType;
}

const Post = ({ post }: PostProps) => {

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


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInHours < 48) return '1d';
    return `${Math.floor(diffInHours / 24)}d`;
  };

  const getPostTypeInfo = () => {
    return postTypes.find(pt => pt.label === post.post_type);
  };

  const postTypeInfo = getPostTypeInfo();

  return (
    <div className="bg-white rounded-lg border border-gray-300 mb-4">

      {/* Post Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-start">
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden shrink-0">
            {post.profile_picture_url ? (
              <img src={post.profile_picture_url} alt={post.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-700 font-semibold text-lg">{post.username[0].toUpperCase()}</span>
            )}
          </div>
          <div className="ml-3">
            <div className="flex items-center">
              <p className="font-semibold text-sm text-gray-900 hover:underline cursor-pointer">{post.username}</p>
              <span className="ml-1 text-purple-600 text-sm">✓</span>
            </div>
            <p className="text-xs text-gray-600"> {post.program} @ Wilfrid Laurier University</p>
            <p className="text-xs text-gray-500">{formatDate(post.created_at)} • 🌎</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="bg-white text-black font-semibold text-sm hover:bg-purple-50 px-4 py-1 rounded-full transition border border-purple-600">
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
          {/* Post Type Badge */}
          {postTypeInfo && (
            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full ${postTypeInfo.color}`}>
              <span className="text-sm">{postTypeInfo.emoji}</span>
              <span className="text-xs font-medium">{postTypeInfo.display}</span>
            </div>
          )}
          <div className="flex items-center">
            <span className="text-purple-600">👍</span>
            <span className="text-red-500">❤️</span>
            <span className="text-green-600">💡</span>
          </div>
          <span className="hover:text-purple-600 hover:underline cursor-pointer">46 reactions</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="hover:text-purple-600 hover:underline cursor-pointer">13 comments</span>
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