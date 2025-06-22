// SetLineup.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { EventConfig } from '../App';

const SOCKET_URL = 'https://forescore-db.onrender.com';

const SetLineup: React.FC = () => {
  const { tripId } = useParams();
  const [config, setConfig] = useState<EventConfig | null>(null);
  const [activeTab, setActiveTab] = useState('Teams');

  useEffect(() => {
    const fetchTrip = async () => {
      if (!tripId) return;
      try {
        const res = await fetch(`${SOCKET_URL}/trips/${tripId}`);
        if (!res.ok) throw new Error('Failed to fetch trip');
        const data = await res.json();
        setConfig(data);
      } catch (err) {
        console.error('Error loading trip:', err);
      }
    };

    fetchTrip();
  }, [tripId]);

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading lineup data...</p>
      </div>
    );
  }

  const users = config.users || [];

  const renderTeamsTab = () => (
    <div className="flex flex-wrap gap-10">
      {config.teams.map((team, teamIndex) => (
        <div key={teamIndex}>
          <h3 className="text-lg font-semibold text-[#0f172a] mb-2">{team.name}</h3>
          {team.players.map((_, playerIndex) => (
            <div key={playerIndex} className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Player {playerIndex + 1}
              </label>
              <select className="w-64 border border-gray-300 rounded-md px-3 py-2">
                <option value="">Select user</option>
                {users.map((username) => (
                  <option key={username} value={username}>
                    {username}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const renderMatchPlayTab = (roundIndex: number) => (
    <div>
      <p className="text-sm text-gray-600 mb-4">
        This is a <span className="font-semibold">match play</span> round. Matchups will be configurable here.
      </p>
      {config.teams[0].players.map((_, groupIndex) => (
        <div key={groupIndex} className="mb-6">
          <h4 className="font-semibold mb-2">Group {groupIndex + 1}</h4>
          <div className="flex gap-6">
            {config.teams.map((team, teamIndex) => (
              <div key={teamIndex}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {team.name}
                </label>
                <select className="w-64 border border-gray-300 rounded-md px-3 py-2">
                  <option value="">Select player</option>
                  {users.map((username) => (
                    <option key={username} value={username}>
                      {username}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderStrokePlayTab = () => (
    <p className="text-sm text-gray-700">This is a <span className="font-semibold">stroke play</span> round. No matchup setup required.</p>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfdfb]">
      <Header showNav />
      <main className="flex-grow container mx-auto px-4 py-10">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-[#0f172a] mb-6">Set Lineup</h2>

          {/* Tab Buttons */}
          <div className="flex space-x-4 mb-6 border-b">
            <button
              onClick={() => setActiveTab('Teams')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'Teams'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-blue-500'
              }`}
            >
              Teams
            </button>
            {config.scoringMethods.map((method, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(`Round${index}`)}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === `Round${index}`
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                Round {index + 1} ({method})
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'Teams' && renderTeamsTab()}
          {config.scoringMethods.map((method, index) => (
            activeTab === `Round${index}` ? (
              <div key={index}>
                {method === 'match'
                  ? renderMatchPlayTab(index)
                  : renderStrokePlayTab()}
              </div>
            ) : null
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SetLineup;
