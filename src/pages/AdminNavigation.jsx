import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  Users,
  Trophy,
  Calendar,
  BarChart3,
  Settings,
  ArrowLeft,
} from "lucide-react";
import { useTournamentImages } from "../context/TournamentImagesContext";

const AdminNavigation = () => {
  const images = useTournamentImages();
  const adminPages = [
    {
      path: "/umpire-scoring",
      name: "Umpire Scoring Portal",
      description: "Live match scoring and management",
      icon: Shield,
      color: "#dc2626",
      gradient: "from-red-500 to-red-700",
    },
    {
      path: "/score-table",
      name: "Score Table",
      description: "Tournament standings and results",
      icon: Trophy,
      color: "#2563eb",
      gradient: "from-blue-500 to-blue-700",
    },
    {
      path: "/today-match",
      name: "Today's Matches",
      description: "View today's match schedule",
      icon: Calendar,
      color: "#16a34a",
      gradient: "from-green-500 to-green-700",
    },
    {
      path: "/time-table",
      name: "Tournament Schedule",
      description: "Complete tournament timetable",
      icon: BarChart3,
      color: "#ca8a04",
      gradient: "from-yellow-500 to-yellow-700",
    },
    {
      path: "/umpire",
      name: "Umpire Management",
      description: "Manage umpire assignments",
      icon: Users,
      color: "#7c3aed",
      gradient: "from-purple-500 to-purple-700",
    },
    {
      path: "/viewer",
      name: "Viewer Portal",
      description: "Public viewing interface",
      icon: Settings,
      color: "#059669",
      gradient: "from-emerald-500 to-emerald-700",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-white/70 hover:text-white transition-colors duration-200 mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <img
              width={300}
              src={images.playpro}
              alt="PlayPro Logo"
              className="mx-auto mb-6"
            />
            <h1 className="text-5xl font-bold text-white mb-4">
              Tournament Management
            </h1>
            <p className="text-xl text-white/80">
              Administrative Portal for Tournament Operations
            </p>
          </motion.div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminPages.map((page, index) => {
            const Icon = page.icon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="group"
              >
                <Link to={page.path} className="block h-full">
                  <div
                    className={`
                    bg-gradient-to-br ${page.gradient} 
                    rounded-2xl p-6 h-full shadow-xl 
                    border border-white/10 backdrop-blur-sm
                    hover:shadow-2xl transition-all duration-300
                    group-hover:border-white/20
                  `}
                  >
                    {/* Icon */}
                    <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors duration-300">
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Content */}
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-white/90">
                        {page.name}
                      </h3>
                      <p className="text-white/80 text-sm leading-relaxed group-hover:text-white/70">
                        {page.description}
                      </p>
                    </div>

                    {/* Arrow indicator */}
                    <div className="flex justify-end mt-4">
                      <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center group-hover:bg-white/30 transition-colors duration-300">
                        <ArrowLeft className="w-4 h-4 text-white rotate-180" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Access Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-12 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/umpire-scoring/login"
              className="bg-red-600/20 hover:bg-red-600/30 rounded-lg p-4 border border-red-500/30 hover:border-red-500/50 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <Shield className="w-6 h-6 text-red-400" />
                <div>
                  <div className="font-semibold text-white group-hover:text-red-200">
                    Direct Umpire Login
                  </div>
                  <div className="text-sm text-white/70">
                    Skip to scoring portal
                  </div>
                </div>
              </div>
            </Link>

            <Link
              to="/score-table"
              className="bg-blue-600/20 hover:bg-blue-600/30 rounded-lg p-4 border border-blue-500/30 hover:border-blue-500/50 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <Trophy className="w-6 h-6 text-blue-400" />
                <div>
                  <div className="font-semibold text-white group-hover:text-blue-200">
                    Live Standings
                  </div>
                  <div className="text-sm text-white/70">
                    Current tournament results
                  </div>
                </div>
              </div>
            </Link>

            <Link
              to="/today-match"
              className="bg-green-600/20 hover:bg-green-600/30 rounded-lg p-4 border border-green-500/30 hover:border-green-500/50 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <Calendar className="w-6 h-6 text-green-400" />
                <div>
                  <div className="font-semibold text-white group-hover:text-green-200">
                    Today's Schedule
                  </div>
                  <div className="text-sm text-white/70">
                    View match schedule
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-12 text-white/60">
          <p className="text-sm">
            PlayPro Tournament Tracker - Administrative Portal
          </p>
          <p className="text-xs mt-2">Version 1.0.0 • Secure Access Required</p>
        </div>
      </div>
    </div>
  );
};

export default AdminNavigation;
