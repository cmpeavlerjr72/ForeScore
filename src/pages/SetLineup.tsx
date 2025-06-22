import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const SOCKET_URL = 'https://forescore-db.onrender.com';

const SetLineup: React.FC = () => {
  const { tripId } = useParams();
  const [tripData, setTripData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Teams');
  const [teamAssignments, setTeamAssignments] = useState<{ [teamIndex: number]: string[] }>({});
  const [matchPlaySelections, setMatchPlaySelections] = useState<{ [roundIndex: number]: { [groupIndex: number]: string[] } }>({});

  useEffect(() => {
    const fetchTrip = async () => {
      if (!tripId) return;
      try {
        const res = await fetch(`${SOCKET_URL}/trips/${tripId}`);
        const data = await res.json();
        setTripData(data);

        // Initialize teamAssignments and matchPlaySelections
        const initialAssignments: { [teamIndex: number]: string[] } = {};
        data.teams.forEach((_: any, teamIdx: number) => {
          initialAssignments[teamIdx] = Array(data.teams[teamIdx].players.length).fill('');
        });
        setTeamAssignments(initialAssignments);

        const matchPlayRounds = data.scoringMethods.map((type: string, idx: number) =>
          type === 'match' ? idx : null
        ).filter((x: number | null) => x !== null) as number[];

        const initialMatchPlay: typeof matchPlaySelections = {};
        matchPlayRounds.forEach(roundIdx => {
          initialMatchPlay[roundIdx] = {};
          const numGroups = data.teams[0].players.length;
          for (let i = 0; i < numGroups; i++) {
            initialMatchPlay[roundIdx][i] = ['', '']; // [Team A player, Team B player]
          }
        });
        setMatchPlaySelections(initialMatchPlay);

      } catch (err) {
        console.error('Failed to fetch trip data:', err);
      }
    };

    fetchTrip();
  }, [tripId]);

  const handleSaveLineup = async () => {
    if (!tripId) return;
  
    // Convert to backend format
    const formattedTeams = tripData.teams.map((team: any, teamIdx: number) => ({
      name: team.name,
      players: teamAssignments[teamIdx].map((username: string, i: number) => ({
        id: i + 1,
        name: username,
        scores: Array(tripData.numRounds).fill(0),
        lineupOrder: Array(tripData.numRounds).fill(0),
      })),
    }));
  
    const response = await fetch(`${SOCKET_URL}/trips/${tripId}/set-lineup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teams: formattedTeams,
        lineups: matchPlaySelections,
      }),
    });
  
    if (response.ok) {
      alert('✅ Lineup saved!');
    } else {
      const err = await response.json();
      alert(`❌ Error saving lineup: ${err.error}`);
    }
  };

  if (!tripData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading trip data...</p>
      </div>
    );
  }

  const allUsers = tripData.users;

  const tabLabels = ['Teams', ...tripData.scoringMethods.map((type: string, i: number) => `Round ${i + 1} - ${type}`)];

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfdfb]">
      <Header showNav />
      <main className="flex-grow container mx-auto px-4 py-10">
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 text-[#0f172a]">Set Lineups</h2>

          <div className="mb-6 flex border-b border-gray-200">
            {tabLabels.map((label, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(label)}
                className={`mr-4 pb-2 font-medium ${
                  activeTab === label ? 'text-[#0f172a] border-b-2 border-[#0f172a]' : 'text-gray-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'Teams' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {tripData.teams.map((team: any, teamIdx: number) => (
                <div key={teamIdx}>
                  <h3 className="text-lg font-semibold mb-2">{team.name}</h3>
                  {team.players.map((_: any, playerIdx: number) => (
                    <select
                      key={playerIdx}
                      value={teamAssignments[teamIdx]?.[playerIdx] || ''}
                      onChange={(e) => {
                        const updated = { ...teamAssignments };
                        updated[teamIdx][playerIdx] = e.target.value;
                        setTeamAssignments(updated);
                      }}
                      className="w-full mb-2 px-4 py-2 border border-gray-300 rounded"
                    >
                      <option value="">Select player</option>
                      {allUsers.map((user: string) => (
                        <option key={user} value={user}>
                          {user}
                        </option>
                      ))}
                    </select>
                  ))}
                </div>
              ))}
            </div>
          )}

          {tripData.scoringMethods.map((type: string, roundIdx: number) => {
            const tabLabel = `Round ${roundIdx + 1} - ${type}`;
            if (activeTab !== tabLabel) return null;

            if (type === 'match') {
              const numGroups = tripData.teams[0].players.length;
              return (
                <div key={roundIdx}>
                  <h3 className="text-lg font-semibold mb-4">Matchups for Round {roundIdx + 1}</h3>
                  {Array.from({ length: numGroups }, (_, groupIdx) => (
                    <div key={groupIdx} className="mb-4">
                      <p className="mb-1 font-medium">Group {groupIdx + 1}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tripData.teams.map((_: any, teamIdx: number) => (
                          <select
                            key={teamIdx}
                            value={matchPlaySelections[roundIdx]?.[groupIdx]?.[teamIdx] || ''}
                            onChange={(e) => {
                              const updated = { ...matchPlaySelections };
                              updated[roundIdx][groupIdx][teamIdx] = e.target.value;
                              setMatchPlaySelections(updated);
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded"
                          >
                            <option value="">Team {teamIdx + 1} Player</option>
                            {(teamAssignments[teamIdx] || []).map((user, idx) => (
                              <option key={idx} value={user}>
                                {user}
                              </option>
                            ))}
                          </select>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            } else {
              return (
                <div key={roundIdx}>
                  <p className="text-gray-600">Stroke play round — no matchups needed.</p>
                </div>
              );
            }
          })}

          <div className="mt-8">
            <button
              onClick={handleSaveLineup}
              className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold px-6 py-3 rounded-md shadow"
            >
              Save Lineup
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SetLineup;
