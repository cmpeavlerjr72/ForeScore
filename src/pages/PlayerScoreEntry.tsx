import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { GolfCourse, golfCourses } from '../types/GolfCourse';

const SOCKET_URL = 'https://forescore-db.onrender.com';

interface TripData {
  courses: string[];
  numRounds: number;
}

const PlayerScoreEntry: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [playerHandicap, setPlayerHandicap] = useState<number>(0);
  const [scores, setScores] = useState<Record<number, number[]>>({}); // Store scores per round
  const [selectedRound, setSelectedRound] = useState<number>(0); // Controlled by active tab
  const [courseData, setCourseData] = useState<GolfCourse | null>(null);
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false); // Track fetch in progress

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedHandicap = localStorage.getItem('handicap');
    if (!storedUsername || !tripId) {
      navigate('/');
      return;
    }
    setUsername(storedUsername);
    setPlayerHandicap(Math.round(parseFloat(storedHandicap || '0')));
    setIsLoading(false);
  }, [navigate, tripId]);

  useEffect(() => {
    if (!isLoading && username && tripId) {
      fetchInitialData();
    }
  }, [isLoading, username, tripId]);

  const fetchInitialData = async () => {
    setIsDataLoading(true);
    await fetchTripData();
    await fetchSavedScores(selectedRound);
    setIsDataLoading(false);
  };

  const fetchTripData = async () => {
    try {
      const res = await fetch(`${SOCKET_URL}/trips/${tripId}`);
      if (!res.ok) throw new Error(`Failed to fetch trip data: ${res.status}`);
      const trip = await res.json();
      setTripData({ courses: trip.courses || [], numRounds: trip.numRounds || 1 });
      const courseName = trip.courses?.[selectedRound] || trip.courses?.[0];
      const courseInfo = golfCourses.find((c) => c.name === courseName);
      setCourseData(courseInfo || null);
    } catch (err: any) {
      console.error('Failed to fetch course data:', err.message);
    }
  };

  const fetchSavedScores = async (round: number) => {
    if (!username) {
      console.error('Username is not set');
      return;
    }
    try {
      const res = await fetch(`${SOCKET_URL}/users/${username}/trips/${tripId}/scores?round=${round}`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch scores: ${res.status} - ${errorText}`);
      }
      const data = await res.json();
      console.log(`Fetching scores for round ${round}:`, data.raw);
      const updatedScores = Array.isArray(data.raw) && data.raw.length > 0 ? data.raw : Array(18).fill(0);
      setScores((prev) => {
        const newScores = { ...prev, [round]: updatedScores };
        console.log(`Updated scores for round ${round}:`, newScores[round]);
        return newScores;
      });
      console.log(`Updated scores for round ${round}:`, scores[round]);
    } catch (err: any) {
      console.error('Failed to fetch saved scores:', err.message);
      setScores((prev) => ({
        ...prev,
        [round]: Array(18).fill(0),
      }));
    }
  };

  const handleTabChange = async (newRound: number) => {
    console.log(`Switching to round ${newRound}`);
    
    persistCurrentScores(selectedRound);  // ✅ Save the round you're leaving
    setSelectedRound(newRound); // Switch tab
    setIsDataLoading(true);
    
    const courseName = tripData?.courses[newRound] || tripData?.courses?.[0];
    const courseInfo = golfCourses.find((c) => c.name === courseName);
    setCourseData(courseInfo || null);
    await fetchSavedScores(newRound);  // Load new round data
    setIsDataLoading(false);
  };

  const handleScoreChange = (index: number, value: string) => {
    const parsedValue = parseInt(value, 10) || 0;
    setScores(prevScores => {
      const round = selectedRound;
      const updated = [...(prevScores[round] || Array(18).fill(0))];
      updated[index] = parsedValue;
      return { ...prevScores, [round]: updated };
    });
  };

  const persistCurrentScores = (roundToSave: number) => {
    const current = scores[selectedRound] || Array(18).fill(0);
    setScores((prev) => ({
      ...prev,
      [roundToSave]: [...current],
    }));
  };

  const computeNetScores = (round: number = selectedRound) => {
    const defaultPar = Array(18).fill(3);
    const defaultHandicap = Array(18).fill(1);
    const par = courseData?.par || defaultPar;
    const handicap = courseData?.handicap || defaultHandicap;
  
    const net: number[] = [];
    const baseStroke = Math.floor(playerHandicap / 18);
    const extras = playerHandicap % 18;
  
    const strokesPerHole = handicap.map((hcp) => {
      let strokes = baseStroke;
      if (hcp <= extras) strokes += 1;
      return strokes;
    });
  
    const roundScores = scores[round] || Array(18).fill(0);
    for (let i = 0; i < 18; i++) {
      const netScore = roundScores[i] > 0 ? roundScores[i] - strokesPerHole[i] : 0;
      net.push(netScore);
    }
  
    return net.map(String);
  };

  const netScores = computeNetScores();

  const handleSubmit = async () => {
    if (!username || !tripId) return;
    const round = selectedRound;
  
    const rawScores = scores[round] || Array(18).fill(0);
    const netScoresArray = computeNetScores(round).map(Number);
  
    try {
      const res = await fetch(`${SOCKET_URL}/users/${username}/trips/${tripId}/save-scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          round,           // ✅ include round
          raw: rawScores,
          net: netScoresArray,
        }),
      });
  
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to submit scores: ${res.status} - ${errorText}`);
      }
  
      setMessage('✅ Scores submitted!');
      await fetchSavedScores(round);
    } catch (err: any) {
      console.error(err);
      setMessage(`❌ ${err.message}`);
    }
  };
  

  if (isLoading || isDataLoading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4 text-[#0f172a]">Enter Scores - Trip {tripId}</h2>

        {tripData && (
          <div className="mb-4">
            <div className="flex border-b border-gray-300">
              {Array.from({ length: tripData.numRounds }, (_, i) => (
                <button
                  key={i}
                  className={`px-4 py-2 font-medium ${
                    selectedRound === i
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => handleTabChange(i)}
                >
                  Round {i + 1} - {tripData.courses[i] || 'Unnamed Course'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-x-auto mb-4 rounded-lg bg-[#1e293b] shadow-sm p-4">
          <table className="min-w-full text-center text-xs text-white">
            <thead>
              <tr className="uppercase tracking-wide text-gray-200">
                <th className="p-2">HOLE</th>
                {Array.from({ length: 18 }, (_, i) => (
                  <th key={`hole-${i}`} className="p-2 border border-[#334155]">{i + 1}</th>
                ))}
              </tr>
              <tr>
                <td colSpan={18}>
                  <div className="border-t-4 border-[#facc15] w-full my-1" />
                </td>
              </tr>
              <tr>
                <th className="p-2">Par</th>
                {(courseData?.par || Array(18).fill(3)).map((par, i) => (
                  <td key={`par-${i}`} className="p-2 border border-[#334155]">{par}</td>
                ))}
              </tr>
              <tr>
                <th className="p-2">HCP</th>
                {(courseData?.handicap || Array(18).fill(1)).map((hcp, i) => (
                  <td key={`hcp-${i}`} className="p-2 border border-[#334155]">{hcp}</td>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-yellow-50 font-medium text-black">
                <th className="p-2 border border-[#334155]">Your Score</th>
                {Array.from({ length: 18 }, (_, i) => (
                  <td key={`score-${i}`} className="p-2 border border-[#334155]">
                    <input
                      type="number"
                      min={1}
                      value={(scores[selectedRound] || Array(18).fill(0))[i].toString()}
                      onChange={(e) => handleScoreChange(i, e.target.value)}
                      className="w-14 text-center border rounded px-1 py-0.5 text-black"
                    />
                  </td>
                ))}
              </tr>
              <tr className="bg-white font-medium text-blue-800">
                <th className="p-2 border border-[#334155] bg-gray-100">NET Score</th>
                {netScores.map((net, i) => (
                  <td key={`net-${i}`} className="p-2 border border-[#334155]">
                    {net || ''}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded shadow"
            >
              Submit Scores
            </button>
            {message && <p className="text-md font-medium text-white">{message}</p>}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PlayerScoreEntry;