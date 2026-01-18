// context/AuthContext.tsx
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/user';

interface AuthContextType {
  userData: User | null;
  isLoading: boolean;
  userSignedIn: boolean;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userSignedIn, setUserSignedIn] = useState(() => {
    return Boolean(localStorage.getItem('accessToken'));
  });

  const fetchUserInfo = async () => {
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      console.log('No access token found');
      setIsLoading(false);
      setUserSignedIn(false);
      setUserData(null);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/me/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch user info:', response.status);
        
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setUserSignedIn(false);
          setUserData(null);
        }
        setIsLoading(false);
        return;
      }

      const userData = await response.json();
      setUserData(userData);
      setUserSignedIn(true);
      
    } catch (error) {
      console.error('Error fetching user info:', error);
      setUserSignedIn(false);
      setUserData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUserData(null);
    setUserSignedIn(false);
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      userData, 
      isLoading, 
      userSignedIn, 
      refreshUser: fetchUserInfo,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};