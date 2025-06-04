import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ChartOptions, Plugin } from 'chart.js';
import { CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { EventConfig } from '../App';
import logo from '../assets/ForeScore.png'; // Adjust the path and file name as needed

// Register Chart.js components and the datalabels plugin
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

const Dashboard: React.FC<DashboardProps> = ({ config, setConfig, setShowDashboard }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editScores, setEditScores] = useState(
    config.teams.map((team) =>
      team.players.map((player) => player.scores.map((score) => score.toString()))
    )
  );

  const calculateTotalScores = () => {
    return config.teams.map((team, teamIndex) => {
      let totalTeamScore = 0;
      team.players.forEach((player, playerIndex) => {
        player.scores.forEach((score, roundIndex) => {
          const opponentTeamIndex = teamIndex === 0 ? 1 : 0;
          const opponentPlayerIndex = config.teams[opponentTeamIndex].players.findIndex(
            (oppPlayer) =>
              oppPlayer.lineupOrder[roundIndex] === player.lineupOrder[roundIndex]
          );
          const opponentScore =
            config.teams[opponentTeamIndex].players[opponentPlayerIndex]?.scores[roundIndex] || 0;
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
    <div className="container mx-auto p-4">
      <header className="bg-blue-700 text-white p-4 mb-6 rounded-t-lg flex items-center justify-center gap-4">
        <img src={logo} alt="ForeScore Logo" className="h-12" />
        <h1 className="text-2xl font-bold">ForeScore - Final Scores</h1>
      </header>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <Bar data={chartData} options={chartOptions} />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        {config.teams.map((team, teamIndex) => (
          <div key={teamIndex} className="mb-6">
            <h2 className="text-xl font-semibold mb-4">{team.name}</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2">Player</th>
                  {Array.from({ length: config.numRounds }, (_, roundIndex) => (
                    <th key={roundIndex} className="border p-2">
                      Round {roundIndex + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {team.players.map((player, playerIndex) => (
                  <tr key={playerIndex}>
                    <td className="border p-2">{player.name}</td>
                    {player.scores.map((score, roundIndex) => (
                      <td key={roundIndex} className="border p-2">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editScores[teamIndex][playerIndex][roundIndex]}
                            onChange={(e) =>
                              handleScoreChange(
                                teamIndex,
                                playerIndex,
                                roundIndex,
                                e.target.value
                              )
                            }
                            className="w-16 border rounded p-1"
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
        ))}
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleBackToConfig}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
          >
            Back to Configuration
          </button>
          {isEditing ? (
            <button
              onClick={handleSaveScores}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Save Scores
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Edit Scores
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;