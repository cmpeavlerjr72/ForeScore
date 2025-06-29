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

const getTeamColor = (index: number): string => {
  const colors = [
    '#60A5FA', '#F87171', '#34D399', '#FBBF24', '#A78BFA',
    '#F472B6', '#6EE7B7', '#FDE047', '#C4B5FD', '#FB923C',
  ];
  return colors[index % colors.length];
};

const Dashboard: React.FC = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [config, setConfig] = useState<ExtendedEventConfig | null>(null);
  const [projectedPointsByUser, setProjectedPointsByUser] = useState<
    Record<string, number[]>
  >({});
  const currentUsername = localStorage.getItem('username') || '';

  useEffect(() => {
    const fetchTrip = async () => {
      if (!tripId) return;
      try {
        const res = await fetch(`${SOCKET_URL}/trips/${tripId}`);
        const data = await res.json() as ExtendedEventConfig;
        const updatedConfig: ExtendedEventConfig = {
          ...data,
          teams: data.teams.map((team, index) => ({
            ...team,
            color: team.color || getTeamColor(index),
          })),
        };
        setConfig(updatedConfig);
      } catch (err) {
        console.error('Error loading trip:', err);
      }
    };

    const fetchProjectedPoints = async () => {
      if (!tripId) return;
      try {
        const res = await fetch(`${SOCKET_URL}/trips/${tripId}/projected-points`);
        const data = await res.json(); // { playerName: [r1, r2, ...] }
        setProjectedPointsByUser(data);
        console.log('Data Gathered:', data);
      } catch (err) {
        console.error('Failed to fetch projected points:', err);
      }
    };

    fetchTrip();
    fetchProjectedPoints();
  }, [tripId]);

  if (!config) {
    return <div>Loading...</div>;
  }

  const calculateTeamTotals = () => {
    return config.teams.map((team) => {
      let total = 0;
      team.players.forEach((player) => {
        const scores = projectedPointsByUser[player.name] || [];
        total += scores.reduce((sum, val) => sum + (val || 0), 0);
      });
      return Math.round(total * 10) / 10;
    });
  };

  const chartData = {
    labels: config.teams.map((team) => team.name),
    datasets: [
      {
        label: 'Projected Points',
        data: calculateTeamTotals(),
        backgroundColor: config.teams.map((t) => t.color || '#CCC'),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Projected Points by Team' },
      datalabels: {
        anchor: 'end',
        align: 'end',
        formatter: (val: number) => val.toFixed(1),
      },
    },
    scales: {
      x: { beginAtZero: true },
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfdfb]">
      <Header showNav />
      <main className="flex-grow container mx-auto px-4 py-10">
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-[#0f172a] mb-4">
            Team Projected Points
          </h2>
          <Bar data={chartData} options={chartOptions} />
        </section>

        <section className="bg-white rounded-lg shadow-md p-6">
          {config.teams.map((team, teamIndex) => (
            <div key={teamIndex} className="mb-8" style={{ borderLeft: `4px solid ${team.color}` }}>
              <h3 className="text-lg font-semibold text-[#0f172a] mb-4" style={{ color: team.color }}>
                {team.name}
              </h3>
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
                      {Array.from({ length: config.numRounds }, (_, roundIndex) => (
                        <td key={roundIndex} className="px-4 py-2 border">
                          {projectedPointsByUser[player.name]?.[roundIndex]?.toFixed(1) || '0.0'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {currentUsername === config.tripLeader && (
            <div className="flex flex-wrap gap-4 mt-6">
              <button
                onClick={() => navigate(`/set-lineup/${tripId}`)}
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
