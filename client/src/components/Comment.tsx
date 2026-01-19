// components/Comment.tsx
import { useState } from 'react';
import type { Comment as CommentType } from '../types/comment.ts';
import { useNavigate } from 'react-router-dom';

interface CommentProps {
  comment: CommentType;
  currentUsername: string;
  onDelete: (commentId: number) => void;
}

const Comment = ({ comment, currentUsername, onDelete }: CommentProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInHours < 48) return '1d';
    return `${Math.floor(diffInHours / 24)}d`;
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      await onDelete(comment.id);
    } finally {
      setIsDeleting(false);
    }
  };

return (
  <div className="flex items-start space-x-2">
    <div 
      onClick={() => navigate(`/profile/${comment.username}`)}
      className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer ring-2 ring-[#F2A900]/20">
      {comment.profile_picture_url ? (
        <img 
          src={comment.profile_picture_url} 
          alt={comment.username} 
          className="w-full h-full object-cover" 
        />
      ) : (
        <span className="text-white font-semibold text-xs">
          {comment.username[0].toUpperCase()}
        </span>
      )}
    </div>
    <div className="flex-1">
      <div className="bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-[#330072]/10">
        <p 
          onClick={() => navigate(`/profile/${comment.username}`)}
          className="font-semibold text-xs text-[#330072] cursor-pointer hover:text-[#F2A900] transition">{comment.username}</p>
        <p className="text-sm text-gray-800">{comment.content}</p>
      </div>
      <div className="flex items-center space-x-3 mt-1 px-2">
        <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
        {comment.username === currentUsername && (
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs text-red-600 hover:underline disabled:opacity-50 transition cursor-pointer"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        )}
      </div>
    </div>
  </div>
);
};

export default Comment;