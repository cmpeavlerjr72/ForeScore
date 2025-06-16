import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import whiteLogo from '../assets/ForeScore_white.png';

interface HeaderProps {
  showNav?: boolean;
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ showNav = true }) => {
  const [tripId, setTripId] = useState<string | null>(null);

  useEffect(() => {
    const storedTripId = localStorage.getItem('tripId');
    if (storedTripId) {
      setTripId(storedTripId);
    }
  }, []);

  return (
    <header className="bg-[#0f172a] text-white py-3 px-6 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo only */}
        <div className="flex items-center">
          <img src={whiteLogo} alt="ForeScore Logo" className="h-12 md:h-16" />
        </div>

        {/* Optional navigation */}
        {showNav && tripId && (
          <nav>
            <ul className="flex gap-6 text-sm md:text-base">
              <li>
                <Link to="/" className="hover:underline">Home</Link>
              </li>
              <li>
                <Link to={`/dashboard/${tripId}`} className="hover:underline">Scoreboard</Link>
              </li>
              <li>
                <Link to={`/round-scoreboard/${tripId}`} className="hover:underline">Rounds</Link>
              </li>
              <li>
                <Link to={`/enter-scores/${tripId}`} className="hover:underline">Enter Scores</Link>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
