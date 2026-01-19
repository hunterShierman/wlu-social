// components/EventCard.tsx
import { useNavigate } from 'react-router-dom';
import type { Event } from '../types/event';

interface EventCardProps {
  event: Event;
  isRegistered?: boolean;  // Add this
}

const EventCard = ({ event, isRegistered = false }: EventCardProps) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return { month, day, time };
  };

  const { month, day, time } = formatDate(event.event_date || event.created_at);

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

  const faculty = getFacultyInfo(event.department);

return (
  <div 
    onClick={() => navigate(`/events/${event.id}`)}
    className="bg-white/40 backdrop-blur-xl rounded-lg border border-[#330072]/20 overflow-hidden hover:border-[#330072]/50 hover:shadow-lg transition cursor-pointer relative"
  >
    {/* Registration Badge - Top Right */}
    {isRegistered && (
      <div className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 z-10 shadow-lg">
        <span>✓</span>
        <span>Registered</span>
      </div>
    )}

    {/* Event Image */}
    {event.image_url ? (
      <div className="w-full h-48 bg-gray-200 overflow-hidden">
        <img 
          src={event.image_url} 
          alt="Event" 
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
    ) : (
      <div className="w-full h-48 bg-gradient-to-br from-[#330072] to-[#924DA7] flex items-center justify-center">
        <span className="text-6xl">{faculty.emoji}</span>
      </div>
    )}

    {/* Event Info */}
    <div className="p-4">
      {/* Date Badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-800 text-white rounded-lg p-1 text-center min-w-[60px]">
            <div className="text-xs font-semibold uppercase">{month}</div>
            <div className="text-l font-bold">{day}</div>
          </div>
          <div>
            <div className="text-sm text-gray-700 font-normal">{time}</div>
            <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold ${faculty.color} mt-1`}>
              <span>{faculty.emoji}</span>
              <span>{faculty.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Event Title */}
      <h3 className="font-bold text-lg text-[#330072] mb-2 line-clamp-2 transition">
        {event.content.length > 80 ? `${event.content.substring(0, 80)}...` : event.content}
      </h3>

      {/* Host Info */}
      <div className="flex items-center space-x-2 mb-4 transition">
        <div className="w-6 h-6 rounded-full bg-gray-300 overflow-hidden">
          {event.profile_picture_url ? (
            <img 
              src={event.profile_picture_url} 
              alt={event.club_name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-black">
              {event.club_name[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="text-sm text-gray-700 font-normal">
          Hosted by <span className="font-semibold text-[#330072]">{event.club_name}</span>
        </div>
      </div>

      {/* Action Button */}
      <button 
        onClick={() => navigate(`/events/${event.id}`)}
        className="w-full cursor-pointer py-2 rounded-lg font-semibold transition bg-purple-800 text-white hover:bg-[#F2A900]"
      >
        View Details
      </button>
    </div>
  </div>
);

};

export default EventCard;