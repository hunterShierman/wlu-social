// client/src/pages/ResendVerification.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ResendVerification = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/resend-verification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setEmail(''); // Clear form
      } else {
        setError(data.error || 'Failed to resend verification email');
      }
    } catch (err) {
      console.error('Resend error:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <button
          onClick={() => navigate('/login')}
          className="mb-4 text-purple-600 hover:text-purple-700 flex items-center space-x-1 font-semibold cursor-pointer"
        >
          <span>←</span>
          <span>Back to Login</span>
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">📧</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Resend Verification Email
            </h1>
            <p className="text-gray-600">
              Enter your email to receive a new verification link
            </p>
          </div>

          {/* Success Message */}
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              <p>{message}</p>
              <p className="text-sm mt-2">
                Check your inbox and spam folder.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleResend}>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="your.email@mylaurier.ca"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <button
              onClick={() => navigate('/login')}
              className="text-white hover:underline block w-full"
            >
              Already verified? Sign in
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="text-gray-600 hover:underline block w-full"
            >
              Don't have an account? Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResendVerification;