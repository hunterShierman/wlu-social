// pages/EventInfo.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Event } from '../types/event';

const EventInfo = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistrationLoading, setIsRegistrationLoading] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      setIsLoading(true);
      setError('');
      const token = localStorage.getItem('accessToken');

      try {
        // Fetch event details
        const response = await fetch(`http://localhost:8000/events/${eventId}`);

        if (response.ok) {
          const eventData = await response.json();
          setEvent(eventData);
        } else {
          setError('Event not found');
        }

        // Check registration status if signed in
        if (token) {
          const statusResponse = await fetch(
            `http://localhost:8000/events/${eventId}/register/status`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            setIsRegistered(statusData.isRegistered);
          }
        }

      } catch (error) {
        console.error('Error fetching event:', error);
        setError('Failed to load event');
      } finally {
        setIsLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const handleRegistrationToggle = async () => {
    const token = localStorage.getItem('accessToken');

    // Check if user is signed in
    if (!token) {
      alert('Please sign in to register for events');
      navigate('/login');
      return;
    }

    setIsRegistrationLoading(true);

    try {
      if (isRegistered) {
        // Unregister
        const response = await fetch(
          `http://localhost:8000/events/${eventId}/register`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          setIsRegistered(false);
        } else {
          const errorData = await response.json();
          alert(errorData.error || 'Failed to unregister');
        }
      } else {
        // Register
        const response = await fetch(
          `http://localhost:8000/events/${eventId}/register`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          setIsRegistered(true);
        } else {
          const errorData = await response.json();
          alert(errorData.error || 'Failed to register');
        }
      }
    } catch (error) {
      console.error('Error toggling registration:', error);
      alert('Failed to update registration');
    } finally {
      setIsRegistrationLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      fullDate: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      }),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      day: date.getDate()
    };
  };

  const getFacultyInfo = (department: string) => {
    switch(department) {
      case 'Science':
        return { emoji: '🔬', name: 'Science', color: 'bg-blue-100 text-blue-700' };
      case 'Music':
        return { emoji: '🎵', name: 'Music', color: 'bg-purple-100 text-purple-700' };
      case 'Business':
        return { emoji: '💼', name: 'Business', color: 'bg-green-100 text-green-700' };
      case 'Arts':
        return { emoji: '🎨', name: 'Arts', color: 'bg-pink-100 text-pink-700' };
      default:
        return { emoji: '📢', name: 'General', color: 'bg-gray-100 text-gray-700' };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-purple-50">
        {/* Navigation Bar */}

        <div className="pt-24 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="text-gray-600 mt-4">Loading event...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-purple-50">
        {/* Navigation Bar */}

        <div className="pt-24 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{error || 'Event not found'}</h2>
            <button
              onClick={() => navigate('/events')}
              className="text-purple-600 hover:underline"
            >
              Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  const dateInfo = formatDate(event.event_date || event.created_at);
  const faculty = getFacultyInfo(event.department);

return (
    <div className="min-h-screen bg-purple-50">
      {/* Navigation Bar */}

      {/* Main Content */}
      <div className="pt-20 pb-12">
        <div className="max-w-3xl mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => navigate('/events')}
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-semibold mb-4"
          >
            <span>←</span>
            <span>Back to Club Events</span>
          </button>

          {/* Event Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Event Image */}
            {event.image_url ? (
              <div className="w-full h-64 bg-gray-200 overflow-hidden">
                <img 
                  src={event.image_url} 
                  alt="Event" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-64 bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                <span className="text-8xl">{faculty.emoji}</span>
              </div>
            )}

            {/* Event Content */}
            <div className="p-6">
              {/* Department Badge */}
              <div className="mb-4">
                <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${faculty.color}`}>
                  <span>{faculty.emoji}</span>
                  <span>{faculty.name}</span>
                </span>
              </div>

              {/* Event Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {event.content.split('.')[0]}
              </h1>

              {/* Event Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Date & Time */}
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="bg-purple-600 text-white rounded-lg p-2 text-center min-w-[60px]">
                      <div className="text-xs font-semibold uppercase">{dateInfo.month}</div>
                      <div className="text-2xl font-bold">{dateInfo.day}</div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Date & Time</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {dateInfo.fullDate}
                    </p>
                    <p className="text-sm text-gray-600">
                      {dateInfo.time}
                    </p>
                  </div>
                </div>

                {/* Location */}
                {event.location && (
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase">Location</p>
                      <p className="text-sm text-gray-900">{event.location}</p>
                    </div>
                  </div>
                )}

                {/* Host Info */}
                <div className="flex items-start space-x-3">
                  <span className="text-2xl"></span>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Hosted by</p>
                    <div 
                      onClick={() => navigate(`/profile/${event.club_name}`)}
                      className="flex items-center space-x-2 mt-1 cursor-pointer hover:opacity-70 transition"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden">
                        {event.profile_picture_url ? (
                          <img 
                            src={event.profile_picture_url} 
                            alt={event.club_name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-gray-700">
                            {event.club_name[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-purple-600 font-semibold hover:underline">
                        {event.club_name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">About this event</h2>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {event.content}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={handleRegistrationToggle}
                  disabled={isRegistrationLoading}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    isRegistered 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  } ${isRegistrationLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isRegistrationLoading 
                    ? 'Loading...' 
                    : isRegistered 
                      ? '✓ Registered' 
                      : "I'm Interested"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventInfo;