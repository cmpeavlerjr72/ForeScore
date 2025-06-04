import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ChartOptions, Plugin } from 'chart.js';
import { CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { EventConfig } from '../App';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

interface DashboardProps {
  config: EventConfig;
  setConfig: React.Dispatch<React.SetStateAction<EventConfig>>;
  setShowDashboard: React.Dispatch<React.SetStateAction<boolean>>;
}

interface Matchup {
  players: { player: string; teamName: string; teamColor: string }[];
  result: string;
}

const Dashboard: React.FC<DashboardProps> = ({ config, setConfig, setShowDashboard }) => {
  const [activeRound, setActiveRound] = useState<number>(0); // Track the active round tab

  // Define a list of distinct colors for teams
  const teamColors = [
    { background: '#ef4444', border: '#dc2626' }, // Red
    { background: '#3b82f6', border: '#1e40af' }, // Blue
    { background: '#10b981', border: '#059669' }, // Green
    { background: '#8b5cf6', border: '#7c3aed' }, // Purple
    { background: '#f97316', border: '#ea580c' }, // Orange
  ];

  // Assign colors to teams without repetition
  const teamColorAssignments = config.teams.map((_, index) => {
    const colorIndex = index % teamColors.length;
    return teamColors[colorIndex];
  });

  // Calculate total points per team (sum of player scores across all rounds)
  const points = config.teams.map((team) =>
    team.players.reduce(
      (teamTotal, player) =>
        teamTotal + player.scores.reduce((roundTotal, score) => roundTotal + score, 0),
      0
    )
  );

  const totalPoints = config.numRounds * (config.playersPerTeam * 2); // Max points per round per player pair
  const winThreshold = Math.ceil(totalPoints / 2); // Points needed to win

  // Chart data
  const chartData = {
    labels: config.teams.map((team) => team.name),
    datasets: [
      {
        data: points,
        backgroundColor: teamColorAssignments.map((color) => color.background),
        borderColor: teamColorAssignments.map((color) => color.border),
        borderWidth: 1,
      },
    ],
  };

  // Custom plugin for win threshold line
  const winThresholdPlugin: Plugin<'bar'> = {
    id: 'winThreshold',
    afterDraw: (chart) => {
      const ctx = chart.ctx;
      const xAxis = chart.scales.x;
      const thresholdX = xAxis.getPixelForValue(winThreshold);

      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([5, 5]); // Dotted line
      ctx.moveTo(thresholdX, chart.chartArea.top);
      ctx.lineTo(thresholdX, chart.chartArea.bottom);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#f59e0b'; // Yellow from Ryder Cup
      ctx.stroke();
      ctx.restore();

      // Add threshold label
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(`Win: ${winThreshold}`, thresholdX + 5, chart.chartArea.bottom - 5);
    },
  };

  // Typed chart options
  const chartOptions: ChartOptions<'bar'> = {
    indexAxis: 'y' as const, // Horizontal bars
    plugins: {
      legend: { display: false },
      datalabels: { anchor: 'end' as const, align: 'right' as const, color: '#fff', font: { weight: 'bold' } },
    },
    scales: {
      x: { beginAtZero: true, max: totalPoints, title: { display: true, text: 'Points' } },
      y: { title: { display: true, text: 'Teams' } },
    },
    maintainAspectRatio: false,
  };

  // Generate matchups for the active round using lineup order
  const matchups: Matchup[] = [];
  const maxPlayers = Math.max(...config.teams.map((team) => team.players.length));
  for (let i = 0; i < maxPlayers; i++) {
    const matchupPlayers: { player: string; teamName: string; teamColor: string }[] = [];
    config.teams.forEach((team, teamIndex) => {
      const playerIndex = team.players.findIndex(p => p.lineupOrder[activeRound] === i);
      const player = playerIndex !== -1 ? team.players[playerIndex] : null;
      matchupPlayers.push({
        player: player ? player.name : 'N/A',
        teamName: team.name,
        teamColor: teamColorAssignments[teamIndex].background,
      });
    });
    matchups.push({ players: matchupPlayers, result: 'TIED' });
  }

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <header className="bg-blue-700 text-white p-4 mb-6 rounded-t-lg">
        <h1 className="text-2xl font-bold">Bros Ryder Cup - Final Scores</h1>
      </header>
      <div className="bg-white p-6 rounded-b-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setShowDashboard(false)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Home
          </button>
          <button
            onClick={() => setShowDashboard(false)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Edit Configuration
          </button>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {config.teams.map((team, index) => (
            <div
              key={index}
              className="p-4 rounded text-white"
              style={{ backgroundColor: teamColorAssignments[index].background }}
            >
              <h2 className="text-xl font-semibold">{team.name}</h2>
              <p className="text-3xl">{points[index] === 0 ? '0' : `${points[index]}½`}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 h-64">
          <Bar data={chartData} options={chartOptions} plugins={[winThresholdPlugin]} />
        </div>
        <div className="border-t-4 border-yellow-400 my-4"></div>
        <p className="text-center text-gray-600 mb-6">Total Points: {totalPoints}</p>

        {/* Round Tabs */}
        <div className="mb-6">
          <div className="flex border-b border-gray-200">
            {Array.from({ length: config.numRounds }, (_, roundIndex) => (
              <button
                key={roundIndex}
                className={`px-4 py-2 font-medium text-sm ${
                  activeRound === roundIndex
                    ? 'border-b-2 border-blue-700 text-blue-700'
                    : 'text-gray-500 hover:text-blue-700'
                }`}
                onClick={() => setActiveRound(roundIndex)}
              >
                Round {roundIndex + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Round Scoreboard */}
        <div>
          <div className="bg-gray-200 p-2 mb-2 flex justify-between items-center">
            <h3 className="text-lg font-bold">
              {config.teams.map((team, index) => `${team.name} ${points[index]} ${index < config.teams.length - 1 ? '-' : ''}`).join(' ')}
            </h3>
            <span className="text-sm font-medium">
              Round {activeRound + 1} - {config.scoringMethods[activeRound]} Play
            </span>
          </div>
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                {config.teams.map((team, index) => (
                  <th
                    key={index}
                    className="px-4 py-2 text-left text-sm font-medium text-white border-b"
                    style={{ backgroundColor: teamColorAssignments[index].background }}
                  >
                    {team.name}
                  </th>
                ))}
                <th className="px-4 py-2 text-center text-sm font-medium text-gray-700 border-b">
                  Result
                </th>
              </tr>
            </thead>
            <tbody>
              {matchups.map((matchup, index) => (
                <tr key={index}>
                  {matchup.players.map((player, playerIndex) => (
                    <td
                      key={playerIndex}
                      className="px-4 py-2 border-b"
                      style={{ backgroundColor: player.teamColor }}
                    >
                      {player.player}
                    </td>
                  ))}
                  <td className="px-4 py-2 border-b text-center">{matchup.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;