import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ChartOptions } from 'chart.js';
import {
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { EventConfig } from '../App';
import Header from '../components/Header';
import Footer from '../components/Footer';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface DashboardProps {
  config: EventConfig;
  setConfig: React.Dispatch<React.SetStateAction<EventConfig>>;
  setShowDashboard: React.Dispatch<React.SetStateAction<boolean>>;
}

const Dashboard: React.FC<DashboardProps> = ({
  config,
  setConfig,
  setShowDashboard,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editScores, setEditScores] = useState(
    config.teams.map((team) =>
      team.players.map((player) =>
        player.scores.map((score) => score.toString())
      )
    )
  );

  const calculateTotalScores = () => {
    return config.teams.map((team, teamIndex) => {
      let totalTeamScore = 0;
      team.players.forEach((player, playerIndex) => {
        player.scores.forEach((score, roundIndex) => {
          const opponentTeamIndex = teamIndex === 0 ? 1 : 0;
          const opponentPlayerIndex =
            config.teams[opponentTeamIndex].players.findIndex(
              (oppPlayer) =>
                oppPlayer.lineupOrder[roundIndex] ===
                player.lineupOrder[roundIndex]
            );
          const opponentScore =
            config.teams[opponentTeamIndex].players[opponentPlayerIndex]
              ?.scores[roundIndex] || 0;
          const scoringMethod = config.scoringMethods[roundIndex];

          if (scoringMethod === 'match') {
            if (score > opponentScore) totalTeamScore += 1;
            else if (score === opponentScore) totalTeamScore += 0.5;
          } else if (scoringMethod === 'stroke') {
            totalTeamScore += score;
          }
        });
      });
      return totalTeamScore;
    });
  };

  const totalScores = calculateTotalScores();

  const chartData = {
    labels: config.teams.map((team) => team.name),
    datasets: [
      {
        label: 'Total Score',
        data: totalScores,
        backgroundColor: ['#60A5FA', '#F87171'],
        borderColor: ['#2563EB', '#DC2626'],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Points',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Teams',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Total Scores by Team',
      },
      datalabels: {
        anchor: 'end',
        align: 'end',
        formatter: (value: number) => value.toString(),
      },
    },
  };

  const handleScoreChange = (
    teamIndex: number,
    playerIndex: number,
    roundIndex: number,
    value: string
  ) => {
    const newEditScores = [...editScores];
    newEditScores[teamIndex][playerIndex][roundIndex] = value;
    setEditScores(newEditScores);
  };

  const handleSaveScores = () => {
    const newTeams = config.teams.map((team, teamIndex) => ({
      ...team,
      players: team.players.map((player, playerIndex) => ({
        ...player,
        scores: editScores[teamIndex][playerIndex].map((score) =>
          parseInt(score) || 0
        ),
      })),
    }));
    setConfig((prev) => ({ ...prev, teams: newTeams }));
    setIsEditing(false);
  };

  const handleBackToConfig = () => {
    setShowDashboard(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfdfb]">
      <Header showNav />
      <main className="flex-grow container mx-auto px-4 py-10">
        {/* Chart Section */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-[#0f172a] mb-4">
            Team Score Totals
          </h2>
          <Bar data={chartData} options={chartOptions} />
        </section>

        {/* Scores Table */}
        <section className="bg-white rounded-lg shadow-md p-6">
          {config.teams.map((team, teamIndex) => (
            <div key={teamIndex} className="mb-8">
              <h3 className="text-lg font-semibold text-[#0f172a] mb-4">
                {team.name}
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th className="px-4 py-2 border">Player</th>
                      {Array.from({ length: config.numRounds }, (_, roundIndex) => (
                        <th key={roundIndex} className="px-4 py-2 border">
                          Round {roundIndex + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {team.players.map((player, playerIndex) => (
                      <tr key={playerIndex} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border font-medium">{player.name}</td>
                        {player.scores.map((score, roundIndex) => (
                          <td key={roundIndex} className="px-4 py-2 border">
                            {isEditing ? (
                              <input
                                type="number"
                                value={
                                  editScores[teamIndex][playerIndex][roundIndex]
                                }
                                onChange={(e) =>
                                  handleScoreChange(
                                    teamIndex,
                                    playerIndex,
                                    roundIndex,
                                    e.target.value
                                  )
                                }
                                className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center"
                              />
                            ) : (
                              score
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Buttons */}
          <div className="flex flex-wrap gap-4 mt-6">
            <button
              onClick={handleBackToConfig}
              className="bg-gray-300 text-gray-800 px-5 py-2 rounded-md hover:bg-gray-400 transition"
            >
              Back to Configuration
            </button>
            {isEditing ? (
              <button
                onClick={handleSaveScores}
                className="bg-[#0f172a] text-white px-5 py-2 rounded-md hover:bg-[#1e293b] transition"
              >
                Save Scores
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-[#facc15] hover:bg-[#eab308] text-[#0f172a] font-semibold px-5 py-2 rounded-md shadow transition"
              >
                Edit Scores
              </button>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
