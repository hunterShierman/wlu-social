// components/NavBar.tsx
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { User } from '../types/user';
import Icon from "../assets/laurier-logo.svg?react";

const NavBar = () => {
  const navigate = useNavigate();
  const [userSignedIn, setUserSignedIn] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('accessToken');
      setUserSignedIn(!!token);

      if (token) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/users/me/profile`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (response.ok) {
            setUserData(await response.json());
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUserSignedIn(false);
    navigate('/login');
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  return (
    <nav className="bg-purple-300 shadow-md fixed top-0 left-0 right-0 z-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
                <Icon
                    className="h-12 w-10 mt-3 mr-3 text-white transition"
                />
                <button
                onClick={() => navigate('/')}
                className="text-2xl font-bold text-purple-800 hover:text-white transition cursor-pointer"
                >
                WLU Connect
                </button>
            </div>
          <div className="flex items-center space-x-4">
            {/* Always show all navigation buttons */}
            <button
              onClick={() => navigate('/')}
              className="bg-purple-400 text-white px-4 py-2 rounded-full font-semibold hover:bg-purple-500 transition cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => navigate('/events')}
              className="bg-purple-400 text-white px-4 py-2 rounded-full font-semibold hover:bg-purple-500 transition cursor-pointer"
            >
              Club Events
            </button>
            <button
              onClick={() => navigate('/study-groups')}
              className="bg-purple-400 text-white px-4 py-2 rounded-full font-semibold hover:bg-purple-500 transition cursor-pointer"
            >
              Study Groups
            </button>

            {userSignedIn ? (
              <>
                <button
                  onClick={handleLogout}
                  className="bg-purple-400 text-white px-4 py-2 rounded-full font-semibold hover:bg-purple-500 transition cursor-pointer"
                >
                  Logout
                </button>

                <input
                  type="text"
                  placeholder="Search"
                  className="bg-white rounded-full px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-text"
                />

                <button
                  onClick={() => navigate(`/profile/${userData?.username}`)}
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
              </>
            ) : (
              <>
                <button
                  onClick={handleSignIn}
                  className="bg-purple-400 text-white px-4 py-2 rounded-full font-semibold hover:bg-purple-500 transition cursor-pointer"
                >
                  Sign In
                </button>
                <input
                  type="text"
                  placeholder="Search"
                  className="bg-white rounded-full px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-text"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;