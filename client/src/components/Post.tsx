import type { Post as PostType } from '../types/post';
import { useState, useEffect, useRef} from 'react';
import Comment from './Comment';
import type { Comment as CommentType } from '../types/comment';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PostProps {
  post: PostType;
  onPostDeleted?: (postId: number) => void; // Callback to notify parent when post is deleted
}


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

const Post = ({ post, onPostDeleted  }: PostProps) => {

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(46); // You'll want to get this from the post data
  const [isLoading, setIsLoading] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [allComments, setAllComments] = useState<CommentType[]>([]);
  const [displayedComments, setDisplayedComments] = useState(1);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();

  const { userData } = useAuth();
  const currentUsername = userData?.username || '';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check if user has already liked the post on component mount
  useEffect(() => {
    const checkIfLiked = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/likes/posts/${post.id}/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsLiked(data.liked);
        }
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };

    checkIfLiked();
  }, [post.id]);

  // Get like count on component mount
  useEffect(() => {
    const getLikeCount = async () => {
      try {
        // const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/likes/posts/${post.id}/count`);
        
        if (response.ok) {
          const data = await response.json();
          setLikeCount(data.count);
        }
      } catch (error) {
        console.error('Error getting like count:', error);
      }
    };

    getLikeCount();
  }, [post.id]);

// Get comment count on component mount
useEffect(() => {
  const getCommentCount = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/posts/${post.id}/comments/count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const countData = await response.json();
        setCommentCount(countData.count);
      }
    } catch (error) {
      console.error('Error getting comment count:', error);
    }
  };

  getCommentCount();
}, [post.id]);

