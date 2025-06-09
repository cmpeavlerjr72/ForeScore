import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventConfig } from '../App';
import { saveConfig, loadConfig, generateTripId } from '../utils/storage';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { GolfCourse, golfCourses } from '../types/GolfCourse';

interface HomePageProps {
  config: EventConfig;
  setConfig: React.Dispatch<React.SetStateAction<EventConfig>>;
}

function HomePage({ config, setConfig }: HomePageProps) {
  const navigate = useNavigate();
  const [tripIdInput, setTripIdInput] = useState('');
  const [pin, setPin] = useState('');
  const [isLeader, setIsLeader] = useState(false);
  const [error, setError] = useState('');
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showLineupModal, setShowLineupModal] = useState(false);

  const [tempConfig, setTempConfig] = useState<EventConfig>(() => {
    const numTeams = 2;
    const playersPerTeam = 4;
    const numRounds = 3;
    const teams = Array.from({ length: numTeams }, (_, teamIndex) => ({
      name: `Team ${teamIndex + 1}`,
      players: Array.from({ length: playersPerTeam }, (_, playerIndex) => ({
        name: `Player ${playerIndex + 1}`,
        scores: Array(numRounds).fill(0),
        lineupOrder: Array(numRounds).fill(playerIndex),
      })),
    }));
    return {
      tripId: '',
      numTeams,
      playersPerTeam,
      numRounds,
      scoringMethods: Array(numRounds).fill('match'),
      courses: Array(numRounds).fill('True Blue'),
      teams,
    };
  });

  useEffect(() => {
    if (tripIdInput) {
      const savedConfig = loadConfig(tripIdInput);
      if (savedConfig) {
        setConfig(savedConfig);
        navigate('/dashboard');
        setError('');
      } else {
        setError('No trip found with this ID');
      }
    }
  }, [tripIdInput, setConfig, navigate]);

  const handleTripIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tripIdInput) {
      setConfig((prev) => ({ ...prev, tripId: tripIdInput }));
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') {
      setIsLeader(true);
      setError('');
    } else {
      setError('Invalid PIN');
    }
  };

  const handleCreateNewTrip = () => {
    const newTripId = generateTripId();
    setTempConfig((prev) => ({ ...prev, tripId: newTripId }));
    setShowSetupModal(true);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#fdfdfb] flex flex-col">
      {/* Header */}
      <header className="w-full bg-[#0f172a] text-white py-4 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center">
            <span className="text-[#0f172a] font-bold text-sm">FS</span>
          </div>
          <span className="text-xl font-semibold">ForeScore</span>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-grow container mx-auto flex flex-col items-center justify-center px-4 py-10 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-[#0f172a] mb-3">ForeScore</h1>
        <p className="text-lg text-gray-700 mb-6">Your Ultimate Golf Trip Scorekeeper</p>

        {!config.tripId ? (
          <div className="space-y-4 w-full max-w-md">
            <form onSubmit={handleTripIdSubmit} className="flex gap-2">
              <input
                type="text"
                value={tripIdInput}
                onChange={(e) => setTripIdInput(e.target.value)}
                className="flex-grow rounded-md border border-gray-300 p-2"
                placeholder="Enter Trip ID"
              />
              <button type="submit" className="bg-[#facc15] text-[#0f172a] px-4 py-2 rounded-lg font-semibold">
                Load Trip
              </button>
            </form>
            <button
              onClick={handleCreateNewTrip}
              className="bg-[#facc15] hover:bg-[#eab308] text-[#0f172a] font-semibold py-3 px-6 rounded-lg shadow-md transition duration-200 w-full"
            >
              Create New Trip
            </button>
          </div>
        ) : (
          <div className="bg-white shadow-lg p-6 rounded-lg max-w-xl w-full mt-6">
            <p className="mb-4 text-gray-800 font-semibold">Trip ID: {config.tripId}</p>
            {!isLeader ? (
              <form onSubmit={handlePinSubmit} className="space-y-2">
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2"
                  placeholder="Enter Leader PIN"
                />
                <button type="submit" className="w-full bg-[#0f172a] text-white py-2 rounded-md">
                  Verify PIN
                </button>
              </form>
            ) : (
              <div>
                <p className="text-green-600 font-medium">You are the trip leader.</p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="mt-4 bg-[#0f172a] text-white px-6 py-2 rounded-md hover:bg-[#1e293b]"
                >
                  Go to Dashboard
                </button>
              </div>
            )}
          </div>
        )}

        {error && <p className="text-red-500 mt-4 font-medium">{error}</p>}

        <p className="max-w-xl mt-10 text-gray-600 text-sm">
          Keep score on your golf outings with team-based match play and stroke play formats. Create teams,
          enter scores, and track your progress easily.
        </p>
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
