import React, { useState } from 'react';
import HomePage from './pages/HomePage';

// Define interfaces for the event configuration
export interface Player {
  name: string;
  scores: number[];
  lineupOrder: number[];
}

export interface Team {
  name: string;
  players: Player[];
}

export interface EventConfig {
  tripId: string;
  numTeams: number;
  playersPerTeam: number;
  numRounds: number;
  scoringMethods: ('match' | 'stroke')[];
  teams: Team[];
}

function App() {
  const [config, setConfig] = useState<EventConfig>({
    tripId: '',
    numTeams: 2,
    playersPerTeam: 4,
    numRounds: 3,
    scoringMethods: ['match', 'match', 'match'],
    teams: Array.from({ length: 2 }, (_, teamIndex) => ({
      name: `Team ${teamIndex + 1}`,
      players: Array.from({ length: 4 }, (_, playerIndex) => ({
        name: `Player ${playerIndex + 1}`,
        scores: Array(3).fill(0),
        lineupOrder: Array(3).fill(playerIndex), // Default lineup order
      })),
    })),
  });

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <HomePage config={config} setConfig={setConfig} />
    </div>
  );
}

export default App;