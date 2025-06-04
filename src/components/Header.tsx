import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/ForeScore.png';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="bg-blue-700 text-white p-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src={logo} alt="ForeScore Logo" className="h-12" />
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        <nav>
          <ul className="flex gap-4">
            <li>
              <Link to="/" className="hover:underline">Home</Link>
            </li>
            <li>
              <Link to="/dashboard" className="hover:underline">Dashboard</Link>
            </li>
            <li>
              <Link to="/round-scoreboard" className="hover:underline">Round Scoreboard</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;