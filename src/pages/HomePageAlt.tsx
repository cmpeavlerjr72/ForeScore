import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ForeScoreLogo from '../assets/ForeScore.png';

const SOCKET_URL = 'https://forescore-db.onrender.com';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register state
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerHandicap, setRegisterHandicap] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const [error, setError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${SOCKET_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });

      if (!response.ok) throw new Error('Invalid login');

      const data = await response.json();
      console.log('Login success:', data);
      // ✅ Store username in localStorage for use in Profile.tsx
      localStorage.setItem('username', loginUsername);
      
      navigate('/profile');
    } catch (err: any) {
      console.error('Login failed:', err.message);
      setError('Login failed. Please check credentials.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${SOCKET_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: registerUsername,
          password: registerPassword,
          name: registerName,
          handicap: parseFloat(registerHandicap),
        }),
      });

      if (!response.ok) throw new Error('Registration failed');

      const data = await response.json();
      console.log('Registration success:', data);
      
      localStorage.setItem('username',registerUsername)

      setShowRegisterModal(false);
      navigate('/profile');
    } catch (err: any) {
      console.error('Registration failed:', err.message);
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfdfb] flex flex-col">
      <Header title="ForeScore" showNav={false} />
      <main className="flex-grow container mx-auto flex flex-col items-center justify-center px-4 py-10 text-center">
        <img src={ForeScoreLogo} alt="ForeScore Logo" className="w-64 h-64 md:w-80 md:h-80" />
        <p className="text-lg text-gray-700 mb-6">Your Ultimate Golf Trip Scorekeeper</p>

        {/* Login Form */}
        <div className="space-y-4 w-full max-w-sm">
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              className="w-full border rounded p-2"
            />
            <div>
              <input
                type={showLoginPassword ? 'text' : 'password'}
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full border rounded p-2"
              />
              <label className="text-sm flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  checked={showLoginPassword}
                  onChange={() => setShowLoginPassword((prev) => !prev)}
                />
                Show Password
              </label>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              Log In
            </button>
          </form>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="w-full bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
          >
            Register
          </button>
        </div>

        {error && <p className="text-red-500 mt-4 font-medium">{error}</p>}

        <p className="max-w-xl mt-10 text-gray-600 text-sm">
          Keep score on your golf outings with team-based match play and stroke play formats.
          Create teams, enter scores, and track your progress easily.
        </p>
      </main>

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Register New User</h3>
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={registerUsername}
                onChange={(e) => setRegisterUsername(e.target.value)}
                className="w-full border rounded p-2"
              />
              <input
                type="text"
                placeholder="Name"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                className="w-full border rounded p-2"
              />
              <input
                type="number"
                placeholder="Handicap"
                value={registerHandicap}
                onChange={(e) => setRegisterHandicap(e.target.value)}
                className="w-full border rounded p-2"
              />
              <div>
                <input
                  type={showRegisterPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="w-full border rounded p-2"
                />
                <label className="text-sm flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    checked={showRegisterPassword}
                    onChange={() => setShowRegisterPassword((prev) => !prev)}
                  />
                  Show Password
                </label>
              </div>
              <div className="flex justify-between mt-4">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default HomePage;
