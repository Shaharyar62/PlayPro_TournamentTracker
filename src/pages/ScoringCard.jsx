import React from "react";
import { Trophy, Clock, Users } from "lucide-react";

const PadelScoreDisplay = () => {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-black min-h-screen text-white flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center p-6 bg-gray-800/70 backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <Trophy className="w-10 h-10 text-yellow-500" />
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
              Padel Score
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <Clock className="w-6 h-6 text-gray-400" />
            <span className="text-2xl font-mono tracking-wider">00:45</span>
            <span className="text-lg text-gray-400">MATCH 1/3</span>
          </div>
        </div>

        {/* Players */}
        <div className="grid grid-cols-2 px-8 py-4 bg-gray-900/50">
          <div className="text-right pr-6">
            <h2 className="text-2xl font-semibold text-blue-300">
              Mattia Luca
            </h2>
            <div className="flex justify-end items-center space-x-2 mt-1">
              <Users className="w-5 h-5 text-gray-500" />
              <span className="text-gray-400 text-sm">Team 01</span>
            </div>
          </div>
          <div className="pl-6">
            <h2 className="text-2xl font-semibold text-red-300">
              Salvatore Rinaldo
            </h2>
            <div className="flex items-center space-x-2 mt-1">
              <Users className="w-5 h-5 text-gray-500" />
              <span className="text-gray-400 text-sm">Team 02</span>
            </div>
          </div>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-4 p-8">
          {/* Team 1 Score */}
          <div className="bg-gradient-to-br from-blue-600/70 to-blue-800/70 rounded-2xl p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-pattern"></div>
            <div className="relative z-10">
              <div className="text-9xl font-bold text-white mb-4 drop-shadow-lg">
                15
              </div>
              <div className="text-3xl text-blue-200 font-mono">0 - 7 - 0</div>
            </div>
          </div>

          {/* Team 2 Score */}
          <div className="bg-gradient-to-br from-red-600/70 to-red-800/70 rounded-2xl p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-pattern"></div>
            <div className="relative z-10">
              <div className="text-9xl font-bold text-white mb-4 drop-shadow-lg">
                40
              </div>
              <div className="text-3xl text-red-200 font-mono">6 - 0 - 7</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-800/70 backdrop-blur-sm p-4 text-center">
          <span className="text-gray-400">Live Padel Tournament</span>
        </div>
      </div>

      {/* Background Style */}
      <style jsx>{`
        .bg-pattern {
          background-image: linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.05) 25%,
            transparent 25%,
            transparent 50%,
            rgba(255, 255, 255, 0.05) 50%,
            rgba(255, 255, 255, 0.05) 75%,
            transparent 75%,
            transparent
          );
          background-size: 40px 40px;
        }
      `}</style>
    </div>
  );
};

export default PadelScoreDisplay;
