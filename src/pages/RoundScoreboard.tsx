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

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="ForeScore - Round Scoreboard" />
      <main className="flex-grow container mx-auto p-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Round-by-Round Scoreboard</h2>
          {Array.from({ length: config.numRounds }, (_, roundIndex) => {
            const course = getCourseData(config.courses[roundIndex]);
            return (
              <div key={roundIndex} className="mb-8">
                <h3 className="text-lg font-semibold mb-4">
                  Round {roundIndex + 1} ({config.scoringMethods[roundIndex]} Play) - {config.courses[roundIndex]}
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
                    </tbody>
                  </table>
                )}
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
                        const score = player.scores[roundIndex];
                        const opponentScore = opponentPlayer?.scores[roundIndex] || 0;
                        const scoringMethod = config.scoringMethods[roundIndex];
                        let pointsEarned = 0;

                        if (scoringMethod === 'match') {
                          if (score > opponentScore) pointsEarned = 1;
                          else if (score === opponentScore) pointsEarned = 0.5;
                        } else if (scoringMethod === 'stroke') {
                          pointsEarned = score;
                        }

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