// components/NavBar.tsx
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import type { SearchResults } from '../types/search';
import Icon from "../assets/laurier-logo.svg?react";
import { useAuth } from '../context/AuthContext';

const NavBar = () => {
  const navigate = useNavigate();
  
  const { userData, userSignedIn} = useAuth();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults>({ users: [], events: [] });
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery);
      } else {
        setSearchResults({ users: [], events: [] });
        setShowSearchDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/search/all?q=${encodeURIComponent(query)}`
      );
      
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
        setShowSearchDropdown(true);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleUserClick = (username: string) => {
    navigate(`/profile/${username}`);
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  const handleEventClick = (eventId: number) => {
    navigate(`/events/${eventId}`);
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  const hasResults = searchResults.users.length > 0 || searchResults.events.length > 0;

return (
  <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-purple-300/60 border-b border-purple-300/50">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center justify-between h-16">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <Icon className="h-12 w-10 text-gray-900 transition" />
          <button
            onClick={() => navigate('/')}
            className="text-2xl font-bold text-gray-800 hover:text-gray-900 transition-all duration-300 cursor-pointer"
          >
            WLU Connect
          </button>
        </div>
        
        <div className="flex items-center space-x-1">
          {/* Navigation buttons - Text only, no background */}
          <button
            onClick={() => navigate('/')}
            className="text-gray-800 px-4 py-2 rounded-lg font-medium hover:text-gray-900 transition-colors duration-200 cursor-pointer"
          >
            Home
          </button>
          <button
            onClick={() => navigate('/events')}
            className="text-gray-800 px-4 py-2 rounded-lg font-medium hover:text-gray-900 transition-colors duration-200 cursor-pointer"
          >
            Club Events
          </button>
          <button
            onClick={() => navigate('/study-groups')}
            className="text-gray-800 px-4 py-2 rounded-lg font-medium hover:text-gray-900 transition-colors duration-200 cursor-pointer"
          >
            Study Groups
          </button>

          {!userSignedIn && (
            <button
              onClick={handleSignIn}
              className="text-gray-800 px-4 py-2 rounded-lg font-medium hover:text-gray-900 transition-colors duration-200 cursor-pointer ml-2"
            >
              Sign In
            </button>
          )}

          {/* Search Bar with Dropdown */}
          <div ref={searchRef} className="relative ml-4">
            <input
              type="text"
              placeholder="Search users, events..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              className="bg-white backdrop-blur-xl border border-purple-300/50 rounded-full px-4 py-2 w-64 text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 cursor-text"
            />
            
            {/* Search Results Dropdown */}
            {showSearchDropdown && (
              <div className="absolute top-full mt-2 w-96 bg-white/90 backdrop-blur-2xl rounded-xl shadow-2xl border border-purple-300/50 max-h-96 overflow-y-auto z-50">
                {isSearching ? (
                  <div className="p-4 text-center text-gray-600">
                    Searching...
                  </div>
                ) : hasResults ? (
                  <>
                    {/* Users Section */}
                    {searchResults.users.length > 0 && (
                      <div className="p-2">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                          People
                        </div>
                        {searchResults.users.map((user) => (
                          <button
                            key={user.username}
                            onClick={() => handleUserClick(user.username)}
                            className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-purple-100/50 rounded-lg transition cursor-pointer text-left"
                          >
                            {user.profile_picture_url ? (
                              <img
                                src={user.profile_picture_url}
                                alt={user.username}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                                {user.username[0].toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 truncate">
                                {user.username}
                              </div>
                              <div className="text-sm text-gray-600 truncate">
                                {user.program || 'Student'}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Events Section */}
                    {searchResults.events.length > 0 && (
                      <div className="p-2 border-t border-purple-200/50">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                          Events
                        </div>
                        {searchResults.events.map((event) => (
                          <button
                            key={event.id}
                            onClick={() => handleEventClick(event.id)}
                            className="w-full flex items-start space-x-3 px-3 py-2 hover:bg-purple-100/50 rounded-lg transition cursor-pointer text-left"
                          >
                            {event.image_url ? (
                              <img 
                                src={event.image_url}
                                alt={event.content}
                                className="w-10 h-10 rounded object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-purple-100 flex items-center justify-center text-purple-600 text-2xl shrink-0">
                                📅
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 truncate">
                                {event.content}
                              </div>
                              <div className="text-sm text-gray-600 truncate">
                                {event.club_name} • {new Date(event.event_date).toLocaleDateString()}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 text-center text-gray-600">
                    No results found
                  </div>
                )}
              </div>
            )}
          </div>

          {userSignedIn && userData && (
            <button
              onClick={() => navigate(`/profile/${userData.username}`)}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold overflow-hidden cursor-pointer hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 ml-2"
            >
              {userData.profile_picture_url ? (
                <img
                  src={userData.profile_picture_url}
                  alt={userData.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{userData.username[0].toUpperCase()}</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  </nav>
);
};

export default NavBar;