import React from "react";
import { motion } from "framer-motion";
import { Clock, Play, CheckCircle, Calendar } from "lucide-react";

const Filters = ({ activeFilter, onFilterChange, matchCounts }) => {
  const filters = [
    {
      id: "all",
      label: "All Matches",
      icon: Calendar,
      color: "bg-gray-100 text-white-700 border-gray-300",
      activeColor: "bg-gray-600 text-white ",
      count: matchCounts.all || 0,
    },
    {
      id: "upcoming",
      label: "Upcoming",
      icon: Clock,
      color: "bg-blue-50 text-white border-blue-300",
      activeColor: "bg-blue-600 text-white border-blue-600",
      count: matchCounts.upcoming || 0,
    },
    {
      id: "live",
      label: "Live",
      icon: Play,
      color: "bg-red-50 text-white border-red-300",
      activeColor: "bg-red-600 text-white border-red-600",
      count: matchCounts.live || 0,
    },
    {
      id: "completed",
      label: "Completed",
      icon: CheckCircle,
      color: "bg-green-50 text-white border-green-300",
      activeColor: "bg-green-600 text-white border-green-600",
      count: matchCounts.completed || 0,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Filter Matches
      </h3>

      {/* Desktop Layout */}
      <div className="hidden md:flex space-x-3">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.id;

          return (
            <motion.button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all duration-200 font-medium
                ${isActive ? filter.activeColor : filter.color}
                hover:shadow-md
              `}
            >
              <Icon className="w-5 h-5" />
              <span>{filter.label}</span>
              <span
                className={`
                px-2 py-1 rounded-full text-xs font-bold
                ${
                  isActive
                    ? "bg-gray-700 bg-opacity-20 text-black"
                    : "bg-gray-700 text-white"
                }
              `}
              >
                {filter.count}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="grid grid-cols-2 gap-3">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.id;

            return (
              <motion.button
                key={filter.id}
                onClick={() => onFilterChange(filter.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  flex flex-col items-center space-y-2 p-4 rounded-lg border-2 transition-all duration-200
                  ${isActive ? filter.activeColor : filter.color}
                `}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="w-5 h-5" />
                  <span
                    className={`
                    px-2 py-1 rounded-full text-xs font-bold
                    ${
                      isActive
                        ? "bg-white bg-opacity-20 text-black"
                        : "bg-gray-200 text-gray-700"
                    }
                  `}
                  >
                    {filter.count}
                  </span>
                </div>
                <span className="text-sm font-medium">{filter.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Active Filter Summary */}
      {activeFilter !== "all" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 pt-4 border-t border-gray-200"
        >
          <p className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-semibold text-gray-800">
              {matchCounts[activeFilter] || 0}
            </span>{" "}
            {activeFilter} matches
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default Filters;
