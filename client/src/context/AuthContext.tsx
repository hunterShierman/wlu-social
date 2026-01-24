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
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  refreshAccessToken: () => Promise<string | null>;
}

interface LoginResult {
  success: boolean;
  error?: string;
  needsVerification?: boolean;
  email?: string;
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

   // Login function
  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle verification needed case
        if (data.needsVerification) {
          return {
            success: false,
            error: data.error,
            needsVerification: true,
            email: data.email,
          };
        }
        
        return {
          success: false,
          error: data.error || 'Login failed',
        };
      }

      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      console.log('User signed in');

      // Fetch and set user data
      await fetchUserInfo();

      return { success: true };
      
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Failed to connect to server',
      };
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

   // Function to refresh access token using refresh token
  const refreshAccessToken = async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      console.log('No refresh token available');
      return null;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        const newAccessToken = data.accessToken;
        
        // Store new access token
        localStorage.setItem('accessToken', newAccessToken);
        console.log('Access token refreshed successfully');
        
        return newAccessToken;
      } else {
        console.error('Failed to refresh token:', response.status);
        // Refresh token is invalid or expired - logout user
        logout();
        return null;
      }
    } catch (error) {
      console.error('Error refreshing access token:', error);
      logout();
      return null;
    }
  };


  return (
    <AuthContext.Provider value={{ 
      userData, 
      isLoading, 
      userSignedIn, 
      refreshUser: fetchUserInfo,
      logout,
      login,
      refreshAccessToken
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