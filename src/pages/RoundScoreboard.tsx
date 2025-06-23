import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { GolfCourse, golfCourses } from '../types/GolfCourse';
import { EventConfig } from '../App';

const SOCKET_URL = 'https://forescore-db.onrender.com';

// Generate a consistent color for each team based on index
const getTeamColor = (index: number) => {
  const colors = [
    '#60A5FA', '#F87171', '#34D399', '#FBBF24', '#A78BFA',
    '#F472B6', '#6EE7B7', '#FDE047', '#C4B5FD', '#FB923C',
  ];
  return colors[index % colors.length];
};

// Extend EventConfig to include team colors
interface TeamWithColor {
  name: string;
  players: {
    name: string;
    scores: number[];
    lineupOrder: number[];
  }[];
  color?: string; // Optional color property
}

interface ExtendedEventConfig extends EventConfig {
  teams: TeamWithColor[];
}

const RoundScoreboard: React.FC = () => {
  const { tripId } = useParams();
  const [config, setConfig] = useState<ExtendedEventConfig | null>(null);
  const [userScores, setUserScores] = useState<Record<string, number[]>>({});
  const [activeTab, setActiveTab] = useState<'individual' | 'team'>('individual');

  useEffect(() => {
    fetchTrip();
  }, [tripId]);

  const fetchTrip = async () => {
    if (!tripId) return;
    try {
      const response = await fetch(`${SOCKET_URL}/trips/${tripId}`);
      if (!response.ok) throw new Error('Failed to fetch trip');
      const data = await response.json() as ExtendedEventConfig; // Type assertion
      // Assign colors to teams if not already present
      const updatedConfig: ExtendedEventConfig = {
        ...data,
        teams: data.teams.map((team: TeamWithColor, index: number) => ({
          ...team,
          color: team.color || getTeamColor(index),
        })),
      };
      setConfig(updatedConfig);

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
        if (s1[i] < s2[i]) p1_holes++; // Lower score wins
        else if (s2[i] < s1[i]) p2_holes++;
      }
    }
    if (p1_holes > p2_holes) return 1;
    if (p1_holes === p2_holes) return 0.5;
    return 0;
  };

  const calculateMatchStatus = (s1: number[], s2: number[], hole: number, p1Name: string, p2Name: string) => {
    let p1 = 0, p2 = 0;
    console.log(`Comparing ${p1Name} (s1: ${s1}) vs ${p2Name} (s2: ${s2}) up to hole ${hole}`); // Debug log
    for (let i = 0; i <= hole && i < 18; i++) {
      if (s1[i] > 0 && s2[i] > 0) {
        console.log(`Hole ${i}: ${p1Name}[${i}]=${s1[i]}, ${p2Name}[${i}]=${s2[i]}`); // Debug log
        if (s1[i] < s2[i]) p1++; // Lower score wins
        else if (s2[i] < s1[i]) p2++;
      }
    }
    console.log(`p1: ${p1}, p2: ${p2}`); // Debug log
    if (p1 === p2) return { status: "AS", color: 'bg-gray-400' };
    const diff = p1 - p2;
    const team1 = config?.teams.find(t => t.players.some(p => p.name === p1Name));
    const team2 = config?.teams.find(t => t.players.some(p => p.name === p2Name));
    const team1Color = team1?.color || '#60A5FA';
    const team2Color = team2?.color || '#F87171';
    return diff > 0
      ? { status: diff.toString(), color: `bg-[${team1Color}]` }
      : { status: Math.abs(diff).toString(), color: `bg-[${team2Color}]` };
  };

  if (!config) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header title="ForeScore - Round Scoreboard" />
      <main className="flex-grow container mx-auto p-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-[#0f172a]">Round-by-Round Scoreboard</h2>
            <button
              onClick={fetchTrip}
              className="bg-[#34d399] hover:bg-[#10b981] text-white font-semibold px-4 py-2 rounded-md shadow transition"
            >
              Refresh Scores
            </button>
          </div>

          {Array.from({ length: config.numRounds }, (_, roundIndex) => {
            const course = getCourseData(config.courses[roundIndex]);
            const scoringMethod = config.scoringMethods[roundIndex];

            return (
              <div key={roundIndex} className="mb-10">
                <h3 className="text-xl font-semibold mb-4 text-[#1e293b]">
                  Round {roundIndex + 1} ({scoringMethod} Play) - {config.courses[roundIndex]}
                </h3>

                {course && (
                  <>
                    {/* Course Info Block */}
                    <div className="overflow-x-auto mb-4 rounded-lg bg-[#1e293b] shadow-sm">
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
                            {course.par.map((par, i) => (
                              <td key={`par-${i}`} className="p-2 border border-[#334155]">{par}</td>
                            ))}
                          </tr>
                          <tr>
                            <th className="p-2">HCP</th>
                            {course.handicap.map((hcp, i) => (
                              <td key={`hcp-${i}`} className="p-2 border border-[#334155]">{hcp}</td>
                            ))}
                          </tr>
                        </thead>
                      </table>
                    </div>

                    {/* Stroke vs Match View */}
                    {scoringMethod === 'stroke' ? (
                      // [Stroke play logic remains unchanged]
                      <>
                        <div className="flex gap-4 mb-4">
                          <button
                            className={`px-4 py-2 rounded-t-md font-medium ${
                              activeTab === 'individual'
                                ? 'bg-white border-t-2 border-l border-r border-gray-300 text-[#0f172a]'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                            onClick={() => setActiveTab('individual')}
                          >
                            Individual
                          </button>
                          <button
                            className={`px-4 py-2 rounded-t-md font-medium ${
                              activeTab === 'team'
                                ? 'bg-white border-t-2 border-l border-r border-gray-300 text-[#0f172a]'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                            onClick={() => setActiveTab('team')}
                          >
                            Team
                          </button>
                        </div>

                        {activeTab === 'individual' ? (
                          <table className="w-full text-sm text-left border border-gray-300 rounded">
                            <thead className="bg-gray-100 text-gray-800">
                              <tr>
                                <th className="p-2 border">Player</th>
                                <th className="p-2 border">Team</th>
                                <th className="p-2 border">Score to Par</th>
                                <th className="p-2 border">Thru</th>
                              </tr>
                            </thead>
                            <tbody>
                              {config.teams
                                .flatMap((team) =>
                                  team.players.map((player) => {
                                    const scores = userScores[player.name] || Array(18).fill(0);
                                    const { scoreToPar, thru } = calculateScoreToPar(scores, course);
                                    return { name: player.name, team: team.name, scoreToPar, thru };
                                  })
                                )
                                .sort((a, b) => a.scoreToPar - b.scoreToPar)
                                .map((entry, idx) => (
                                  <tr key={idx} className="border-t">
                                    <td className="p-2 border">{entry.name}</td>
                                    <td className="p-2 border" style={{ color: config.teams.find(t => t.name === entry.team)?.color }}>{entry.team}</td>
                                    <td className="p-2 border">{entry.scoreToPar >= 0 ? `+${entry.scoreToPar}` : entry.scoreToPar}</td>
                                    <td className="p-2 border">{entry.thru}</td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        ) : (
                          <table className="w-full text-sm text-left border border-gray-300 rounded">
                            <thead className="bg-gray-100 text-gray-800">
                              <tr>
                                <th className="p-2 border">Team</th>
                                <th className="p-2 border">Cumulative Score</th>
                                <th className="p-2 border">Top Performer</th>
                              </tr>
                            </thead>
                            <tbody>
                              {config.teams.map((team, teamIndex) => {
                                let teamScore = 0;
                                let topPerformer = { name: '', scoreToPar: Infinity };
                                team.players.forEach((player) => {
                                  const scores = userScores[player.name] || Array(18).fill(0);
                                  const { scoreToPar } = calculateScoreToPar(scores, course);
                                  teamScore += scoreToPar;
                                  if (scoreToPar < topPerformer.scoreToPar) {
                                    topPerformer = { name: player.name, scoreToPar };
                                  }
                                });
                                return (
                                  <tr key={teamIndex} className="border-t">
                                    <td className="p-2 border" style={{ color: team.color }}>{team.name}</td>
                                    <td className="p-2 border">{teamScore >= 0 ? `+${teamScore}` : teamScore}</td>
                                    <td className="p-2 border">
                                      {topPerformer.name} ({topPerformer.scoreToPar >= 0 ? `+${topPerformer.scoreToPar}` : topPerformer.scoreToPar})
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </>
                    ) : (
                      <div className="space-y-8">
                        {[...new Set(config.teams.flatMap(t => t.players.map(p => p.lineupOrder[roundIndex])))].map((_, groupIndex) => {
                          const group = config.teams.flatMap(t => t.players.filter(p => p.lineupOrder[roundIndex] === groupIndex));
                          if (group.length < 2) return null;

                          return (
                            <div key={groupIndex} className="bg-gray-100 p-4 rounded-lg shadow-inner border border-gray-300">
                              <h4 className="text-md font-semibold mb-3 text-[#0f172a]">
                                Group {groupIndex + 1}: {group.map(p => p.name).join(', ')}
                              </h4>
                              <div className="overflow-x-auto">
                                <table className="min-w-full text-sm text-center">
                                  <thead>
                                    {group.map((player, pIdx) => {
                                      const team = config.teams.find(t => t.players.some(p => p.name === player.name));
                                      return (
                                        <tr key={`header-${pIdx}`} className="bg-white" style={{ backgroundColor: team?.color || '#FFFFFF' }}>
                                          <th className="border p-2 font-medium text-left">{player.name}</th>
                                          {Array.from({ length: 18 }, (_, i) => (
                                            <td key={`p${pIdx}-${i}`} className="border p-2 bg-white">
                                              {userScores[player.name]?.[i] > 0 ? userScores[player.name][i] : '–'}
                                            </td>
                                          ))}
                                        </tr>
                                      );
                                    })}
                                    <tr className="bg-white">
                                      <th className="border p-2 font-medium text-left">Match Status</th>
                                      {Array.from({ length: 18 }, (_, i) => (
                                        <td key={`status-${i}`} className="border p-2">
                                          {group.map((p1, idx1) =>
                                            group.slice(idx1 + 1).map((p2) => {
                                              const net1 = userScores[p1.name] || Array(18).fill(0);
                                              const net2 = userScores[p2.name] || Array(18).fill(0);
                                              const { status, color } = calculateMatchStatus(net1, net2, i, p1.name, p2.name);
                                              return (
                                                <span key={`${p1.name}-vs-${p2.name}-${i}`} className={`inline-block w-12 ${color}`}>
                                                  {status}
                                                </span>
                                              );
                                            })
                                          )}
                                        </td>
                                      ))}
                                    </tr>
                                  </thead>
                                </table>
                              </div>
                              <div className="mt-3 text-gray-800">
                                {group.map((p1, idx1) =>
                                  group.slice(idx1 + 1).map((p2) => {
                                    const net1 = userScores[p1.name] || Array(18).fill(0);
                                    const net2 = userScores[p2.name] || Array(18).fill(0);
                                    const points = calculateMatchPoints(net1, net2);
                                    return (
                                      <p key={`${p1.name}-vs-${p2.name}`}>
                                        <strong>{p1.name} vs {p2.name} Points:</strong> {points} for {points === 1 ? p1.name : points === 0 ? p2.name : 'tie'}
                                      </p>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RoundScoreboard;