import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { EventConfig, defaultEventConfig } from '../App';
import { golfCourses } from '../types/GolfCourse';
import { generateTripId } from '../utils/storage';

const SOCKET_URL = 'https://forescore-db.onrender.com';

interface User {
  username: string;
  name: string;
  handicap: number;
  trips: string[];
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [newTripId, setNewTripId] = useState('');
  const [tempConfig, setTempConfig] = useState<EventConfig>(defaultEventConfig);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (!storedUsername) {
      navigate('/');
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`${SOCKET_URL}/users/${storedUsername}`);
        if (!res.ok) throw new Error('User not found');
        const data = await res.json();
        setUser(data);
      } catch (err) {
        setError('Failed to load user profile');
      }
    };

    fetchUser();
  }, [navigate]);

  const handleTripClick = async (tripId: string) => {
    try {
      const res = await fetch(`${SOCKET_URL}/trips/${tripId}`);
      if (!res.ok) throw new Error('Trip not found');
      const tripData = await res.json();
      localStorage.setItem('tripId', tripId);
      navigate(`/dashboard/${tripId}`, { state: { config: tripData } });
    } catch (err) {
      setError('Unable to load trip');
    }
  };

  const handleAddTrip = async () => {
    if (!user || !newTripId) return;
    try {
      const res = await fetch(`${SOCKET_URL}/users/${user.username}/add-trip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId: newTripId }),
      });
      const updatedUser = await res.json();
      setUser(updatedUser);
      setNewTripId('');
      setError('');
    } catch {
      setError('Failed to add trip');
    }
  };

  const handleCreateNewTrip = () => {
    const newId = generateTripId();
    setTempConfig({
      ...defaultEventConfig,
      tripId: newId,
    });
    setShowSetupModal(true);
  };

  const handleSetupConfigChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    index?: number
  ) => {
    const { name, value } = e.target;
    setTempConfig((prev) => {
      if (name === 'scoringMethod' && index !== undefined) {
        const updated = [...prev.scoringMethods];
        updated[index] = value as 'match' | 'stroke';
        return { ...prev, scoringMethods: updated };
      }
      if (name === 'course' && index !== undefined) {
        const updated = [...prev.courses];
        updated[index] = value;
        return { ...prev, courses: updated };
      }
      const intVal = parseInt(value);
      if (name === 'numTeams' || name === 'playersPerTeam') {
        const updatedNumTeams = name === 'numTeams' ? intVal : prev.numTeams;
        const updatedPlayersPerTeam = name === 'playersPerTeam' ? intVal : prev.playersPerTeam;
        const updatedTeams = Array.from({ length: updatedNumTeams }, (_, teamIdx) => ({
          name: `Team ${teamIdx + 1}`,
          players: Array.from({ length: updatedPlayersPerTeam }, (_, playerIdx) => ({
            id: playerIdx + 1,
            name: `Player ${playerIdx + 1}`,
            scores: Array(prev.numRounds).fill(0),
            lineupOrder: Array(prev.numRounds).fill(playerIdx),
          })),
        }));
        return {
          ...prev,
          [name]: intVal,
          teams: updatedTeams,
        };
      }
      return { ...prev, [name]: intVal };
    });
  };

  const handleNumRoundsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumRounds = parseInt(e.target.value);
    setTempConfig((prev) => {
      const newCourses = Array(newNumRounds).fill('True Blue');
      const newScoringMethods = Array(newNumRounds).fill('match');
      const updatedTeams = prev.teams.map((team) => ({
        ...team,
        players: team.players.map((player) => ({
          ...player,
          scores: Array(newNumRounds).fill(0),
          lineupOrder: Array(newNumRounds).fill(0),
        })),
      }));
      return {
        ...prev,
        numRounds: newNumRounds,
        courses: newCourses,
        scoringMethods: newScoringMethods,
        teams: updatedTeams,
      };
    });
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${SOCKET_URL}/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tempConfig),
      });
      const tripResponse = await res.json();

      // Link trip to user
      if (user) {
        await fetch(`${SOCKET_URL}/users/${user.username}/add-trip`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tripId: tempConfig.tripId }),
        });
      }

      setShowSetupModal(false);
      navigate(`/dashboard/${tempConfig.tripId}`, { state: { config: tempConfig } });
    } catch (err: any) {
      console.error('Failed to save trip:', err.message);
      setError('Failed to save trip');
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfdfb] flex flex-col">
      <Header title="ForeScore Profile" showNav={true} />
      <main className="flex-grow container mx-auto px-4 py-8 flex">
        <aside className="w-1/3 p-4 border-r border-gray-300">
          <h2 className="text-xl font-semibold mb-2">Welcome</h2>
          {user ? (
            <>
              <p className="text-gray-800"><strong>Name:</strong> {user.name}</p>
              <p className="text-gray-800"><strong>Handicap:</strong> {user.handicap}</p>
            </>
          ) : (
            <p>Loading...</p>
          )}
        </aside>

        <section className="w-2/3 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Trips</h2>
            <button
              className="bg-[#facc15] text-[#0f172a] px-4 py-2 rounded font-semibold shadow hover:bg-[#eab308]"
              onClick={handleCreateNewTrip}
            >
              New Trip
            </button>
          </div>

          {user && user.trips.length > 0 ? (
            <ul className="space-y-2">
              {user.trips.map((tripId) => (
                <li key={tripId}>
                  <button
                    onClick={() => handleTripClick(tripId)}
                    className="text-blue-600 hover:underline"
                  >
                    {tripId}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">No trips found.</p>
              <input
                type="text"
                value={newTripId}
                onChange={(e) => setNewTripId(e.target.value)}
                placeholder="Enter Trip ID"
                className="border p-2 rounded mr-2"
              />
              <button
                onClick={handleAddTrip}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Add Trip
              </button>
            </div>
          )}

          {error && <p className="text-red-500 mt-4">{error}</p>}
        </section>
      </main>

      {/* Trip Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Set Up New Trip</h3>
            <form onSubmit={handleSetupSubmit} className="grid gap-4 text-left">
              <p className="text-sm text-gray-600">Trip ID: {tempConfig.tripId}</p>
              <label>
                Number of Teams
                <input
                  type="number"
                  name="numTeams"
                  value={tempConfig.numTeams}
                  onChange={handleSetupConfigChange}
                  min="2"
                  className="w-full border p-2 rounded"
                />
              </label>
              <label>
                Players per Team
                <input
                  type="number"
                  name="playersPerTeam"
                  value={tempConfig.playersPerTeam}
                  onChange={handleSetupConfigChange}
                  min="1"
                  className="w-full border p-2 rounded"
                />
              </label>
              <label>
                Number of Rounds
                <input
                  type="number"
                  name="numRounds"
                  value={tempConfig.numRounds}
                  onChange={handleNumRoundsChange}
                  min="1"
                  className="w-full border p-2 rounded"
                />
              </label>
              {Array.from({ length: tempConfig.numRounds }).map((_, i) => (
                <div key={i}>
                  <label>Scoring Method for Round {i + 1}</label>
                  <select
                    name="scoringMethod"
                    value={tempConfig.scoringMethods[i]}
                    onChange={(e) => handleSetupConfigChange(e, i)}
                    className="w-full border p-2 rounded"
                  >
                    <option value="match">Match Play</option>
                    <option value="stroke">Stroke Play</option>
                  </select>
                </div>
              ))}
              {Array.from({ length: tempConfig.numRounds }).map((_, i) => (
                <div key={`course-${i}`}>
                  <label>Course for Round {i + 1}</label>
                  <select
                    name="course"
                    value={tempConfig.courses[i]}
                    onChange={(e) => handleSetupConfigChange(e, i)}
                    className="w-full border p-2 rounded"
                  >
                    {golfCourses.map((course) => (
                      <option key={course.name} value={course.name}>{course.name}</option>
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

export default Profile;
