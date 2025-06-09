import React from 'react';
import { EventConfig } from '../App';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { GolfCourse, golfCourses } from '../types/GolfCourse';

interface RoundScoreboardProps {
  config: EventConfig;
}

const RoundScoreboard: React.FC<RoundScoreboardProps> = ({ config }) => {
  const getCourseData = (courseName: string): GolfCourse | undefined =>
    golfCourses.find((course) => course.name === courseName);

  const calculateMatchPoints = (playerScore: number, opponentScore: number, scoringMethod: 'match' | 'stroke'): number => {
    if (scoringMethod === 'match') {
      if (playerScore > opponentScore) return 1;
      else if (playerScore === opponentScore) return 0.5;
      return 0;
    }
    return playerScore; // For stroke play, return the raw score
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="ForeScore - Round Scoreboard" />
      <main className="flex-grow container mx-auto p-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Round-by-Round Scoreboard</h2>
          {Array.from({ length: config.numRounds }, (_, roundIndex) => {
            const course = getCourseData(config.courses[roundIndex]);
            const scoringMethod = config.scoringMethods[roundIndex];

            return (
              <div key={roundIndex} className="mb-8">
                <h3 className="text-lg font-semibold mb-4">
                  Round {roundIndex + 1} ({scoringMethod} Play) - {config.courses[roundIndex]}
                </h3>
                {course && (
                  <table className="w-full border-collapse mb-4">
                    <thead>
                      <tr>
                        <th className="border p-2">Hole</th>
                        <th className="border p-2">Par</th>
                        <th className="border p-2">Handicap</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 18 }, (_, holeIndex) => (
                        <tr key={holeIndex}>
                          <td className="border p-2">{holeIndex + 1}</td>
                          <td className="border p-2">{course.par[holeIndex]}</td>
                          <td className="border p-2">{course.handicap[holeIndex]}</td>
                        </tr>
                      ))}
                      <tr>
                        <td className="border p-2">Out</td>
                        <td className="border p-2">{course.par.slice(0, 9).reduce((a, b) => a + b, 0)}</td>
                        <td className="border p-2"></td>
                      </tr>
                      <tr>
                        <td className="border p-2">In</td>
                        <td className="border p-2">{course.par.slice(9).reduce((a, b) => a + b, 0)}</td>
                        <td className="border p-2"></td>
                      </tr>
                      <tr>
                        <td className="border p-2">Total</td>
                        <td className="border p-2">{course.par.reduce((a, b) => a + b, 0)}</td>
                        <td className="border p-2"></td>
                      </tr>
                    </tbody>
                  </table>
                )}

                {scoringMethod === 'match' ? (
                  <div>
                    {config.teams[0].players.map((player1, playerIndex1) => {
                      const player2 = config.teams[1].players.find(
                        (p) => p.lineupOrder[roundIndex] === player1.lineupOrder[roundIndex]
                      );
                      if (!player2) return null;

                      const player1Score = player1.scores[roundIndex] || 0;
                      const player2Score = player2.scores[roundIndex] || 0;
                      const pointsEarned = calculateMatchPoints(player1Score, player2Score, scoringMethod);

                      return (
                        <div key={playerIndex1} className="mb-4 p-4 bg-gray-100 rounded-lg">
                          <h4 className="text-md font-medium mb-2">
                            {player1.name} (Team 1) vs {player2.name} (Team 2)
                          </h4>
                          <table className="w-full border-collapse">
                            <tbody>
                              <tr>
                                <td className="border p-2">Score</td>
                                <td className="border p-2">{player1Score}</td>
                                <td className="border p-2">{player2Score}</td>
                              </tr>
                              <tr>
                                <td className="border p-2">Points Earned</td>
                                <td className="border p-2" colSpan={2}>
                                  {pointsEarned} (for Team 1)
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border p-2">Team</th>
                        <th className="border p-2">Player</th>
                        <th className="border p-2">Score</th>
                        <th className="border p-2">Opponent</th>
                        <th className="border p-2">Opponent Score</th>
                        <th className="border p-2">Points Earned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {config.teams.map((team, teamIndex) => {
                        const opponentTeamIndex = teamIndex === 0 ? 1 : 0;
                        const opponentTeam = config.teams[opponentTeamIndex];
                        return team.players.map((player, playerIndex) => {
                          const opponentPlayerIndex = opponentTeam.players.findIndex(
                            (oppPlayer) =>
                              oppPlayer.lineupOrder[roundIndex] === player.lineupOrder[roundIndex]
                          );
                          const opponentPlayer = opponentTeam.players[opponentPlayerIndex];
                          const score = player.scores[roundIndex] || 0;
                          const opponentScore = opponentPlayer?.scores[roundIndex] || 0;
                          const pointsEarned = calculateMatchPoints(score, opponentScore, scoringMethod);

                          return (
                            <tr key={`${teamIndex}-${playerIndex}`}>
                              <td className="border p-2">{team.name}</td>
                              <td className="border p-2">{player.name}</td>
                              <td className="border p-2">{score}</td>
                              <td className="border p-2">{opponentPlayer?.name || 'N/A'}</td>
                              <td className="border p-2">{opponentScore}</td>
                              <td className="border p-2">{pointsEarned}</td>
                            </tr>
                          );
                        });
                      })}
                    </tbody>
                  </table>
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