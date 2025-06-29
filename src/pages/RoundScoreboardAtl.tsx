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
  color?: string;
}

interface ExtendedEventConfig extends EventConfig {
  teams: TeamWithColor[];
}

const LIV_POINTS: number[] = [
  4.0, 3.0, 2.4, 1.8, 1.6, 1.4, 1.3, 1.2, 1.1, 1.0,
  0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.3, 0.2, 0.2, 0.2,
  0.1, 0.1, 0.1, 0.1
];

const computeStrokePlayProjectedPoints = (
  config: ExtendedEventConfig,
  scores: Record<string, Record<number, { net: number[] }>>,
  round: number
): Record<string, number> => {
  const course = golfCourses.find(c => c.name === config.courses[round]);
  if (!course) return {};

  const playersWithScores = config.teams.flatMap(team =>
    team.players.map(player => {
      const net = scores[player.name]?.[round]?.net || Array(18).fill(0);
      let scoreToPar = 0;
      for (let i = 0; i < 18; i++) {
        if (net[i] > 0) {
          scoreToPar += net[i] - course.par[i];
        }
      }
      return { name: player.name, scoreToPar };
    })
  );

  playersWithScores.sort((a, b) => a.scoreToPar - b.scoreToPar);

  const projectedPoints: Record<string, number> = {};
  let rank = 0;

  while (rank < playersWithScores.length) {
    const tiedGroup = [playersWithScores[rank]];
    let i = rank + 1;
    while (
      i < playersWithScores.length &&
      playersWithScores[i].scoreToPar === playersWithScores[rank].scoreToPar
    ) {
      tiedGroup.push(playersWithScores[i]);
      i++;
    }

    const totalPoints = tiedGroup.reduce((sum, _, idx) => {
      const pos = rank + idx;
      return sum + (LIV_POINTS[pos] || 0);
    }, 0);

    const avgPoints = totalPoints / tiedGroup.length;
    tiedGroup.forEach(player => {
      projectedPoints[player.name] = avgPoints;
    });

    rank += tiedGroup.length;
  }

  return projectedPoints;
};

const RoundScoreboard: React.FC = () => {
  const { tripId } = useParams();
  const [config, setConfig] = useState<ExtendedEventConfig | null>(null);
  const [userScores, setUserScores] = useState<Record<string, Record<number, { net: number[]; raw: number[] }>>>({}); // Store both net and raw scores
  const [activeTab, setActiveTab] = useState<'individual' | 'team'>('individual');
  const [selectedRound, setSelectedRound] = useState<number>(0);
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [nicknameMap, setNicknameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTrip();
  }, [tripId]);

  useEffect(() => {
    if (config && Object.keys(userScores).length > 0) {
      computeAndSaveProjectedPoints(config, userScores);
    }
  }, [config, userScores]);
  

  const computeAndSaveProjectedPoints = async (
    configData: ExtendedEventConfig,
    scores: Record<string, Record<number, { net: number[] }>>
  ) => {
    if (!tripId) return;
  
    for (let round = 0; round < configData.numRounds; round++) {
      const scoringMethod = configData.scoringMethods[round];
  
      if (scoringMethod === 'match') {
        const totals: Record<string, number> = {};
      
        for (let groupIndex = 0; groupIndex < configData.playersPerTeam; groupIndex++) {
          const group = configData.teams.map((team, teamIndex) => {
            const playerIndex = (groupIndex + teamIndex) % team.players.length;
            const player = team.players[playerIndex] || { name: `Player ${playerIndex + 1}`, scores: [], lineupOrder: [] };
            return { ...player, teamName: team.name, teamColor: team.color };
          });
      
          // ✅ Initialize group-level points object
          const groupPoints: Record<string, number> = {};
          group.forEach(player => {
            groupPoints[player.name] = 0;
          });
      
          // ✅ Run all matchups in group
          for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
              const p1 = group[i];
              const p2 = group[j];
              const net1 = scores[p1.name]?.[round]?.net || Array(18).fill(0);
              const net2 = scores[p2.name]?.[round]?.net || Array(18).fill(0);
      
              let currentHole = -1;
              for (let k = 0; k < 18; k++) {
                if (net1[k] > 0 && net2[k] > 0) currentHole = k;
                else break;
              }
      
              const { points, leader } = calculateProjectedPoints(p1.name, p2.name, currentHole, round);
      
              // ✅ Add to group points
              if (leader === 'tie') {
                groupPoints[p1.name] += 0.5;
                groupPoints[p2.name] += 0.5;
              } else {
                groupPoints[p1.name] += leader === p1.name ? 1 : 0;
                groupPoints[p2.name] += leader === p2.name ? 1 : 0;
              }
      
              console.log(`🏌️‍♂️ Match: ${p1.name} vs ${p2.name}`);
              console.log(`Holes completed: ${currentHole + 1}`);
              console.log(`Projected leader: ${leader}`);
              console.log(`Current group points: ${p1.name}=${groupPoints[p1.name]}, ${p2.name}=${groupPoints[p2.name]}`);
            }
          }
      
          // ✅ Add group results to totals
          for (const [username, points] of Object.entries(groupPoints)) {
            totals[username] = (totals[username] || 0) + points;
          }
        }
      
        // ✅ Save final totals
        for (const [username, points] of Object.entries(totals)) {
          console.log(`💾 Saving projected points for ${username} (Round ${round + 1}): ${points}`);
          await fetch(`${SOCKET_URL}/users/${username}/trips/${tripId}/save-projected-points`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ round, projectedPoints: points }),
          });
        }
  
      } else if (scoringMethod === 'stroke') {
        const strokePoints = computeStrokePlayProjectedPoints(configData, scores, round);
        for (const [username, points] of Object.entries(strokePoints)) {
          console.log(`💾 Saving stroke projected points for ${username} (Round ${round + 1}): ${points}`);
          await fetch(`${SOCKET_URL}/users/${username}/trips/${tripId}/save-projected-points`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ round, projectedPoints: points }),
          });
        }
      }
    }
  };
  
  

  const fetchTrip = async () => {
    if (!tripId) return;
    try {
      const response = await fetch(`${SOCKET_URL}/trips/${tripId}`);
      if (!response.ok) throw new Error('Failed to fetch trip');
      const data = await response.json() as ExtendedEventConfig;
      const updatedConfig: ExtendedEventConfig = {
        ...data,
        teams: data.teams.map((team: TeamWithColor, index: number) => ({
          ...team,
          color: team.color || getTeamColor(index),
        })),
      };
      setConfig(updatedConfig);

      const usernames = data.users || [];
      const nicknames : Record <string, string> = {};

    
      for (const username of usernames) {
        const res = await fetch(`${SOCKET_URL}/users/${username}`);
        const userData = await res.json();
        nicknames[username] = userData.name || username;
      }
      setNicknameMap(nicknames); 

      const allScores: Record<string, Record<number, { net: number[]; raw: number[] }>> = {};
      
      for (const username of usernames) {
        allScores[username] = {};
        for (let round = 0; round < updatedConfig.numRounds; round++) {
          const res = await fetch(`${SOCKET_URL}/users/${username}/trips/${tripId}/scores?round=${round}`);
          const scoreData = await res.json();
          allScores[username][round] = {
            net: Array.isArray(scoreData.net) && scoreData.net.length > 0 ? scoreData.net : Array(18).fill(0),
            raw: Array.isArray(scoreData.raw) && scoreData.raw.length > 0 ? scoreData.raw : Array(18).fill(0),
          };
        }
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
        if (s1[i] < s2[i]) p1_holes++;
        else if (s2[i] < s1[i]) p2_holes++;
      }
    }
    if (p1_holes > p2_holes) return 1;
    if (p1_holes === p2_holes) return 0.5;
    return 0;
  };

  const getMatchResultText = (s1: number[], s2: number[]) => {
    let p1_holes = 0;
    let p2_holes = 0;
    let completed = 0;
  
    for (let i = 0; i < 18; i++) {
      if (s1[i] > 0 && s2[i] > 0) {
        completed++;
        if (s1[i] < s2[i]) p1_holes++;
        else if (s2[i] < s1[i]) p2_holes++;
      }
    }
  
    const remaining = 18 - completed;
    const diff = Math.abs(p1_holes - p2_holes);
  
    if (p1_holes === p2_holes) return 'A/S';
    if (diff > remaining) return `${diff}&${remaining}`;
    return ''; // match still live
  };
  


  const calculateProjectedPoints = (
    playerName: string,
    opponentName: string,
    currentHole: number,
    round: number
  ): { points: number; leader: string } => {
    const net1 = userScores[playerName]?.[round]?.net || Array(18).fill(0);
    const net2 = userScores[opponentName]?.[round]?.net || Array(18).fill(0);
    const { status } = calculateMatchStatus(net1, net2, currentHole, playerName, opponentName);
  
    let leader = 'tie';
    if (status !== "AS") {
      const { diff } = calculateMatchStatus(net1, net2, currentHole, playerName, opponentName);
      leader = diff > 0 ? playerName : opponentName;
    }
  
    return {
      points: status === "AS" ? 0.5 : (status !== "0" ? 1 : 0),
      leader
    };
  };

  const calculateMatchStatus = (s1: number[], s2: number[], hole: number, p1Name: string, p2Name: string) => {
    let p1 = 0, p2 = 0;
    for (let i = 0; i <= hole && i < 18; i++) {
      if (s1[i] > 0 && s2[i] > 0) {
        if (s1[i] < s2[i]) p1++;
        else if (s2[i] < s1[i]) p2++;
      }
    }
    const diff = p1 - p2;
    if (p1 === p2) return { status: "AS", color: 'bg-gray-400', diff: 0 };
    const team1 = config?.teams.find(t => t.players.some(p => p.name === p1Name));
    const team2 = config?.teams.find(t => t.players.some(p => p.name === p2Name));
    const team1Color = team1?.color || '#60A5FA';
    const team2Color = team2?.color || '#F87171';
    return diff > 0
      ? { status: diff.toString(), color: `bg-[${team1Color}]`, diff }
      : { status: Math.abs(diff).toString(), color: `bg-[${team2Color}]`, diff: diff };
  };

  if (!config) return <div>Loading...</div>;

  const course = getCourseData(config.courses[selectedRound]);
  const scoringMethod = config.scoringMethods[selectedRound];

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

          <div className="mb-4">
            <div className="flex border-b border-gray-300">
              {Array.from({ length: config.numRounds }, (_, i) => (
                <button
                  key={i}
                  className={`px-4 py-2 font-medium ${
                    selectedRound === i
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setSelectedRound(i)}
                >
                  Round {i + 1} - {config.courses[i] || 'Unnamed Course'}
                </button>
              ))}
            </div>
          </div>

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
                    <>
                      <table className="w-full text-sm text-left border border-gray-300 rounded">
                        <thead className="bg-gray-100 text-gray-800">
                          <tr>
                            <th className="p-2 border">Player</th>
                            <th className="p-2 border">Team</th>
                            <th className="p-2 border">Net Score to Par</th>
                            <th className="p-2 border">Raw Score to Par</th>
                            <th className="p-2 border">Thru</th>
                          </tr>
                        </thead>
                        <tbody>
                          {config.teams
                            .flatMap((team) =>
                              team.players.map((player) => {
                                const scores = userScores[player.name]?.[selectedRound] || { net: Array(18).fill(0), raw: Array(18).fill(0) };
                                const { scoreToPar: netScoreToPar, thru } = calculateScoreToPar(scores.net, course);
                                const { scoreToPar: rawScoreToPar } = calculateScoreToPar(scores.raw, course);
                                return { name: player.name, team: team.name, netScoreToPar, rawScoreToPar, thru };
                              })
                            )
                            .sort((a, b) => a.netScoreToPar - b.netScoreToPar)
                            .map((entry, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="p-2 border cursor-pointer" onClick={() => setExpandedPlayer(expandedPlayer === entry.name ? null : entry.name)}>
                                  {entry.name}
                                </td>
                                <td className="p-2 border" style={{ color: config.teams.find(t => t.name === entry.team)?.color }}>{entry.team}</td>
                                <td className="p-2 border">{entry.netScoreToPar >= 0 ? `+${entry.netScoreToPar}` : entry.netScoreToPar}</td>
                                <td className="p-2 border">{entry.rawScoreToPar >= 0 ? `+${entry.rawScoreToPar}` : entry.rawScoreToPar}</td>
                                <td className="p-2 border">{entry.thru}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {expandedPlayer && config.teams.some(team => team.players.some(p => p.name === expandedPlayer)) && (
                        <div className="mt-4 p-4 bg-gray-100 rounded border">
                          <h4 className="text-lg font-semibold mb-2">Scorecard for {expandedPlayer}</h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-center text-sm">
                              <thead>
                                <tr className="bg-gray-200">
                                  <th className="p-2 border">Hole</th>
                                  {Array.from({ length: 18 }, (_, i) => (
                                    <th key={`hole-${i}`} className="p-2 border">{i + 1}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="bg-white">
                                  <th className="p-2 border">Net</th>
                                  {userScores[expandedPlayer]?.[selectedRound]?.net.map((score, i) => (
                                    <td key={`net-${i}`} className="p-2 border">{score > 0 ? score : '–'}</td>
                                  ))}
                                </tr>
                                <tr className="bg-white">
                                  <th className="p-2 border">Raw</th>
                                  {userScores[expandedPlayer]?.[selectedRound]?.raw.map((score, i) => (
                                    <td key={`raw-${i}`} className="p-2 border">{score > 0 ? score : '–'}</td>
                                  ))}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <button
                            onClick={() => setExpandedPlayer(null)}
                            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow"
                          >
                            Close
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <table className="w-full text-sm text-left border border-gray-300 rounded">
                        <thead className="bg-gray-100 text-gray-800">
                          <tr>
                            <th className="p-2 border">Team</th>
                            <th className="p-2 border">Cumulative Net Score</th>
                            <th className="p-2 border">Top Performer</th>
                          </tr>
                        </thead>
                        <tbody>
                          {config.teams.map((team, teamIndex) => {
                            const isExpanded = expandedTeam === team.name;
                            const teamScore = team.players.reduce((sum, player) => {
                              const scores = userScores[player.name]?.[selectedRound]?.net || Array(18).fill(0);
                              return sum + calculateScoreToPar(scores, course).scoreToPar;
                            }, 0);
                            let topPerformer = { name: '', scoreToPar: Infinity };
                            team.players.forEach((player) => {
                              const scores = userScores[player.name]?.[selectedRound]?.net || Array(18).fill(0);
                              const { scoreToPar } = calculateScoreToPar(scores, course);
                              if (scoreToPar < topPerformer.scoreToPar) {
                                topPerformer = { name: player.name, scoreToPar };
                              }
                            });
                            return (
                              <React.Fragment key={teamIndex}>
                                <tr className="border-t">
                                  <td className="p-2 border cursor-pointer" onClick={() => setExpandedTeam(isExpanded ? null : team.name)} style={{ color: team.color }}>
                                    {team.name}
                                  </td>
                                  <td className="p-2 border">{teamScore >= 0 ? `+${teamScore}` : teamScore}</td>
                                  <td className="p-2 border">
                                    {topPerformer.name} ({topPerformer.scoreToPar >= 0 ? `+${topPerformer.scoreToPar}` : topPerformer.scoreToPar})
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <tr>
                                    <td colSpan={3} className="p-2 border">
                                      <table className="w-full text-sm text-left border border-gray-300 rounded">
                                        <thead className="bg-gray-200">
                                          <tr>
                                            <th className="p-2 border">Player</th>
                                            <th className="p-2 border">Net Score to Par</th>
                                            <th className="p-2 border">Raw Score to Par</th>
                                            <th className="p-2 border">Thru</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {team.players
                                            .map(player => {
                                              const scores = userScores[player.name]?.[selectedRound] || { net: Array(18).fill(0), raw: Array(18).fill(0) };
                                              const { scoreToPar: netScoreToPar, thru } = calculateScoreToPar(scores.net, course);
                                              const { scoreToPar: rawScoreToPar } = calculateScoreToPar(scores.raw, course);
                                              return { name: player.name, netScoreToPar, rawScoreToPar, thru };
                                            })
                                            .sort((a, b) => a.netScoreToPar - b.netScoreToPar)
                                            .map((entry, idx) => (
                                              <tr key={idx} className="border-t">
                                                <td className="p-2 border">{entry.name}</td>
                                                <td className="p-2 border">{entry.netScoreToPar >= 0 ? `+${entry.netScoreToPar}` : entry.netScoreToPar}</td>
                                                <td className="p-2 border">{entry.rawScoreToPar >= 0 ? `+${entry.rawScoreToPar}` : entry.rawScoreToPar}</td>
                                                <td className="p-2 border">{entry.thru}</td>
                                              </tr>
                                            ))}
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </>
                  )}
                </>
              ) : (
                <div className="space-y-8">
                  {Array.from({ length: config.playersPerTeam }, (_, groupIndex) => {
                    const group = config.teams.map((team, teamIndex) => {
                      const playerIndex = (groupIndex + teamIndex) % team.players.length;
                      const player = team.players[playerIndex] || { name: `Player ${playerIndex + 1}`, scores: [], lineupOrder: [] };
                      return { ...player, teamName: team.name, teamColor: team.color };
                    });

                    if (group.length < 2) return null;

                    return (
                      <div key={groupIndex} className="bg-gray-100 p-4 rounded-lg border shadow-sm">
                        <h4 className="text-md font-semibold mb-2 text-[#0f172a]">
                          Group {groupIndex + 1}: {group.map(p => p.name).join(', ')}
                        </h4>

                        <table className="min-w-full text-sm mb-4">
                          <tbody>
                            <tr>
                              <td className="p-2"></td>
                              <td className="p-2"></td>
                              <td className="p-2 text-center font-bold text-[#0f172a]">Thru</td>
                              <td className="p-2"></td>
                              <td className="p-2"></td>
                            </tr>

                            {group.map((p1, idx1) =>
                              group.slice(idx1 + 1).map((p2) => {
                                const net1 = userScores[p1.name]?.[selectedRound]?.net || Array(18).fill(0);
                                const net2 = userScores[p2.name]?.[selectedRound]?.net || Array(18).fill(0);

                                let currentHole = -1;
                                for (let i = 0; i < 18; i++) {
                                  if (net1[i] > 0 && net2[i] > 0) currentHole = i;
                                  else break;
                                }

                                const { status: matchStatus, color: statusColor } = calculateMatchStatus(net1, net2, currentHole, p1.name, p2.name);
                                const matchResult = calculateMatchStatus(net1, net2, currentHole, p1.name, p2.name);
                                const isAllSquare = matchResult.status === 'AS';
                                const leadingPlayer = matchResult.diff > 0 ? p1.name : matchResult.diff < 0 ? p2.name : null;
                              
                                const matchKey = `${groupIndex}-${p1.name}-${p2.name}`;
                                const isExpanded = expandedMatch === matchKey;

                                return (
                                  <React.Fragment key={matchKey}>
                                    <tr
                                      className="cursor-pointer"
                                      onClick={() => setExpandedMatch(isExpanded ? null : matchKey)}
                                    >
                                      <td className={`p-2 text-right font-semibold ${p1.name === leadingPlayer ? 'text-white' : ''} ${isAllSquare ? 'bg-gray-400 text-white' : ''}`}
                                        style={{ backgroundColor: p1.name === leadingPlayer ? p1.teamColor : isAllSquare ? '#9ca3af' : '' }}>
                                          {p1.name === leadingPlayer || isAllSquare ? matchResult.status : ''}
                                        </td>
                                      <td
                                        className={`p-2 text-right font-semibold ${p1.name === leadingPlayer ? 'text-white' : ''} ${isAllSquare ? 'bg-gray-400 text-white' : ''}`}
                                        style={{ backgroundColor: p1.name === leadingPlayer ? p1.teamColor : isAllSquare ? '#9ca3af' : '' }}
                                      >
                                        {p1.name}
                                      </td>
                                      <td className="p-2 bg-[#1e293b] text-white font-bold text-center">
                                        {Math.min(net1.filter(n => n > 0).length, net2.filter(n => n > 0).length)}
                                      </td>

                                      <td
                                        className={`p-2 text-left font-semibold ${p2.name === leadingPlayer ? 'text-white' : ''} ${isAllSquare ? 'bg-gray-400 text-white' : ''}`}
                                        style={{ backgroundColor: p2.name === leadingPlayer ? p2.teamColor : isAllSquare ? '#9ca3af' : '' }}
                                      >
                                        {p2.name}
                                      </td>
                                      <td className={`p-2 text-left font-semibold ${p2.name === leadingPlayer ? 'text-white' : ''} ${isAllSquare ? 'bg-gray-400 text-white' : ''}`}
                                        style={{ backgroundColor: p2.name === leadingPlayer ? p2.teamColor : isAllSquare ? '#9ca3af' : '' }}>
                                          {p2.name === leadingPlayer || isAllSquare ? matchResult.status : ''}
                                        </td>
                                    </tr>

                                    {isExpanded && (
                                      <tr>
                                        <td colSpan={4}>
                                          <div className="overflow-x-auto mt-3">
                                            <table className="min-w-full text-xs text-center border border-gray-300">
                                              <thead className="bg-gray-200">
                                                <tr>
                                                  <th className="p-2 border">Hole</th>
                                                  {Array.from({ length: 18 }, (_, i) => (
                                                    <th key={i} className="p-2 border">{i + 1}</th>
                                                  ))}
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {[p1, p2].map((player, idx) => (
                                                  <tr key={player.name} className="bg-white">
                                                    <td className="p-2 border font-medium">{player.name}</td>
                                                    {userScores[player.name]?.[selectedRound]?.net.map((score, i) => (
                                                      <td key={i} className="p-2 border">{score > 0 ? score : '–'}</td>
                                                    ))}
                                                  </tr>
                                                ))}
                                                <tr className="bg-gray-100">
                                                  <td className="p-2 border font-medium">Status</td>
                                                  {Array.from({ length: 18 }, (_, i) => {
                                                    const { status, color } = calculateMatchStatus(net1, net2, i, p1.name, p2.name);
                                                    return (
                                                      <td key={i} className={`p-2 border ${color}`}>
                                                        {status}
                                                      </td>
                                                    );
                                                  })}
                                                </tr>
                                              </tbody>
                                            </table>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RoundScoreboard;