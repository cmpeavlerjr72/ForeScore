import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import whiteLogo from '../assets/ForeScore_white.png';

interface HeaderProps {
  showNav?: boolean;
  title?: string;
}

const HomeHeader: React.FC<HeaderProps> = ({ showNav = true }) => {
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
        {/* Logo now clickable to homepage */}
        <div className="flex items-center">
          <Link to="/">
            <img src={whiteLogo} alt="ForeScore Logo" className="h-12 md:h-16" />
          </Link>
        </div>

        {/* Optional navigation */}
        {showNav && tripId && (
          <nav>
            <ul className="flex gap-6 text-sm md:text-base">
              <li>
                <Link to="/demo" className="hover:underline">Demo</Link>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
};

export default HomeHeader;