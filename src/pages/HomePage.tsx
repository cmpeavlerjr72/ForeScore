import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventConfig } from '../App';
import { saveConfig, loadConfig, generateTripId } from '../utils/storage';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { GolfCourse, golfCourses } from '../types/GolfCourse';
import ForeScoreLogo from '../assets/ForeScore.png';


interface HomePageProps {
  config: EventConfig;
  setConfig: React.Dispatch<React.SetStateAction<EventConfig>>;
}

const HomePage: React.FC<HomePageProps> = ({ config, setConfig }) => {
  const navigate = useNavigate();
  const [tripIdInput, setTripIdInput] = useState('');
  const [pin, setPin] = useState('');
  const [isLeader, setIsLeader] = useState(false);
  const [error, setError] = useState('');
  const [showSetupModal, setShowSetupModal] = useState(false);
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
      scoringMethods: ['match', 'match', 'match'],
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

  const handleSetupConfigChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    index?: number
  ) => {
    const { name, value } = e.target;
    setTempConfig((prev) => {
      if (name === 'scoringMethod' && index !== undefined) {
        const newScoringMethods = [...prev.scoringMethods];
        newScoringMethods[index] = value as 'match' | 'stroke';
        return { ...prev, scoringMethods: newScoringMethods };
      }
      if (name === 'course' && index !== undefined) {
        const newCourses = [...prev.courses];
        newCourses[index] = value;
        return { ...prev, courses: newCourses };
      }
      const updatedValue = parseInt(value);
      if (name === 'numTeams' || name === 'playersPerTeam') {
        const newNumTeams = name === 'numTeams' ? updatedValue : prev.numTeams;
        const newPlayersPerTeam = name === 'playersPerTeam' ? updatedValue : prev.playersPerTeam;
        const newTeams = Array.from({ length: newNumTeams }, (_, teamIndex) => ({
          name: `Team ${teamIndex + 1}`,
          players: Array.from({ length: newPlayersPerTeam }, (_, playerIndex) => ({
            name: `Player ${playerIndex + 1}`,
            scores: Array(prev.numRounds).fill(0),
            lineupOrder: Array(prev.numRounds).fill(playerIndex),
          })),
        }));
        return {
          ...prev,
          [name]: updatedValue,
          teams: newTeams,
        };
      }
      return { ...prev, [name]: updatedValue };
    });
  };

  const handleSetupNumRoundsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumRounds = parseInt(e.target.value);
    setTempConfig((prev) => {
      const newTeams = prev.teams.map((team) => ({
        ...team,
        players: team.players.map((player) => ({
          ...player,
          scores: Array(newNumRounds).fill(0),
          lineupOrder: Array(newNumRounds).fill(0),
        })),
      }));
      const newCourses = Array(newNumRounds).fill('True Blue');
      const newMethods = Array(newNumRounds).fill('match');
      return {
        ...prev,
        numRounds: newNumRounds,
        courses: newCourses,
        scoringMethods: newMethods,
        teams: newTeams,
      };
    });
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfig(tempConfig);
    saveConfig(tempConfig);
  
    try {
      const response = await fetch('https://forescore-db.onrender.com/api/trips/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tempConfig),
      });
  
      if (!response.ok) throw new Error('Failed to save trip');
      console.log('Trip saved to DB');
    } catch (err) {
      console.error(err);
    }
  
    setShowSetupModal(false);
    setIsLeader(true);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#fdfdfb] flex flex-col">
      {/* Custom Header */}
      <Header title="ForeScore" showNav={false} />

      {/* Hero Section */}
      <main className="flex-grow container mx-auto flex flex-col items-center justify-center px-4 py-10 text-center">
        {/* Logo */}
        <img
          src={ForeScoreLogo}
          alt="ForeScore Logo"
          className="w-64 h-64 md:w-80 md:h-80"

        />
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

      {showSetupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Set Up New Trip</h3>
            <form onSubmit={handleSetupSubmit} className="grid gap-4 text-left">
              <p className="text-sm text-gray-600">Trip ID: {tempConfig.tripId}</p>
              <div>
                <label className="block text-sm font-medium">Number of Teams</label>
                <input
                  type="number"
                  name="numTeams"
                  value={tempConfig.numTeams}
                  onChange={handleSetupConfigChange}
                  min="2"
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Players per Team</label>
                <input
                  type="number"
                  name="playersPerTeam"
                  value={tempConfig.playersPerTeam}
                  onChange={handleSetupConfigChange}
                  min="1"
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Number of Rounds</label>
                <input
                  type="number"
                  name="numRounds"
                  value={tempConfig.numRounds}
                  onChange={handleSetupNumRoundsChange}
                  min="1"
                  className="w-full border rounded p-2"
                />
              </div>
              {Array.from({ length: tempConfig.numRounds }).map((_, i) => (
                <div key={i}>
                  <label className="block text-sm font-medium">Scoring Method for Round {i + 1}</label>
                  <select
                    name="scoringMethod"
                    value={tempConfig.scoringMethods[i]}
                    onChange={(e) => handleSetupConfigChange(e, i)}
                    className="w-full border rounded p-2"
                  >
                    <option value="match">Match Play</option>
                    <option value="stroke">Stroke Play</option>
                  </select>
                </div>
              ))}
              {Array.from({ length: tempConfig.numRounds }).map((_, i) => (
                <div key={`course-${i}`}>
                  <label className="block text-sm font-medium">Course for Round {i + 1}</label>
                  <select
                    name="course"
                    value={tempConfig.courses[i]}
                    onChange={(e) => handleSetupConfigChange(e, i)}
                    className="w-full border rounded p-2"
                  >
                    {golfCourses.map((course) => (
                      <option key={course.name} value={course.name}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <div className="flex gap-2 mt-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowSetupModal(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Save & Start
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