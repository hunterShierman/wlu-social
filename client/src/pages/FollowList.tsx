// pages/FollowList.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

interface FollowUser {
  username: string;
  profile_picture_url: string | null;
  bio: string | null;
  program: string | null;
}

const FollowList = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const type = searchParams.get('type') as 'followers' | 'following' || 'followers';

  const [users, setUsers] = useState<FollowUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<FollowUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/users/${username}/${type}`);

        if (response.ok) {
          const data = await response.json();
          setUsers(data);
          setFilteredUsers(data);
        } else {
          setError('Failed to load users');
        }
      } catch (error) {
        console.error(`Error fetching ${type}:`, error);
        setError('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    if (username) {
      fetchUsers();
    }
  }, [username, type]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.program?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const handleUserClick = (clickedUsername: string) => {
    navigate(`/profile/${clickedUsername}`);
  };

  const handleBackClick = () => {
    navigate(`/profile/${username}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#EBE0F5] via-white to-[#924DA7]/20">
        <div className="pt-20 pb-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EBE0F5] via-white to-[#924DA7]/20">
      <div className="pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={handleBackClick}
            className="flex items-center text-purple-600 hover:text-purple-700 mb-4 font-medium cursor-pointer"
          >
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Profile
          </button>

          {/* Main Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {users.length} {type === 'followers' ? 'Followers' : 'Following'}
              </h1>
              <p className="text-gray-600">@{username}</p>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* User List */}
            <div>
              {error ? (
                <div className="text-center py-12 px-4">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <p className="text-gray-500">
                    {searchQuery
                      ? 'No users found matching your search'
                      : type === 'followers'
                      ? 'No followers yet'
                      : 'Not following anyone yet'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.username}
                      onClick={() => handleUserClick(user.username)}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition flex items-center gap-4"
                    >
                      {/* Profile Picture */}
                      <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                        {user.profile_picture_url ? (
                          <img
                            src={user.profile_picture_url}
                            alt={user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-700 font-bold text-xl">
                            {user.username[0].toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-lg">
                          {user.username}
                        </p>
                        {user.program && (
                          <p className="text-sm text-gray-600">
                            {user.program}
                          </p>
                        )}
                        {user.bio && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {user.bio}
                          </p>
                        )}
                      </div>

                      {/* Message Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUserClick(user.username);
                        }}
                        className="px-6 py-2 border border-purple-600 text-purple-600 rounded-full font-semibold hover:bg-purple-50 transition shrink-0 cursor-pointer"
                      >
                        View Profile
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FollowList;