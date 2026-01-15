// components/GroupMembersModal.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface GroupMember {
  user_id: number;
  username: string;
  profile_picture_url: string | null;
  program: string | null;
  joined_at: string;
  created_by: number;
}

interface GroupMembersModalProps {
  groupId: number;
  groupName: string;
  onClose: () => void;
}

const GroupMembersModal = ({ groupId, groupName, onClose }: GroupMembersModalProps) => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMembers = async () => {
      setIsLoading(true);
      setError('');
      
      const token = localStorage.getItem('accessToken');

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/study-groups/${groupId}/members`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setMembers(data);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to load members');
        }
      } catch (error) {
        console.error('Error fetching members:', error);
        setError('Failed to load members');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [groupId]);

  const handleMemberClick = (username: string) => {
    navigate(`/profile/${username}`);
    onClose();
  };

  const formatJoinedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const isCreator = (member: GroupMember) => {
    return member.user_id === member.created_by;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-md w-full max-h-[80vh] flex flex-col" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Group Members</h2>
              <p className="text-sm text-gray-600 mt-1">{groupName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="text-gray-600 mt-4">Loading members...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl block mb-2">👥</span>
              <p className="text-gray-600">No members yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </p>
              {members.map((member) => (
                <button
                  key={member.user_id}
                  onClick={() => handleMemberClick(member.username)}
                  className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition cursor-pointer text-left"
                >
                  {/* Profile Picture */}
                  {member.profile_picture_url ? (
                    <img
                      src={member.profile_picture_url}
                      alt={member.username}
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold shrink-0">
                      {member.username[0].toUpperCase()}
                    </div>
                  )}

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900 truncate">
                        {member.username}
                      </span>
                      {isCreator(member) && (
                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                          Creator
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {member.program || 'Student'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Joined {formatJoinedDate(member.joined_at)}
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  <svg 
                    className="w-5 h-5 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 5l7 7-7 7" 
                    />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupMembersModal;