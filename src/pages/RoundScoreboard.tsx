import React, { useState } from 'react';
import { EventConfig } from '../App';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { GolfCourse, golfCourses } from '../types/GolfCourse';

interface RoundScoreboardProps {
  config: EventConfig;
}

const RoundScoreboard: React.FC<RoundScoreboardProps> = ({ config }) => {
  const [activeTab, setActiveTab] = useState<'individual' | 'team'>('individual');

  const getCourseData = (courseName: string): GolfCourse | undefined =>
    golfCourses.find((course) => course.name === courseName);

  const calculateMatchPoints = (
    playerScore: number,
    opponentScore: number,
    scoringMethod: 'match' | 'stroke'
  ): number => {
    if (scoringMethod === 'match') {
      if (playerScore > opponentScore) return 1;
      else if (playerScore === opponentScore) return 0.5;
      return 0;
    }
    return playerScore;
  };

  const calculateScoreToPar = (scores: number[], course: GolfCourse) => {
    let score = 0;
    let thru = 0;
    for (let i = 0; i < scores.length; i++) {
      if (scores[i] > 0) {
        score += scores[i] - course.par[i];
        thru++;
      }
    }
    return { scoreToPar: score, thru };
  };

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

                    {/* Stroke Play Tabbed View */}
                    {scoringMethod === 'stroke' ? (
                      <>
                        {/* Tabs */}
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
                                    const { scoreToPar, thru } = calculateScoreToPar(player.scores[roundIndex], course);
                                    return {
                                      name: player.name,
                                      team: team.name,
                                      scoreToPar,
                                      thru,
                                    };
                                  })
                                )
                                .sort((a, b) => a.scoreToPar - b.scoreToPar)
                                .map((entry, idx) => (
                                  <tr key={idx} className="border-t">
                                    <td className="p-2 border">{entry.name}</td>
                                    <td className="p-2 border">{entry.team}</td>
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
                                  const { scoreToPar } = calculateScoreToPar(player.scores[roundIndex], course);
                                  teamScore += scoreToPar;
                                  if (scoreToPar < topPerformer.scoreToPar) {
                                    topPerformer = { name: player.name, scoreToPar };
                                  }
                                });

                                return (
                                  <tr key={teamIndex} className="border-t">
                                    <td className="p-2 border">{team.name}</td>
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
                      // Match Play View
                      <div className="space-y-8">
                        {config.teams[0].players.map((player1, playerIndex1) => {
                          const player2 = config.teams[1].players.find(
                            (p) => p.lineupOrder[roundIndex] === player1.lineupOrder[roundIndex]
                          );
                          if (!player2) return null;

                          const player1Score = player1.scores[roundIndex] || 0;
                          const player2Score = player2.scores[roundIndex] || 0;
                          const pointsEarned = calculateMatchPoints(player1Score, player2Score, 'match');

                          return (
                            <div
                              key={playerIndex1}
                              className="bg-gray-100 p-4 rounded-lg shadow-inner border border-gray-300"
                            >
                              <h4 className="text-md font-semibold mb-3 text-[#0f172a]">
                                Match: {player1.name} (Team 1) vs {player2.name} (Team 2)
                              </h4>
                              <div className="overflow-x-auto">
                                <table className="min-w-full text-sm text-center">
                                  <thead>
                                    <tr className="bg-white">
                                      <th className="border p-2 font-medium text-left">{player1.name}</th>
                                      {Array.from({ length: 18 }, (_, i) => (
                                        <td key={`p1-${i}`} className="border p-2 bg-white">–</td>
                                      ))}
                                    </tr>
                                    <tr className="bg-white">
                                      <th className="border p-2 font-medium text-left">{player2.name}</th>
                                      {Array.from({ length: 18 }, (_, i) => (
                                        <td key={`p2-${i}`} className="border p-2 bg-white">–</td>
                                      ))}
                                    </tr>
                                  </thead>
                                </table>
                              </div>
                              <div className="mt-3 text-gray-800">
                                <p>
                                  <strong>Team 1 Points Earned:</strong> {pointsEarned}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
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
