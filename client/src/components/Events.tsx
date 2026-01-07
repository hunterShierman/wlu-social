// pages/Events.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Event } from '../types/event';
import EventCard from '../components/EventCard';
import type { User } from '../types/user';

const Events = () => {
  const navigate = useNavigate();
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<User | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);

  const faculties = ['All', 'Science', 'Music', 'Business', 'Arts', 'General'];

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      setIsSignedIn(!!token);

      try {
        // Fetch current user if signed in
        if (token) {
          const userResponse = await fetch('http://localhost:8000/users/me/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (userResponse.ok) {
            const userData = await userResponse.json();
            setUserData(userData);
          }
        }

        // Fetch all events from events table
        const response = await fetch('http://localhost:8000/events/all?limit=100');

        if (response.ok) {
          const events = await response.json();
          setAllEvents(events);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Filter events
  const filteredEvents = allEvents.filter(event => {
    const matchesSearch = event.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFaculty = selectedFaculty === 'All' || event.department === selectedFaculty;
    
    return matchesSearch && matchesFaculty;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/')}
              className="text-2xl font-bold text-purple-800 hover:text-purple-900 transition"
            >
              WLU Connect
            </button>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-700 hover:text-purple-600 font-semibold transition"
              >
                Home
              </button>
              {isSignedIn && userData ? (
                <button
                  onClick={() => navigate(`/profile/${userData.username}`)}
                  className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold overflow-hidden cursor-pointer hover:opacity-80 transition focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {userData?.profile_picture_url ? (
                    <img
                      src={userData.profile_picture_url}
                      alt={userData.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{userData?.username?.[0].toUpperCase() || 'U'}</span>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="bg-purple-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-purple-700 transition"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Upcoming Events</h1>
            <p className="text-gray-600 text-lg">Discover what's happening at WLU</p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            {/* Search Bar */}
            <div className="relative max-w-2xl">
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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

            {/* Faculty Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {faculties.map((faculty) => (
                <button
                  key={faculty}
                  onClick={() => setSelectedFaculty(faculty)}
                  className={`px-4 py-2 rounded-full font-medium transition ${
                    selectedFaculty === faculty
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-600 hover:text-purple-600'
                  }`}
                >
                  {faculty}
                </button>
              ))}
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-600">
              {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} found
            </p>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="text-gray-600 mt-4">Loading events...</p>
            </div>
          ) : (
            <>
              {/* Events Grid */}
              {filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
                  <span className="text-6xl mb-4 block">📅</span>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
                  <p className="text-gray-600">
                    {searchQuery || selectedFaculty !== 'All'
                      ? 'Try adjusting your search or filters'
                      : 'Check back soon for upcoming events!'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Events;