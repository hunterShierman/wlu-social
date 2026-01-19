// components/CreateGroupModal.tsx
import { useState } from 'react';

interface CreateGroupModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateGroupModal = ({ onClose, onSuccess }: CreateGroupModalProps) => {
  const [name, setName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [description, setDescription] = useState('');
  const [maxMembers, setMaxMembers] = useState('10');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validate
    if (isRecurring && !recurrencePattern) {
      setError('Please specify a recurrence pattern');
      setIsSubmitting(false);
      return;
    }

    const token = localStorage.getItem('accessToken');

    // Combine date and time if provided
    let dateTime = null;
    if (date && time) {
      dateTime = `${date}T${time}:00`;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/study-groups`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          course_code: courseCode,
          description: description || null,
          max_members: maxMembers ? parseInt(maxMembers) : null,
          date_time: dateTime,
          location: location || null,
          is_recurring: isRecurring,
          recurrence_pattern: isRecurring ? recurrencePattern : null,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      setError('Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Study Group</h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Course Code */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Course Code *
            </label>
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
              placeholder="e.g., CP363, BU111"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-text"
            />
          </div>

          {/* Group Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Midterm 2 Study Session"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-text"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will this group focus on?"
              rows={3}
              maxLength={100}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none cursor-text"
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/100 characters</p>
          </div>

          {/* Recurring Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isRecurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
            />
            <label htmlFor="isRecurring" className="text-sm font-semibold text-gray-700 cursor-pointer">
              This is a recurring study group
            </label>
          </div>

          {/* Conditional: Recurring Pattern */}
          {isRecurring ? (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Recurrence Pattern *
              </label>
              <input
                type="text"
                value={recurrencePattern}
                onChange={(e) => setRecurrencePattern(e.target.value)}
                placeholder="e.g., Every Monday 6:00 PM, Weekly"
                required={isRecurring}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-text"
              />
              <p className="text-xs text-gray-500 mt-1">Examples: "Every Tuesday", "Weekly", "Every Monday 6:00 PM"</p>
            </div>
          ) : (
            <>
              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  />
                </div>
              </div>
            </>
          )}

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Library Room 301, Zoom link"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-text"
            />
          </div>

          {/* Max Members */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Max Members
            </label>
            <input
              type="number"
              value={maxMembers}
              onChange={(e) => setMaxMembers(e.target.value)}
              min="2"
              max="50"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-text"
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-purple-800 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;