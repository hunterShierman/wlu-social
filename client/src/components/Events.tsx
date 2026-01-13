// pages/Events.tsx
import { useState, useEffect } from 'react';
import type { Event } from '../types/event';
import EventCard from '../components/EventCard';

const Events = () => {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [displayedEvents, setDisplayedEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentLimit, setCurrentLimit] = useState(8);

  const faculties = ['All', 'Science', 'Music', 'Business', 'Arts', 'General'];

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        // Fetch all events from events table
        const response = await fetch('${import.meta.env.VITE_API_URL}/events/all?limit=100');

        if (response.ok) {
          const events = await response.json();
          setAllEvents(events);
          setDisplayedEvents(events.slice(0, 8)); // Show first 10
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Update displayed events when filters change
  useEffect(() => {
    const filtered = allEvents.filter(event => {
      const matchesSearch = event.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           event.username.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFaculty = selectedFaculty === 'All' || event.department === selectedFaculty;
      
      return matchesSearch && matchesFaculty;
    });

    setDisplayedEvents(filtered.slice(0, currentLimit));
  }, [searchQuery, selectedFaculty, allEvents, currentLimit]);

  const loadMoreEvents = () => {
    setIsLoadingMore(true);
    
    // Simulate a slight delay for better UX
    setTimeout(() => {
      setCurrentLimit(prev => prev + 8);
      setIsLoadingMore(false);
    }, 300);
  };

  // Filter events based on current search and faculty
  const filteredEvents = allEvents.filter(event => {
    const matchesSearch = event.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFaculty = selectedFaculty === 'All' || event.department === selectedFaculty;
    
    return matchesSearch && matchesFaculty;
  });

  const hasMore = displayedEvents.length < filteredEvents.length;
  const remainingCount = filteredEvents.length - displayedEvents.length;

  return (
    <div className="min-h-screen bg-purple-50">
      {/* Navigation Bar */}

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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentLimit(8); // Reset to 10 when searching
                }}
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
                  onClick={() => {
                    setSelectedFaculty(faculty);
                    setCurrentLimit(8); // Reset to 10 when filtering
                  }}
                  className={`px-4 py-2 rounded-full font-medium transition ${
                    selectedFaculty === faculty
                      ? 'bg-purple-500 text-white cursor-pointer'
                      : 'bg-white text-gray-700 border cursor-pointer border-gray-300 hover:border-purple-600 hover:text-purple-600'
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
              Showing {displayedEvents.length} of {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
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
              {displayedEvents.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayedEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>

                  {/* Load More Button */}
                  {hasMore && (
                    <div className="mt-8 text-center">
                      <button
                        onClick={loadMoreEvents}
                        disabled={isLoadingMore}
                        className="bg-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {isLoadingMore ? 'Loading...' : `Load More Events (${remainingCount} remaining)`}
                      </button>
                    </div>
                  )}
                </>
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