// pages/StudyGroups.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';

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

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken')

      try {
        // Fetch all study groups
        const groupsResponse = await fetch('http://localhost:8000/study-groups');
        if (groupsResponse.ok) {
        const groups = await groupsResponse.json();
        setAllGroups(groups);
        setDisplayedGroups(groups);
        }

        // Fetch my groups
        const myGroupsResponse = await fetch('http://localhost:8000/study-groups/me/memberships', {
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
      const groupsResponse = await fetch('http://localhost:8000/study-groups', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (groupsResponse.ok) {
        setAllGroups(await groupsResponse.json());
      }

      const myGroupsResponse = await fetch('http://localhost:8000/study-groups/me/memberships', {
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

    try {
      const response = await fetch(`http://localhost:8000/study-groups/${groupId}/join`, {
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
    }
  };

  const handleLeaveGroup = async (groupId: number) => {
    const token = localStorage.getItem('accessToken');

    try {
      const response = await fetch(`http://localhost:8000/study-groups/${groupId}/leave`, {
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
    }
  };

  const isInGroup = (groupId: number) => {
    return myGroups.some(g => g.group_id === groupId);
  };

  const isGroupFull = (group: StudyGroup) => {
    if (!group.max_members) return false;
    return parseInt(group.current_members) >= group.max_members;
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
      {/* Navigation Bar */}
      <NavBar />

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
                    const dateTime = formatDateTime(group.date_time);

                    return (
                      <div key={group.group_id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition">
                        {/* Course Code Badge */}
                        <div className="mb-3">
                          <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                            📘 {group.course_code}
                          </span>
                        </div>

                        {/* Group Name */}
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{group.name}</h3>

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
                        </div>

                        {/* Action Button */}
                        {isMember ? (
                          <button
                            onClick={() => handleLeaveGroup(group.group_id)}
                            className="w-full bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-600 transition cursor-pointer border-2flex items-center justify-center"
                          >
                            <span className="mr-2">✓</span>
                            Member of Group
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
                            onClick={() => handleJoinGroup(group.group_id)}
                            className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition cursor-pointer"
                          >
                            Join Group
                          </button>
                        )}
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
    </div>
  );
};

// Create Group Modal Component
interface CreateGroupModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateGroupModal = ({ onClose, onSuccess }: CreateGroupModalProps) => {
  const [name, setName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [description, setDescription] = useState('');
  const [maxMembers, setMaxMembers] = useState('10');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validate
    if (isRecurring && !recurrencePattern) {
      setError('Please specify a recurrence pattern');
      setIsSubmitting(false);
      return;
    }

    const token = localStorage.getItem('accessToken');

    // Combine date and time if provided
    let dateTime = null;
    if (date && time) {
      dateTime = `${date}T${time}:00`;
    }

    try {
      const response = await fetch('http://localhost:8000/study-groups', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          course_code: courseCode,
          description: description || null,
          max_members: maxMembers ? parseInt(maxMembers) : null,
          date_time: dateTime,
          location: location || null,
          is_recurring: isRecurring,
          recurrence_pattern: isRecurring ? recurrencePattern : null,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      setError('Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Study Group</h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Course Code */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Course Code *
            </label>
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
              placeholder="e.g., CP363, BU111"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-text"
            />
          </div>

          {/* Group Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Midterm 2 Study Session"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-text"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will this group focus on?"
              rows={3}
              maxLength={40}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none cursor-text"
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/100 characters</p>
          </div>

          {/* Recurring Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isRecurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
            />
            <label htmlFor="isRecurring" className="text-sm font-semibold text-gray-700 cursor-pointer">
              This is a recurring study group
            </label>
          </div>

          {/* Conditional: Recurring Pattern */}
          {isRecurring ? (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Recurrence Pattern *
              </label>
              <input
                type="text"
                value={recurrencePattern}
                onChange={(e) => setRecurrencePattern(e.target.value)}
                placeholder="e.g., Every Monday 6:00 PM, Weekly"
                required={isRecurring}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-text"
              />
              <p className="text-xs text-gray-500 mt-1">Examples: "Every Tuesday", "Weekly", "Every Monday 6:00 PM"</p>
            </div>
          ) : (
            <>
              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  />
                </div>
              </div>
            </>
          )}

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Library Room 301, Zoom link"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-text"
            />
          </div>

          {/* Max Members */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Max Members
            </label>
            <input
              type="number"
              value={maxMembers}
              onChange={(e) => setMaxMembers(e.target.value)}
              min="2"
              max="50"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-text"
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudyGroups;