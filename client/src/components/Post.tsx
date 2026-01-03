import type { Post as PostType } from '../types/post';
import { useState, useEffect} from 'react';
import Comment from './Comment';
import type { Comment as CommentType } from '../types/comment';


interface PostProps {
  post: PostType;
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

const Post = ({ post }: PostProps) => {

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(46); // You'll want to get this from the post data
  const [isLoading, setIsLoading] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [allComments, setAllComments] = useState<CommentType[]>([]);
  const [displayedComments, setDisplayedComments] = useState(2);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUsername, setCurrentUsername] = useState('');

  // Check if user has already liked the post on component mount
  useEffect(() => {
    const checkIfLiked = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          return;
        }

        const response = await fetch(`http://localhost:8000/likes/posts/${post.id}/me`, {
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
        const response = await fetch(`http://localhost:8000/likes/posts/${post.id}/count`);
        
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
      const response = await fetch(`http://localhost:8000/posts/${post.id}/comments/count`, {
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
      const response = await fetch(`http://localhost:8000/posts/${post.id}/comments`, {
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

// Get current user - ONLY runs if user is signed in
useEffect(() => {
  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      return; // Exit early if no token
    }

    try {
      const userResponse = await fetch('http://localhost:8000/users/me/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUsername(userData.username);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  fetchCurrentUser();
}, []); // Only runs once on mount

  const handleLike = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    const token = localStorage.getItem('accessToken');
    
    try {
      if (isLiked) {
        // Unlike the post
        const response = await fetch(`http://localhost:8000/likes/posts/${post.id}/like`, {
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
        const response = await fetch(`http://localhost:8000/likes/posts/${post.id}/like`, {
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
    setShowCommentInput(!showCommentInput);
  };

  const handleLoadMoreComments = () => {
    setDisplayedComments(prev => Math.min(prev + 4, allComments.length));
  };

  const refreshComments = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const commentsResponse = await fetch(`http://localhost:8000/posts/${post.id}/comments`, {
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
      const response = await fetch(`http://localhost:8000/posts/${post.id}/comments`, {
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
      const response = await fetch(`http://localhost:8000/comments/${commentId}`, {
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
            <p className="text-xs text-gray-600">{post.program} @ Wilfrid Laurier University</p>
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
          {postTypeInfo && (
            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full ${postTypeInfo.color}`}>
              <span className="text-sm">{postTypeInfo.emoji}</span>
              <span className="text-xs font-medium">{postTypeInfo.display}</span>
            </div>
          )}
          <div className="flex items-center">
            <span key="love" className="text-red-500">❤️</span>
          </div>
          <span className="hover:text-purple-600 hover:underline cursor-pointer">
            {likeCount} reactions
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="hover:text-purple-600 hover:underline cursor-pointer">
            {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t border-gray-300 px-2 py-2 flex items-center justify-around">
        <button 
          onClick={handleLike}
          disabled={isLoading}
          className={`flex items-center space-x-2 px-4 py-2 rounded flex-1 justify-center transition ${
            isLiked 
              ? 'bg-white-50 text-red-600' 
              : 'bg-white text-black hover:bg-gray-100'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="text-xl">{isLiked ? '❤️' : '♡'}</span>
          <span className="text-sm font-semibold">{isLiked ? 'Liked' : 'Like'}</span>
        </button>
        <button 
          onClick={handleCommentClick}
          className={`flex items-center space-x-2 px-4 py-2 rounded flex-1 justify-center transition ${
            showCommentInput ? 'bg-gray-100' : 'bg-white hover:bg-gray-100'
          } text-black`}
        >
          <span className="text-xl">🗨</span>
          <span className="text-sm font-semibold">Comment</span>
        </button>
      </div>

      {/* Comments Section */}
      {allComments.length > 0 && (
        <div className="px-4 pb-3 border-t border-gray-200">
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
              className="text-sm text-purple-600 hover:underline font-semibold mt-3"
            >
              Load more comments
            </button>
          )}
        </div>
      )}

      {/* Comment Input */}
      {showCommentInput && (
        <div className="px-4 pb-4 border-t border-gray-200">
          <form onSubmit={handleSubmitComment} className="flex items-center space-x-2 mt-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="bg-purple-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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