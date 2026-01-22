// components/NavBar.tsx
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import type { SearchResults } from '../types/search';
import Icon from "../assets/laurier-logo.svg?react";
import { useAuth } from '../context/AuthContext';

const NavBar = () => {
  const navigate = useNavigate();
  
  const { userData, userSignedIn} = useAuth();
  
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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

  // Close mobile menu on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [navigate]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

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
    setIsMobileMenuOpen(false);
  };

  const handleEventClick = (eventId: number) => {
    navigate(`/events/${eventId}`);
    setSearchQuery('');
    setShowSearchDropdown(false);
    setIsMobileMenuOpen(false);
  };

  const handleSignIn = () => {
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    if (path === '/' && window.location.pathname === '/') {
      window.location.reload();
    } else {
      navigate(path);
    }
    setIsMobileMenuOpen(false);
  };

  const hasResults = searchResults.users.length > 0 || searchResults.events.length > 0;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-[#330072]/60 border-b border-purple-300/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <Icon className="h-12 w-10 text-gray-900 transition" />
              <button
                onClick={() => handleNavigation('/')}
                className="text-xl sm:text-2xl font-black text-white hover:text-gray-900 transition-all duration-300 cursor-pointer"
              >
                WLU Connect
              </button>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {/* Navigation buttons */}
              <button
                onClick={() => handleNavigation('/')}
                className="text-white px-4 py-2 rounded-lg font-semibold hover:text-[#330072] transition-colors duration-200 cursor-pointer"
              >
                Home  
              </button>
              <button
                onClick={() => handleNavigation('/events')}
                className="text-white px-4 py-2 rounded-lg font-semibold hover:text-[#330072] transition-colors duration-200 cursor-pointer"
              >
                Club Events
              </button>
              <button
                onClick={() => handleNavigation('/study-groups')}
                className="text-white px-4 py-2 rounded-lg font-semibold hover:text-[#330072] transition-colors duration-200 cursor-pointer"
              >
                Study Groups
              </button>

              {!userSignedIn && (
                <button
                  onClick={handleSignIn}
                  className="text-white px-4 py-2 rounded-lg font-semibold hover:text-[#330072] transition-colors duration-200 cursor-pointer ml-2"
                >
                  Sign In
                </button>
              )}

              {/* Search Bar with Dropdown */}
              <div ref={searchRef} className="relative ml-4">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth="2" 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none z-10"
                  stroke="#374151"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" 
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search users, events..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  className="bg-white backdrop-blur-xl border border-purple-300/50 rounded-full pl-12 pr-4 py-2 w-64 text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 cursor-text font-normal"
                />
              
                {/* Search Results Dropdown */}
                {showSearchDropdown && (
                  <div className="absolute top-full mt-2 w-96 bg-white/90 backdrop-blur-2xl rounded-xl shadow-2xl border border-purple-300/50 max-h-96 overflow-y-auto z-50">
                    {isSearching ? (
                      <div className="p-4 text-center text-gray-600 font-normal">
                        Searching...
                      </div>
                    ) : hasResults ? (
                      <>
                        {/* Users Section */}
                        {searchResults.users.length > 0 && (
                          <div className="p-2">
                            <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase">
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
                                  <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center text-white font-semibold">
                                    {user.username[0].toUpperCase()}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-900 truncate">
                                    {user.username}
                                  </div>
                                  <div className="text-sm text-gray-600 truncate font-normal">
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
                            <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase">
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
                                  <div className="text-sm text-gray-600 truncate font-normal">
                                    {event.club_name} • {new Date(event.event_date).toLocaleDateString()}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-4 text-center text-gray-600 font-normal">
                        No results found
                      </div>
                    )}
                  </div>
                )}
              </div>

              {userSignedIn && userData && (
                <button
                  onClick={() => handleNavigation(`/profile/${userData.username}`)}
                  className="w-9 h-9 rounded-full bg-purple-700 flex items-center justify-center text-white font-semibold overflow-hidden cursor-pointer hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 ml-2"
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

            {/* Mobile Menu Button and Profile */}
            <div className="flex lg:hidden items-center space-x-3">
              {userSignedIn && userData && (
                <button
                  onClick={() => handleNavigation(`/profile/${userData.username}`)}
                  className="w-9 h-9 rounded-full bg-purple-700 flex items-center justify-center text-white font-semibold overflow-hidden cursor-pointer hover:opacity-80 transition-opacity duration-200"
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
              
              {/* Hamburger Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
                aria-label="Toggle menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMobileMenuOpen ? (
                    <path d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Slide-out */}
      <div
        className={`fixed top-16 right-0 bottom-0 w-80 max-w-[85vw] bg-[#330072] z-40 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full p-6 space-y-4 overflow-y-auto">
          {/* Mobile Search */}
          <div ref={searchRef} className="relative mb-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth="2" 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none z-10"
              stroke="#374151"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" 
              />
            </svg>
            <input
              type="text"
              placeholder="Search users, events..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              className="w-full bg-white border border-purple-300/50 rounded-full pl-12 pr-4 py-2 text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 font-normal"
            />
            
            {/* Mobile Search Results Dropdown */}
            {showSearchDropdown && (
              <div className="absolute top-full mt-2 w-full bg-white/95 backdrop-blur-2xl rounded-xl shadow-2xl border border-purple-300/50 max-h-80 overflow-y-auto z-50">
                {isSearching ? (
                  <div className="p-4 text-center text-gray-600 font-normal">
                    Searching...
                  </div>
                ) : hasResults ? (
                  <>
                    {/* Users Section */}
                    {searchResults.users.length > 0 && (
                      <div className="p-2">
                        <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase">
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
                              <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center text-white font-semibold">
                                {user.username[0].toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 truncate">
                                {user.username}
                              </div>
                              <div className="text-sm text-gray-600 truncate font-normal">
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
                        <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase">
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
                              <div className="text-sm text-gray-600 truncate font-normal">
                                {event.club_name} • {new Date(event.event_date).toLocaleDateString()}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 text-center text-gray-600 font-normal">
                    No results found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Navigation Links */}
          <button
            onClick={() => handleNavigation('/')}
            className="text-white text-lg font-semibold py-3 px-4 rounded-lg hover:bg-white/10 transition-colors duration-200 text-left"
          >
            Home
          </button>
          <button
            onClick={() => handleNavigation('/events')}
            className="text-white text-lg font-semibold py-3 px-4 rounded-lg hover:bg-white/10 transition-colors duration-200 text-left"
          >
            Club Events
          </button>
          <button
            onClick={() => handleNavigation('/study-groups')}
            className="text-white text-lg font-semibold py-3 px-4 rounded-lg hover:bg-white/10 transition-colors duration-200 text-left"
          >
            Study Groups
          </button>

          {!userSignedIn && (
            <button
              onClick={handleSignIn}
              className="text-white text-lg font-semibold py-3 px-4 rounded-lg hover:bg-white/10 transition-colors duration-200 text-left mt-4 border-t border-purple-400/30 pt-6"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default NavBar;