// Get all comments on component mount
useEffect(() => {
  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/posts/${post.id}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const commentsData = await response.json();
        setAllComments(commentsData);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  fetchComments();
}, [post.id]);

  const handleLike = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    const token = localStorage.getItem('accessToken');

    if (!token) {
      alert('Sign in to like this post');
      return;
    }
    
    try {
      if (isLiked) {
        // Unlike the post
        const response = await fetch(`${import.meta.env.VITE_API_URL}/likes/posts/${post.id}/like`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          setIsLiked(false);
          setLikeCount(prev => prev - 1);
        } else {
          console.error('Failed to unlike post');
        }
      } else {
        // Like the post
        const response = await fetch(`${import.meta.env.VITE_API_URL}/likes/posts/${post.id}/like`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          setIsLiked(true);
          setLikeCount(prev => prev + 1);
        } else {
          console.error('Failed to like post');
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleCommentClick = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('Sign in to join the conversation');
      return;
    }
    setShowCommentInput(!showCommentInput);
  };

  const handleLoadMoreComments = () => {
    setDisplayedComments(prev => Math.min(prev + 4, allComments.length));
  };

  const refreshComments = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const commentsResponse = await fetch(`${import.meta.env.VITE_API_URL}/posts/${post.id}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json();
        setAllComments(commentsData);
        setCommentCount(commentsData.length);
      }
    } catch (error) {
      console.error('Error refreshing comments:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      });
      
      if (response.ok) {
        setNewComment('');
        await refreshComments();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        await refreshComments();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    setIsDeleting(true);
    const token = localStorage.getItem('accessToken');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/posts/${post.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Notify parent component that post was deleted
        if (onPostDeleted) {
          onPostDeleted(post.id);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    } finally {
      setIsDeleting(false);
      setShowDropdown(false);
    }
  };

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
  const visibleComments = allComments.slice(0, displayedComments);
  const hasMoreComments = displayedComments < allComments.length;
  const isOwnPost = currentUsername === post.username;

return (
  <div className="bg-white backdrop-blur-xl rounded-lg border border-[#330072]/20 mb-4 hover:border-[#F2A900]/50 transition-all duration-300 shadow-lg">
    {/* Post Header */}
    <div className="p-4 flex items-start justify-between">
      <div className="flex items-start">
        <div 
           onClick={() => navigate(`/profile/${post.username}`)}
          className="w-12 h-12 rounded-full bg-purple-700 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer ring-2 ring-[#F2A900]/30">
          {post.profile_picture_url ? (
            <img src={post.profile_picture_url} alt={post.username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-semibold text-lg">{post.username[0].toUpperCase()}</span>
          )}
        </div>
        <div className="ml-3">
          <div className="flex items-center">
            <p 
              onClick={() => navigate(`/profile/${post.username}`)}
              className="font-semibold text-sm text-[#330072] hover:underline cursor-pointer hover:text-[#F2A900]">{post.username}</p>
            <span className="ml-1 text-[#F2A900] text-sm">✓</span>
          </div>
          <p className="text-xs text-gray-600 font-normal">{post.program} @ Wilfrid Laurier University</p>
          <p className="text-xs text-gray-500 font-normal">{formatDate(post.created_at)} • 🌎</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">

        {/* Three dots menu */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="bg-white/50 text-[#330072] p-2 rounded-full text-lg cursor-pointer transition"
          >
            ⋮
          </button>
          
          {/* Popup overlay */}
          {showDropdown && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 rounded-lg">
              <div className="bg-white rounded-lg shadow-xl p-4 min-w-[200px]">
                {isOwnPost ? (
                  <button
                    onClick={handleDeletePost}
                    disabled={isDeleting}
                    className="w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 font-semibold"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Post'}
                  </button>
                ) : (
                  <button
                  onClick={() => {
                    alert("Post Reported");
                    setShowDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 rounded-lg transition font-semibold"
                  >
                    Report Post
                  </button>
                )}
                <button
                  onClick={() => setShowDropdown(false)}
                  className="w-full px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition mt-2 font-normal"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Post Content */}
    <div className="px-4 pb-3">
      <p className="text-sm text-gray-900 whitespace-pre-wrap leading-5 font-normal">
        {post.content.length > 200 ? (
          <>
            {post.content.substring(0, 200)}...
            <button className="bg-transparent text-[#330072] font-semibold ml-1 hover:text-[#F2A900] transition">more</button>
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
    <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-600 font-normal">
      <div className="flex items-center space-x-2">
        {postTypeInfo && (
          <div className={`flex items-center space-x-1 px-3 py-1 rounded-full ${postTypeInfo.color}`}>
            <span className="text-sm">{postTypeInfo.emoji}</span>
            <span className="text-xs font-semibold">{postTypeInfo.display}</span>
          </div>
        )}
        <div className="flex items-center">
          <span key="love" className="text-red-500">❤️</span>
        </div>
        <span className="hover:text-[#F2A900] transition cursor-pointer">
          {likeCount} reactions
        </span>
      </div>
      <div className="flex items-center space-x-3">
        <span className="transition">
          {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
        </span>
      </div>
    </div>

    {/* Action Buttons */}
    <div className="border-t border-[#330072]/10 px-2 py-2 flex items-center justify-around">
      <button 
        onClick={handleLike}
        disabled={isLoading}
        className={`flex items-center space-x-2 px-4 py-2 rounded flex-1 justify-center transition cursor-pointer bg-white/50 text-gray-800 ${
          isLiked 
            ? 'bg-white/50 text-red-600' 
            : 'bg-white/50 text-gray-800'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLiked ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
        )}
        <span className="text-sm font-semibold">{isLiked ? 'Liked' : 'Like'}</span>
      </button>
      <button 
        onClick={handleCommentClick}
        className={`flex items-center space-x-2 px-4 py-2 rounded flex-1 justify-center transition cursor-pointer ${
          showCommentInput ? 'bg-gray-50' : 'bg-white/50 text-gray-800 hover:bg-gray-50'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
        </svg>
        <span className="text-sm font-semibold">Comment</span>
      </button>
    </div>

    {/* Comments Section */}
    {allComments.length > 0 && (
      <div className="px-4 pb-3 border-t border-[#330072]/10">
        <div className="space-y-3 mt-3">
          {visibleComments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              currentUsername={currentUsername}
              onDelete={handleDeleteComment}
            />
          ))}
        </div>

        {/* Load More Comments Button */}
        {hasMoreComments && (
          <button 
            onClick={handleLoadMoreComments}
            className="text-sm text-purple-700 hover:text-[#F2A900] font-semibold mt-3 cursor-pointer transition"
          >
            Load more comments
          </button>
        )}
      </div>
    )}

    {/* Comment Input */}
    {showCommentInput && (
      <div className="px-4 pb-4 border-t border-[#330072]/10">
        <form onSubmit={handleSubmitComment} className="flex items-center space-x-2 mt-3">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#330072]/50 border border-[#330072]/10"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="bg-purple-700 text-white px-6 py-2 rounded-full font-semibold hover:bg-[#F2A900] transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed text-sm"
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </form>
      </div>
    )}
  </div>
);
};

export default Post;