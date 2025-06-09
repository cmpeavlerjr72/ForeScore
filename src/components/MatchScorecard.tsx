import React from 'react';
import { GolfCourse } from '../types/GolfCourse';

interface MatchScorecardProps {
  course: GolfCourse;
  roundIndex: number;
  player1Name: string;
  player1Score: number;
  player2Name: string;
  player2Score: number;
}

const MatchScorecard: React.FC<MatchScorecardProps> = ({
  course,
  roundIndex,
  player1Name,
  player1Score,
  player2Name,
  player2Score,
}) => {
  const holes = Array.from({ length: 18 }, (_, i) => i + 1);

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6 border border-gray-200">
      <h4 className="text-lg font-semibold text-[#0f172a] mb-2">
        {player1Name} vs {player2Name}
      </h4>
      <div className="overflow-x-auto">
        <table className="table-auto w-full text-sm text-center border-collapse">
          <thead className="bg-gray-100 text-[#0f172a] font-semibold">
            <tr>
              {holes.map((n) => (
                <th key={`hole-${n}`} className="border p-2">
                  {n}
                </th>
              ))}
              <th className="border p-2">Out</th>
              <th className="border p-2">In</th>
              <th className="border p-2">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-gray-50">
              {course.par.map((val, i) => (
                <td key={`par-${i}`} className="border p-1">
                  {val}
                </td>
              ))}
              <td className="border p-1">{course.par.slice(0, 9).reduce((a, b) => a + b, 0)}</td>
              <td className="border p-1">{course.par.slice(9).reduce((a, b) => a + b, 0)}</td>
              <td className="border p-1">{course.par.reduce((a, b) => a + b, 0)}</td>
            </tr>
            <tr className="bg-gray-50">
              {course.handicap.map((val, i) => (
                <td key={`hcp-${i}`} className="border p-1">
                  {val}
                </td>
              ))}
              <td className="border p-1"></td>
              <td className="border p-1"></td>
              <td className="border p-1"></td>
            </tr>
            <tr>
              {Array.from({ length: 18 }).map((_, i) => (
                <td key={`p1-${i}`} className="border p-1">
                  {/* Placeholder, replace with per-hole scores if you have them */}
                  {Math.floor(player1Score / 18)}
                </td>
              ))}
              <td className="border p-1">{Math.floor(player1Score / 2)}</td>
              <td className="border p-1">{Math.ceil(player1Score / 2)}</td>
              <td className="border p-1 font-semibold">{player1Score}</td>
            </tr>
            <tr>
              {Array.from({ length: 18 }).map((_, i) => (
                <td key={`p2-${i}`} className="border p-1">
                  {Math.floor(player2Score / 18)}
                </td>
              ))}
              <td className="border p-1">{Math.floor(player2Score / 2)}</td>
              <td className="border p-1">{Math.ceil(player2Score / 2)}</td>
              <td className="border p-1 font-semibold">{player2Score}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MatchScorecard;
