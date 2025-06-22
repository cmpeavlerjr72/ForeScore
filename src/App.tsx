import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import RoundScoreboard from './pages/RoundScoreboard';
import Profile from './pages/Profile';
import PlayerScoreEntry from './pages/PlayerScoreEntry';
import SetLineup from './pages/SetLineup';

export interface EventConfig {
  tripId: string;
  numTeams: number;
  playersPerTeam: number;
  numRounds: number;
  scoringMethods: ('match' | 'stroke')[];
  courses: string[]; // Added to store selected courses for each round
  tripLeader?: string;
  users?: string[];
  teams: {
    name: string;
    players: {
      name: string;
      scores: number[];
      lineupOrder: number[];
    }[];
  }[];
  lineups?: {
    [roundIndex: string]: {
      [groupIndex: string]: string[];
    };
  };
}

export const defaultEventConfig: EventConfig = {
  tripId: '',
  numTeams: 2,
  playersPerTeam: 4,
  numRounds: 3,
  scoringMethods: ['match', 'match', 'match'],
  courses: ['True Blue', 'True Blue', 'True Blue'],
  teams: [],
  tripLeader: '',
  users: []
};


const App: React.FC = () => {
  const [config, setConfig] = useState<EventConfig>({
    tripId: '',
    numTeams: 2,
    playersPerTeam: 4,
    numRounds: 3,
    scoringMethods: ['match', 'match', 'match'],
    courses: ['True Blue', 'True Blue', 'True Blue'], // Default courses
    teams: [],
  });
  const [showDashboard, setShowDashboard] = useState(false); // Add state for dashboard visibility

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage/>} />
        <Route path="/dashboard/:tripId" element={<Dashboard />} />
        <Route path="/round-scoreboard/:tripId" element={<RoundScoreboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/enter-scores/:tripId" element={<PlayerScoreEntry />} />
        <Route path="/set-lineup/:tripId" element={<SetLineup />} />
      </Routes>
    </Router>
  );
};

export default App;