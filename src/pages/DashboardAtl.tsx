import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import Header from '../components/Header';
import Footer from '../components/Footer';
import { EventConfig } from '../App';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

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

const Dashboard: React.FC = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [config, setConfig] = useState<ExtendedEventConfig | null>(null);
  const [editScores, setEditScores] = useState<string[][][]>([]);
  const currentUsername = localStorage.getItem('username') || ''; // ✅ Read current user

  useEffect(() => {
    const fetchTrip = async () => {
      if (!tripId) return;
      try {
        const res = await fetch(`${SOCKET_URL}/trips/${tripId}`);
        if (!res.ok) throw new Error('Failed to fetch trip');
        const data = await res.json() as ExtendedEventConfig; // Type assertion
        // Assign colors to teams if not already present
        const updatedConfig: ExtendedEventConfig = {
          ...data,
          teams: data.teams.map((team: TeamWithColor, index: number) => ({
            ...team,
            color: team.color || getTeamColor(index),
          })),
        };
        setConfig(updatedConfig);
        setEditScores(
          updatedConfig.teams.map((team) =>
            team.players.map((player) =>
              player.scores.map((score) => (score !== undefined ? score.toString() : '0'))
            )
          )
        );
      } catch (err) {
        console.error('Error loading trip:', err);
      }
    };

    fetchTrip();
  }, [tripId]);

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading trip data...</p>
      </div>
    );
  }

  const calculateTotalScores = () => {
    return config.teams.map((team) => {
      let totalTeamScore = 0;
      team.players.forEach((player) => {
        if (!player.scores || !player.lineupOrder || player.scores.length !== config.numRounds) return;
        player.scores.forEach((score, roundIndex) => {
          const scoringMethod = config.scoringMethods[roundIndex];
          if (scoringMethod === 'match') {
            const group = config.teams
              .flatMap(t => t.players.filter(p => p.lineupOrder?.[roundIndex] === player.lineupOrder[roundIndex]))
              .filter(p => p.scores?.[roundIndex] !== undefined && p.name !== player.name);
            if (group.length === 0) return; // No valid opponents
            group.forEach((opponent) => {
              const opponentScore = opponent.scores[roundIndex] || 0;
              if (score > opponentScore) totalTeamScore += 1 / group.length; // Equal point share per win
              else if (score === opponentScore) totalTeamScore += 0.5 / group.length; // Equal tie share
            });
          } else if (scoringMethod === 'stroke') {
            totalTeamScore += score || 0;
          }
        });
      });
      return Math.round(totalTeamScore * 10) / 10; // Round to 1 decimal place
    });
  };

  const totalScores = calculateTotalScores();

  const chartData = {
    labels: config.teams.map((team) => team.name || `Team ${config.teams.indexOf(team) + 1}`), // Fallback label
    datasets: [
      {
        label: 'Total Score',
        data: totalScores,
        backgroundColor: config.teams.map((team) => team.color || '#CCCCCC'), // Fallback color
        borderColor: config.teams.map((team) => (team.color?.replace(/../, '#') || '#999999')), // Darken border with fallback
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
        formatter: (value: number) => (value !== undefined ? value.toString() : '0'),
      },
    },
  };

  const handleSetLineup = () => {
    navigate(`/set-lineup/${tripId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfdfb]">
      <Header showNav />
      <main className="flex-grow container mx-auto px-4 py-10">
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-[#0f172a] mb-4">
            Team Score Totals
          </h2>
          <Bar data={chartData} options={chartOptions} />
        </section>

        <section className="bg-white rounded-lg shadow-md p-6">
          {config.teams.map((team, teamIndex) => (
            <div key={teamIndex} className="mb-8" style={{ borderLeft: `4px solid ${team.color || '#CCCCCC'}` }}>
              <h3 className="text-lg font-semibold text-[#0f172a] mb-4" style={{ color: team.color || '#000000' }}>
                {team.name || `Team ${teamIndex + 1}`}
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
                        <td className="px-4 py-2 border font-medium">{player.name || `Player ${playerIndex + 1}`}</td>
                        {Array.from({ length: config.numRounds }, (_, roundIndex) => (
                          <td key={roundIndex} className="px-4 py-2 border">
                            {player.scores[roundIndex] !== undefined ? player.scores[roundIndex] : 'N/A'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* ✅ Conditionally show "Set Lineup" if you're the trip leader */}
          {currentUsername === config.tripLeader && (
            <div className="flex flex-wrap gap-4 mt-6">
              <button
                onClick={handleSetLineup}
                className="bg-[#34d399] hover:bg-[#10b981] text-white font-semibold px-5 py-2 rounded-md shadow transition"
              >
                Set Lineup
              </button>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;