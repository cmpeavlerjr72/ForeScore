import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { GolfCourse, golfCourses } from '../types/GolfCourse';
import { EventConfig } from '../App';

const SOCKET_URL = 'https://forescore-db.onrender.com';

const RoundScoreboard: React.FC = () => {
  const { tripId } = useParams();
  const [config, setConfig] = useState<EventConfig | null>(null);
  const [userScores, setUserScores] = useState<Record<string, number[]>>({});
  const [activeTab, setActiveTab] = useState<'individual' | 'team'>('individual');

  useEffect(() => {
    const fetchTrip = async () => {
      if (!tripId) return;
      try {
        const response = await fetch(`${SOCKET_URL}/trips/${tripId}`);
        const data = await response.json();
        setConfig(data);

        const usernames = data.users || [];
        const allScores: Record<string, number[]> = {};
        for (const username of usernames) {
          const res = await fetch(`${SOCKET_URL}/users/${username}/trips/${tripId}/scores`);
          const scoreData = await res.json();
          allScores[username] = scoreData.net || Array(18).fill(0);
        }
        setUserScores(allScores);
      } catch (err) {
        console.error('Failed to load trip or scores:', err);
      }
    };

    fetchTrip();
  }, [tripId]);

  const getCourseData = (courseName: string): GolfCourse | undefined =>
    golfCourses.find((course) => course.name === courseName);

  const calculateScoreToPar = (scores: number[] | undefined, course: GolfCourse) => {
    let score = 0;
    let thru = 0;
    if (scores) {
      for (let i = 0; i < scores.length; i++) {
        if (scores[i] > 0) {
          score += scores[i] - (course.par[i] || 0);
          thru++;
        }
      }
    }
    return { scoreToPar: score, thru };
  };

  const calculateMatchPoints = (s1: number[], s2: number[]) => {
    let p1_holes = 0;
    let p2_holes = 0;
    for (let i = 0; i < 18; i++) {
      if (s1[i] > 0 && s2[i] > 0) {
        if (s1[i] < s2[i]) p1_holes++;
        else if (s2[i] < s1[i]) p2_holes++;
      }
    }
    if (p1_holes > p2_holes) return 1;
    if (p1_holes === p2_holes) return 0.5;
    return 0;
  };

  const calculateMatchStatus = (s1: number[], s2: number[]) => {
    let p1 = 0, p2 = 0;
    for (let i = 0; i < 18; i++) {
      if (s1[i] > 0 && s2[i] > 0) {
        if (s1[i] < s2[i]) p1++;
        else if (s2[i] < s1[i]) p2++;
      }
      const remaining = 18 - (i + 1);
      if (Math.abs(p1 - p2) > remaining) break;
    }
    if (p1 === p2) return "All Square";
    return p1 > p2 ? `Team 1 ${p1 - p2} Up` : `Team 2 ${p2 - p1} Up`;
  };

  if (!config) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header title="ForeScore - Round Scoreboard" />
      <main className="flex-grow container mx-auto p-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-6 text-[#0f172a]">Round-by-Round Scoreboard</h2>

          {Array.from({ length: config.numRounds }, (_, roundIndex) => {
            const course = getCourseData(config.courses[roundIndex]);
            const scoringMethod = config.scoringMethods[roundIndex];

            return (
              <div key={roundIndex} className="mb-10">
                <h3 className="text-xl font-semibold mb-4 text-[#1e293b]">
                  Round {roundIndex + 1} ({scoringMethod} Play) - {config.courses[roundIndex]}
                </h3>

                {course && scoringMethod === 'match' && (
                  <div className="space-y-8">
                    {config.teams[0].players.map((player1, i) => {
                      const player2 = config.teams[1].players.find(
                        (p) => p.lineupOrder[roundIndex] === player1.lineupOrder[roundIndex]
                      );
                      if (!player2) return null;

                      const net1 = userScores[player1.name] || Array(18).fill(0);
                      const net2 = userScores[player2.name] || Array(18).fill(0);
                      const matchStatus = calculateMatchStatus(net1, net2);
                      const matchPoints = calculateMatchPoints(net1, net2);

                      return (
                        <div key={i} className="bg-gray-100 p-4 rounded-lg shadow-inner border border-gray-300">
                          <h4 className="text-md font-semibold mb-3 text-[#0f172a]">
                            Match: {player1.name} (Team 1) vs {player2.name} (Team 2)
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm text-center">
                              <thead>
                                <tr className="bg-gray-100 font-semibold text-sm text-left">
                                  <th className="border p-2" colSpan={19}>
                                    Match Status: {matchStatus}
                                  </th>
                                </tr>
                                <tr className="bg-white">
                                  <th className="border p-2 font-medium text-left">{player1.name}</th>
                                  {Array.from({ length: 18 }, (_, i) => (
                                    <td key={`p1-${i}`} className="border p-2 bg-white">
                                      {net1[i] > 0 ? net1[i] : '–'}
                                    </td>
                                  ))}
                                </tr>
                                <tr className="bg-white">
                                  <th className="border p-2 font-medium text-left">{player2.name}</th>
                                  {Array.from({ length: 18 }, (_, i) => (
                                    <td key={`p2-${i}`} className="border p-2 bg-white">
                                      {net2[i] > 0 ? net2[i] : '–'}
                                    </td>
                                  ))}
                                </tr>
                              </thead>
                            </table>
                          </div>
                          <div className="mt-3 text-gray-800">
                            <p>
                              <strong>Team 1 Points Earned:</strong> {matchPoints}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RoundScoreboard;
