import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import RoundScoreboard from './pages/RoundScoreboard';

export interface EventConfig {
  tripId: string;
  numTeams: number;
  playersPerTeam: number;
  numRounds: number;
  scoringMethods: ('match' | 'stroke')[];
  teams: {
    name: string;
    players: {
      name: string;
      scores: number[];
      lineupOrder: number[];
    }[];
  }[];
}

const App: React.FC = () => {
  const [config, setConfig] = useState<EventConfig>({
    tripId: '',
    numTeams: 2,
    playersPerTeam: 4,
    numRounds: 3,
    scoringMethods: ['match', 'match', 'match'],
    teams: [],
  });

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage config={config} setConfig={setConfig} />} />
        <Route path="/dashboard" element={<Dashboard config={config} setConfig={setConfig} setShowDashboard={() => {}} />} />
        <Route path="/round-scoreboard" element={<RoundScoreboard config={config} />} />
      </Routes>
    </Router>
  );
};

export default App;