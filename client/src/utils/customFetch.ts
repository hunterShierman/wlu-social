/**
 * Makes an authenticated fetch request with automatic token refresh on 401
 */
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    throw new Error('No access token available');
  }

  // Add Authorization header to request
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${accessToken}`,
  };

  // Make initial request
  let response = await fetch(url, { ...options, headers });

  // If 401 (Unauthorized), try refreshing the token
  if (response.status === 401) {
    console.log('⏰ Access token expired, attempting to refresh...');
    
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      // No refresh token - redirect to login
      localStorage.clear();
      window.location.href = '/login';
      throw new Error('Session expired - please log in again');
    }

    try {
      // Call your /auth/token endpoint
      const refreshResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: refreshToken }),
        }
      );

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        const newAccessToken = data.accessToken;
        
        // Save new token
        localStorage.setItem('accessToken', newAccessToken);
        console.log('✅ Token refreshed, retrying original request');

        // Retry original request with new token
        const newHeaders = {
          ...options.headers,
          'Authorization': `Bearer ${newAccessToken}`,
        };
        response = await fetch(url, { ...options, headers: newHeaders });
      } else {
        // Refresh failed - logout
        console.error('❌ Token refresh failed');
        localStorage.clear();
        window.location.href = '/login';
        throw new Error('Session expired - please log in again');
      }
    } catch (error) {
      // Network error or refresh failed
      console.error('Error refreshing token:', error);
      localStorage.clear();
      window.location.href = '/login';
      throw error;
    }
  }

  return response;
};