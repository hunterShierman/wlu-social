// pages/StudyGroups.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateGroupModal from '../modals/CreateGroupModal';
import GroupMembersModal from '../modals/GroupMembersModal';
import { useAuth } from '../context/AuthContext';

interface StudyGroup {
  group_id: number;
  name: string;
  course_code: string;
  description: string | null;
  max_members: number | null;
  date_time: string | null;
  location: string | null;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  created_at: string;
  created_by_username: string;
  current_members: string;
}

const StudyGroups = () => {
  const navigate = useNavigate();
  const [allGroups, setAllGroups] = useState<StudyGroup[]>([]);
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [displayedGroups, setDisplayedGroups] = useState<StudyGroup[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingGroupId, setLoadingGroupId] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState<number | null>(null);
  const [selectedGroupName, setSelectedGroupName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // fetch global user data from auth context
    const { userData } = useAuth();
    const currentUsername = userData?.username || '';


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken')

      try {
        // Fetch all study groups
        const groupsResponse = await fetch(`${import.meta.env.VITE_API_URL}/study-groups`);
        if (groupsResponse.ok) {
          const groups = await groupsResponse.json();
          setAllGroups(groups);
          setDisplayedGroups(groups);
        }

        // Fetch my groups
        const myGroupsResponse = await fetch(`${import.meta.env.VITE_API_URL}/study-groups/me/memberships`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (myGroupsResponse.ok) {
          setMyGroups(await myGroupsResponse.json());
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update displayed groups based on active tab and search
  useEffect(() => {
    const sourceGroups = activeTab === 'all' ? allGroups : myGroups;
    const filtered = sourceGroups.filter(group =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.created_by_username.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setDisplayedGroups(filtered);
  }, [activeTab, searchQuery, allGroups, myGroups]);

  const refreshGroups = async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const groupsResponse = await fetch(`${import.meta.env.VITE_API_URL}/study-groups`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (groupsResponse.ok) {
        setAllGroups(await groupsResponse.json());
      }

      const myGroupsResponse = await fetch(`${import.meta.env.VITE_API_URL}/study-groups/me/memberships`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (myGroupsResponse.ok) {
        setMyGroups(await myGroupsResponse.json());
      }
    }
  };

  const handleJoinGroup = async (groupId: number) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('Please sign in to join study groups');
      navigate('/login');
      return;
    }

    setLoadingGroupId(groupId);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/study-groups/${groupId}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        await refreshGroups();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to join group');
      }
    } catch (error) {
      console.error('Error joining group:', error);
      alert('Failed to join group');
    } finally {
      setLoadingGroupId(null);
    }
  };

  const handleLeaveGroup = async (groupId: number) => {
    const token = localStorage.getItem('accessToken');

    setLoadingGroupId(groupId);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/study-groups/${groupId}/leave`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        await refreshGroups();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to leave group');
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      alert('Failed to leave group');
    } finally {
      setLoadingGroupId(null);
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (!window.confirm('Are you sure you want to delete this study group? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    const token = localStorage.getItem('accessToken');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/study-groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await refreshGroups();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Failed to delete group');
    } finally {
      setIsDeleting(false);
      setShowDropdown(null);
    }
  };

  const isInGroup = (groupId: number) => {
    return myGroups.some(g => g.group_id === groupId);
  };

  const isGroupFull = (group: StudyGroup) => {
    if (!group.max_members) return false;
    return parseInt(group.current_members) >= group.max_members;
  };

  const isOwnGroup = (group: StudyGroup) => {
    return currentUsername === group.created_by_username;
  };

  const formatDateTime = (dateTimeString: string | null) => {
    if (!dateTimeString) return null;
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    };
  };

  return (
    <div className="min-h-screen bg-purple-50">
      {/* Main Content */}
      <div className="pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Study Groups</h1>
            <p className="text-gray-600 text-lg">Find or create study groups for your courses</p>
          </div>

          {/* Tabs and Search */}
          <div className="mb-6 space-y-4">
            {/* Tabs */}
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-6 py-2 rounded-full font-semibold transition ${
                  activeTab === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-600'
                }`}
              >
                All Groups ({allGroups.length})
              </button>
              <button
                onClick={() => setActiveTab('my')}
                className={`px-6 py-2 rounded-full font-semibold transition ${
                  activeTab === 'my'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-600'
                }`}
              >
                My Groups ({myGroups.length})
              </button>
            </div>

            {/* Search Bar */}
            <div className="flex space-x-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by course code, group name, or creator..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white cursor-text"
                />
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition cursor-pointer whitespace-nowrap"
              >
                + Create Group
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="text-gray-600 mt-4">Loading study groups...</p>
            </div>
          ) : (
            <>
              {/* Study Groups Grid */}
              {displayedGroups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedGroups.map((group) => {
                    const isMember = isInGroup(group.group_id);
                    const isFull = isGroupFull(group);
                    const isOwner = isOwnGroup(group);
                    const dateTime = formatDateTime(group.date_time);

                    return (
                      <div key={group.group_id} className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition relative">
                        {/* Three dots menu - Top right corner */}
                        <div className="absolute top-3 right-3 z-10" ref={showDropdown === group.group_id ? dropdownRef : null}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDropdown(showDropdown === group.group_id ? null : group.group_id);
                            }}
                            className="bg-white text-black hover:bg-gray-100 p-2 rounded-full text-lg"
                          >
                            ⋮
                          </button>
                          
                          {/* Dropdown overlay */}
                          {showDropdown === group.group_id && (
                            <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 min-w-[150px] z-10">
                              {isOwner ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteGroup(group.group_id);
                                  }}
                                  disabled={isDeleting}
                                  className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 font-semibold text-left"
                                >
                                  {isDeleting ? 'Deleting...' : 'Delete Group'}
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    alert("Group Reported");
                                    setShowDropdown(null);
                                  }}
                                  className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition font-semibold text-left"
                                >
                                  Report Group
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDropdown(null);
                                }}
                                className="w-full px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition mt-1"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Clickable card content */}
                        <button
                          onClick={() => {
                            setShowMembersModal(group.group_id);
                            setSelectedGroupName(group.name);
                          }}
                          className="w-full p-5 text-left cursor-pointer"
                        >
                          {/* Course Code Badge */}
                          <div className="mb-3">
                            <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                              📘 {group.course_code}
                            </span>
                          </div>

                          {/* Group Name */}
                          <h3 className="text-lg font-bold text-gray-900 mb-2 pr-8">{group.name}</h3>

                          {/* Description */}
                          {group.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{group.description}</p>
                          )}

                          {/* Date/Time or Recurring */}
                          {group.is_recurring ? (
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              <span className="mr-2">🔁</span>
                              <span className="font-medium">{group.recurrence_pattern}</span>
                            </div>
                          ) : dateTime ? (
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              <span className="mr-2">📅</span>
                              <span>{dateTime.date} • {dateTime.time}</span>
                            </div>
                          ) : null}

                          {/* Location */}
                          {group.location && (
                            <div className="flex items-center text-sm text-gray-600 mb-3">
                              <span className="mr-2">📍</span>
                              <span className="truncate">{group.location}</span>
                            </div>
                          )}

                          {/* Creator */}
                          <p className="text-xs text-gray-500 mb-3">
                            Created by <span className="font-semibold text-gray-700">{group.created_by_username}</span>
                          </p>

                          {/* Members Count */}
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-gray-600">
                              👥 {group.current_members}
                              {group.max_members ? `/${group.max_members}` : ''} members
                            </span>
                            <span className="text-sm text-purple-600 font-semibold">
                              View Members →
                            </span>
                          </div>
                        </button>

                        {/* Action Button - Outside clickable area */}
                        <div className="px-5 pb-5">
                          {isMember ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLeaveGroup(group.group_id);
                              }}
                              className="w-full bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-600 transition cursor-pointer flex items-center justify-center"
                            >
                              {loadingGroupId === group.group_id ? (
                                <>
                                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Leaving...
                                </>
                              ) : (
                                <>
                                  <span className="mr-2">✓</span>
                                  Member of Group
                                </>
                              )}
                            </button>
                          ) : isFull ? (
                            <button
                              disabled
                              className="w-full bg-gray-300 text-gray-500 py-2 rounded-lg font-semibold cursor-not-allowed"
                            >
                              Full
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJoinGroup(group.group_id);
                              }}
                              disabled={loadingGroupId === group.group_id}
                              className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition cursor-pointer disabled:bg-purple-400 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                              {loadingGroupId === group.group_id ? (
                                <>
                                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Joining...
                                </>
                              ) : (
                                'Join Group'
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
                  <span className="text-6xl mb-4 block">📚</span>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No study groups found</h3>
                  <p className="text-gray-600">
                    {searchQuery ? 'Try adjusting your search' : activeTab === 'my' ? "You haven't joined any groups yet" : 'Be the first to create a study group!'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refreshGroups();
          }}
        />
      )}

      {/* Group Members Modal */}
      {showMembersModal !== null && (
        <GroupMembersModal
          groupId={showMembersModal}
          groupName={selectedGroupName}
          onClose={() => setShowMembersModal(null)}
        />
      )}
    </div>
  );
};

export default StudyGroups;