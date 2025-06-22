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

const Dashboard: React.FC = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [config, setConfig] = useState<EventConfig | null>(null);
  const [editScores, setEditScores] = useState<string[][][]>([]);
  const currentUsername = localStorage.getItem('username') || ''; // ✅ Read current user

  useEffect(() => {
    const fetchTrip = async () => {
      if (!tripId) return;
      try {
        const res = await fetch(`${SOCKET_URL}/trips/${tripId}`);
        if (!res.ok) throw new Error('Failed to fetch trip');
        const data = await res.json();
        setConfig(data);
        setEditScores(
          data.teams.map((team: any) =>
            team.players.map((player: any) =>
              player.scores.map((score: number) => score.toString())
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
    return config.teams.map((team, teamIndex) => {
      let totalTeamScore = 0;
      team.players.forEach((player) => {
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
                            {score}
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
