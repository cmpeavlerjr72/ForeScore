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
      scoringMethods: ['match', 'match', 'match'],
      courses: Array(numRounds).fill('True Blue'), // Default course for each round
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
      setConfig((prev) => ({
        ...prev,
        tripId: tripIdInput,
        teams: prev.teams,
      }));
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
    setTempConfig((prev) => ({
      ...prev,
      tripId: newTripId,
    }));
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
        newCourses[index] = value as string;
        return { ...prev, courses: newCourses };
      }
      const updatedValue = parseInt(value) || (typeof prev[name as keyof EventConfig] === 'number' ? prev[name as keyof EventConfig] as number : 0);
      let updatedTeams = prev.teams;
      if (name === 'numTeams' || name === 'playersPerTeam') {
        const newNumTeams = name === 'numTeams' ? updatedValue : prev.numTeams;
        const newPlayersPerTeam = name === 'playersPerTeam' ? updatedValue : prev.playersPerTeam;
        updatedTeams = Array.from({ length: newNumTeams as number }, (_, teamIndex) => ({
          name: `Team ${teamIndex + 1}`,
          players: Array.from({ length: newPlayersPerTeam as number }, (_, playerIndex) => ({
            name: `Player ${playerIndex + 1}`,
            scores: Array(prev.numRounds as number).fill(0),
            lineupOrder: Array(prev.numRounds as number).fill(playerIndex),
          })),
        }));
      }
      return {
        ...prev,
        [name]: updatedValue,
        teams: updatedTeams,
      };
    });
  };

  const handleSetupNumRoundsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumRounds = parseInt(e.target.value) || (tempConfig.numRounds as number);
    setTempConfig((prev) => {
      const newTeams = prev.teams.map((team) => ({
        ...team,
        players: team.players.map((player) => ({
          ...player,
          scores: player.scores.slice(0, newNumRounds).concat(Array(Math.max(0, newNumRounds - player.scores.length)).fill(0)),
          lineupOrder: player.lineupOrder.slice(0, newNumRounds).concat(Array(Math.max(0, newNumRounds - player.lineupOrder.length)).fill(0)),
        })),
      }));
      const newCourses = prev.courses.slice(0, newNumRounds).concat(
        Array(Math.max(0, newNumRounds - prev.courses.length)).fill('True Blue')
      );
      return {
        ...prev,
        numRounds: newNumRounds,
        scoringMethods: prev.scoringMethods.slice(0, newNumRounds).concat(
          Array(Math.max(0, newNumRounds - prev.scoringMethods.length)).fill('match')
        ),
        courses: newCourses,
        teams: newTeams,
      };
    });
  };

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConfig(tempConfig);
    saveConfig(tempConfig);
    setShowSetupModal(false);
    setIsLeader(true);
    navigate('/dashboard');
    setError('');
  };

  const handleConfigChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    index?: number
  ) => {
    const { name, value } = e.target;
    setConfig((prev) => {
      if (name === 'scoringMethod' && index !== undefined) {
        const newScoringMethods = [...prev.scoringMethods];
        newScoringMethods[index] = value as 'match' | 'stroke';
        return {
          ...prev,
          scoringMethods: newScoringMethods,
          teams: prev.teams,
        };
      }
      if (name === 'course' && index !== undefined) {
        const newCourses = [...prev.courses];
        newCourses[index] = value as string;
        return {
          ...prev,
          courses: newCourses,
          teams: prev.teams,
        };
      }
      const updatedValue = name === 'tripId' ? value : parseInt(value) || (typeof prev[name as keyof EventConfig] === 'number' ? prev[name as keyof EventConfig] as number : 0);
      let updatedTeams = prev.teams;
      if (name === 'numTeams' || name === 'playersPerTeam') {
        const newNumTeams = name === 'numTeams' ? updatedValue : prev.numTeams;
        const newPlayersPerTeam = name === 'playersPerTeam' ? updatedValue : prev.playersPerTeam;
        updatedTeams = Array.from({ length: newNumTeams as number }, (_, teamIndex) => ({
          name: `Team ${teamIndex + 1}`,
          players: Array.from({ length: newPlayersPerTeam as number }, (_, playerIndex) => ({
            name: `Player ${playerIndex + 1}`,
            scores: Array(prev.numRounds as number).fill(0),
            lineupOrder: Array(prev.numRounds as number).fill(playerIndex),
          })),
        }));
      }
      return {
        ...prev,
        [name]: updatedValue,
        teams: updatedTeams,
      };
    });
  };

  const handleSaveConfig = () => {
    if (isLeader && config.tripId) {
      saveConfig(config);
      alert('Configuration Saved!');
    } else {
      setError('Only the trip leader can save configurations with a valid Trip ID');
    }
  };

  const handleLineupChange = (teamIndex: number, roundIndex: number, playerIndex: number, newOrder: number) => {
    setConfig((prev) => {
      const newTeams = prev.teams.map((team, tIdx) =>
        tIdx === teamIndex
          ? {
              ...team,
              players: team.players.map((player, pIdx) =>
                pIdx === playerIndex
                  ? { ...player, lineupOrder: player.lineupOrder.map((order, rIdx) => rIdx === roundIndex ? newOrder : order) }
                  : player
              ),
            }
          : team
      );
      return { ...prev, teams: newTeams };
    });
  };

  const handleLineupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfig(config);
    setShowLineupModal(false);
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="ForeScore" />
      <main className="flex-grow container mx-auto p-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          {error && <p className="text-red-500 mb-4">{error}</p>}

          {!config.tripId && (
            <div className="mb-6">
              <form onSubmit={handleTripIdSubmit} className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Enter Trip Id
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tripIdInput}
                    onChange={(e) => setTripIdInput(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., TRIP2025"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Load Trip
                  </button>
                </div>
              </form>
              <button
                onClick={handleCreateNewTrip}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Create New Trip
              </button>
            </div>
          )}

          {config.tripId && (
            <>
              <p className="mb-4">Trip Id: {config.tripId}</p>
              {!isLeader && (
                <form onSubmit={handlePinSubmit} className="mb-6">
                  <label className="block text-sm font-medium text-gray-700">
                    Enter Leader PIN (for editing)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter PIN"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Verify PIN
                    </button>
                  </div>
                </form>
              )}

              {isLeader && (
                <div className="grid gap-4">
                  <h3 className="text-lg font-semibold">Configure Event</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Number of Teams
                    </label>
                    <input
                      type="number"
                      name="numTeams"
                      value={config.numTeams}
                      onChange={handleConfigChange}
                      min="2"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Players per Team
                    </label>
                    <input
                      type="number"
                      name="playersPerTeam"
                      value={config.playersPerTeam}
                      onChange={handleConfigChange}
                      min="1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Number of Rounds
                    </label>
                    <input
                      type="number"
                      name="numRounds"
                      value={config.numRounds}
                      onChange={(e) => {
                        const newNumRounds = parseInt(e.target.value) || (config.numRounds as number);
                        setConfig((prev) => {
                          const newTeams = prev.teams.map((team) => ({
                            ...team,
                            players: team.players.map((player) => ({
                              ...player,
                              scores: player.scores.slice(0, newNumRounds).concat(Array(Math.max(0, newNumRounds - player.scores.length)).fill(0)),
                              lineupOrder: player.lineupOrder.slice(0, newNumRounds).concat(Array(Math.max(0, newNumRounds - player.lineupOrder.length)).fill(0)),
                            })),
                          }));
                          const newCourses = prev.courses.slice(0, newNumRounds).concat(
                            Array(Math.max(0, newNumRounds - prev.courses.length)).fill('True Blue')
                          );
                          return {
                            ...prev,
                            numRounds: newNumRounds,
                            scoringMethods: prev.scoringMethods.slice(0, newNumRounds).concat(
                              Array(Math.max(0, newNumRounds - prev.scoringMethods.length)).fill('match')
                            ),
                            courses: newCourses,
                            teams: newTeams,
                          };
                        });
                      }}
                      min="1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  {Array.from({ length: config.numRounds }, (_, index) => (
                    <div key={index}>
                      <label className="block text-sm font-medium text-gray-700">
                        Scoring Method for Round {index + 1}
                      </label>
                      <select
                        name="scoringMethod"
                        value={config.scoringMethods[index]}
                        onChange={(e) => handleConfigChange(e, index)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="match">Match Play</option>
                        <option value="stroke">Stroke Play</option>
                      </select>
                    </div>
                  ))}
                  {Array.from({ length: config.numRounds }, (_, index) => (
                    <div key={`course-${index}`}>
                      <label className="block text-sm font-medium text-gray-700">
                        Course for Round {index + 1}
                      </label>
                      <select
                        name="course"
                        value={config.courses[index]}
                        onChange={(e) => handleConfigChange(e, index)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        {golfCourses.map((course) => (
                          <option key={course.name} value={course.name}>
                            {course.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                  <button
                    onClick={handleSaveConfig}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Save Configuration
                  </button>
                  <button
                    onClick={() => setShowLineupModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    Set Lineups
                  </button>
                </div>
              )}
            </>
          )}

          {showSetupModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                <h3 className="text-lg font-semibold mb-4">Set Up New Trip</h3>
                <form onSubmit={handleSetupSubmit} className="grid gap-4">
                  <p className="text-sm text-gray-600">Trip Id: {tempConfig.tripId}</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Number of Teams
                    </label>
                    <input
                      type="number"
                      name="numTeams"
                      value={tempConfig.numTeams}
                      onChange={handleSetupConfigChange}
                      min="2"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Players per Team
                    </label>
                    <input
                      type="number"
                      name="playersPerTeam"
                      value={tempConfig.playersPerTeam}
                      onChange={handleSetupConfigChange}
                      min="1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Number of Rounds
                    </label>
                    <input
                      type="number"
                      name="numRounds"
                      value={tempConfig.numRounds}
                      onChange={handleSetupNumRoundsChange}
                      min="1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  {Array.from({ length: tempConfig.numRounds }, (_, index) => (
                    <div key={index}>
                      <label className="block text-sm font-medium text-gray-700">
                        Scoring Method for Round {index + 1}
                      </label>
                      <select
                        name="scoringMethod"
                        value={tempConfig.scoringMethods[index]}
                        onChange={(e) => handleSetupConfigChange(e, index)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="match">Match Play</option>
                        <option value="stroke">Stroke Play</option>
                      </select>
                    </div>
                  ))}
                  {Array.from({ length: tempConfig.numRounds }, (_, index) => (
                    <div key={`course-${index}`}>
                      <label className="block text-sm font-medium text-gray-700">
                        Course for Round {index + 1}
                      </label>
                      <select
                        name="course"
                        value={tempConfig.courses[index]}
                        onChange={(e) => handleSetupConfigChange(e, index)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        {golfCourses.map((course) => (
                          <option key={course.name} value={course.name}>
                            {course.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Save Setup
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSetupModal(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showLineupModal && isLeader && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
                <h3 className="text-lg font-semibold mb-4">Set Lineups</h3>
                <form onSubmit={handleLineupSubmit} className="grid gap-4">
                  {config.teams.map((team, teamIndex) => (
                    <div key={teamIndex}>
                      <h4 className="text-md font-medium mb-2">{team.name}</h4>
                      {Array.from({ length: config.numRounds }, (_, roundIndex) => (
                        <div key={roundIndex} className="mb-4">
                          <h5 className="text-sm font-medium mb-2">Round {roundIndex + 1}</h5>
                          {team.players.map((player, playerIndex) => (
                            <div key={playerIndex} className="flex items-center gap-2 mb-2">
                              <span>{player.name}</span>
                              <select
                                value={player.lineupOrder[roundIndex]}
                                onChange={(e) => handleLineupChange(teamIndex, roundIndex, playerIndex, parseInt(e.target.value))}
                                className="mt-1 block w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              >
                                {Array.from({ length: config.playersPerTeam }, (_, i) => (
                                  <option key={i} value={i}>{i + 1}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Save Lineups
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLineupModal(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default HomePage;