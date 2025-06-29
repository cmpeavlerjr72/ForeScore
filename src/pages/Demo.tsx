import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Demo: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#fdfdfb] flex flex-col">
      <Header showNav={false} title="ForeScore Demo" />
      <main className="flex-grow container mx-auto px-4 py-8">
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold mb-4 text-[#0f172a]">Welcome to ForeScore Demo</h1>
          
          <p className="text-gray-700 mb-6">
            Bring the all the best parts of professional golf to the your rounds
            with the ones who mean the most to you!
          </p>

          <p className="text-gray-700 mb-6">
            Explore how ForeScore helps you manage golf trips, track scores, and enjoy your game. This demo showcases key features with screenshots and a brief overview.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            {/* Screenshot 1 */}
            <div className="bg-gray-100 p-4 rounded-lg">
              <img
                src="src\assets\dashboard.png"
                alt="Dashboard Screenshot"
                className="w-full h-auto rounded-lg"
              />
              <p className="text-center mt-2 text-gray-600">Overall Team Scoreboard</p>
            </div>

          </div>

          <p className="text-gray-700 mb-6">
            Create a profile and then a trip and you can start entering scores! 

         </p>

          <p className="text-gray-700 mb-6">


            As you enter scores, your overall team scores will be updated LIVE!
          </p>

          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Screenshot 1 */}
            <div className="bg-gray-100 p-4 rounded-lg">
              <img
                src="src\assets\Match Demo.png"
                alt="Dashboard Screenshot"
                className="w-full h-auto rounded-lg"
              />
              <p className="text-center mt-2 text-gray-600">Match Play Scoreboard</p>
            </div>

            {/* Screenshot 2 */}
            <div className="bg-gray-100 p-4 rounded-lg">
              <img
                src="src\assets\Stroke_play.png"
                alt="Score Entry Screenshot"
                className="w-full h-auto rounded-lg"
              />
              <p className="text-center mt-2 text-gray-600">Stroke Play Scoreboard</p>
            </div>

            {/* Add more screenshots as needed */}
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-[#0f172a]">About ForeScore</h2>
            <p className="text-gray-700">
              ForeScore is a golf management app designed to simplify trip planning, score tracking, and team coordination. Key features include real-time score updates, customizable rounds, and user-friendly navigation.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Demo;