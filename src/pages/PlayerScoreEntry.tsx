import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { GolfCourse, golfCourses } from '../types/GolfCourse';

const SOCKET_URL = 'https://forescore-db.onrender.com';

const PlayerScoreEntry: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [playerHandicap, setPlayerHandicap] = useState<number>(0);
  const [scores, setScores] = useState<number[]>(Array(18).fill(0));
  const [courseData, setCourseData] = useState<GolfCourse | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedHandicap = localStorage.getItem('handicap');
    if (!storedUsername || !tripId) {
      navigate('/');
      return;
    }
    setUsername(storedUsername);
    setPlayerHandicap(Math.round(parseFloat(storedHandicap || '0')));
    fetchTripData();
  }, [navigate, tripId]);

  const fetchTripData = async () => {
    try {
      const res = await fetch(`${SOCKET_URL}/trips/${tripId}`);
      const trip = await res.json();
      const courseName = trip.courses?.[0]; // assume Round 1
      const courseInfo = golfCourses.find((c) => c.name === courseName);
      if (courseInfo) setCourseData(courseInfo);
    } catch (err) {
      console.error('Failed to fetch course data:', err);
    }
  };

  const handleScoreChange = (index: number, value: string) => {
    const updated = [...scores];
    updated[index] = parseInt(value, 10) || 0;
    setScores(updated);
  };

  const computeNetScores = () => {
    if (!courseData) return scores;
    const net: number[] = [];
    const baseStroke = Math.floor(playerHandicap / 18);
    const extras = playerHandicap % 18;

    const strokesPerHole = courseData.handicap.map((hcp) => {
      let strokes = baseStroke;
      if (hcp <= extras) strokes += 1;
      return strokes;
    });

    for (let i = 0; i < 18; i++) {
      const netScore = scores[i] > 0 ? scores[i] - strokesPerHole[i] : 0;
      net.push(netScore);
    }

    return net;
  };

  const netScores = computeNetScores();

  const handleSubmit = async () => {
    if (!username || !tripId) return;
    try {
      const res = await fetch(`${SOCKET_URL}/users/${username}/trips/${tripId}/submit-scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores }),
      });

      if (!res.ok) throw new Error('Failed to submit scores');
      setMessage('✅ Scores submitted!');
    } catch (err) {
      console.error(err);
      setMessage('❌ Submission failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4 text-[#0f172a]">Enter Scores - Trip {tripId}</h2>

        {courseData ? (
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
                  <td colSpan={19}>
                    <div className="border-t-4 border-[#facc15] w-full my-1" />
                  </td>
                </tr>
                <tr>
                  <th className="p-2">Par</th>
                  {courseData.par.map((par, i) => (
                    <td key={`par-${i}`} className="p-2 border border-[#334155]">{par}</td>
                  ))}
                </tr>
                <tr>
                  <th className="p-2">HCP</th>
                  {courseData.handicap.map((hcp, i) => (
                    <td key={`hcp-${i}`} className="p-2 border border-[#334155]">{hcp}</td>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-yellow-50 font-medium text-black">
                  <th className="p-2 border border-[#334155]">Your Score</th>
                  {scores.map((score, i) => (
                    <td key={`score-${i}`} className="p-2 border border-[#334155]">
                      <input
                        type="number"
                        min={1}
                        value={score || ''}
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
                      {net > 0 ? net : ''}
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
        ) : (
          <p className="text-gray-500">Loading course data...</p>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default PlayerScoreEntry;
