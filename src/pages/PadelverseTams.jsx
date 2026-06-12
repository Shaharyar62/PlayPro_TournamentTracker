import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../assets/css/home.css";
import { useTournamentImages } from "../context/TournamentImagesContext";

const PadelverseTams = () => {
  const images = useTournamentImages();
  const pages = [
    {
      path: "/home/live-court?tournamentId=67&courtId=79",
      name: "Galaxy 1",
      color: "#2e55b9",
    },
    {
      path: "/home/live-court?tournamentId=67&courtId=80",
      name: "Galaxy 2",
      color: "#2e55b9",
    },
    {
      path: "/home/live-court?tournamentId=67&courtId=81",
      name: "Galaxy 3",
      color: "#2e55b9",
    },

    {
      path: "/home/live-court?tournamentId=67&courtId=82",
      name: "Galaxy 4",
      color: "#2e55b9",
    },

    {
      path: "/home/live-court?tournamentId=67&courtId=83",
      name: "Black Star 1",
      color: "#2e55b9",
    },

    {
      path: "/home/live-court?tournamentId=67&courtId=84",
      name: "Black Star 2",
      color: "#2e55b9",
    },

    {
      path: "/home/live-court?tournamentId=67&courtId=85",
      name: "Infinity",
      color: "#2e55b9",
    },

    {
      path: "/home/multi-court-live?tournamentId=67&courtId=79,80,81,82,83,84,85",
      name: "Multi Court Live",
      color: "#2e55b9",
    },
    {
      path: "/home/multi-court-schedule?masterTournamentId=67&courtId=253,252,251,250",
      name: "Multi Court Schedule",
      color: "#2e55b9",
    },

    {
      path: "/home/score-table?tournamentIds=253,252,251,250&groupDisplayTime=5&refreshInterval=10",
      name: "Score Table",
      color: "#2e55b9",
    },
    {
      path: "/home/today-match?tournamentId=67",
      name: "Today's Matches",
      color: "#2e55b9",
    },

    // { path: "/live-score", name: "Live Score", color: "#2e55b9" },
    // { path: "/time-table", name: "Time Table", color: "#2e55b9" },
    // { path: "/matches-timetable", name: "7 Day Schedule", color: "#2e55b9" },
    // { path: "/score-card", name: "Score Card", color: "#2e55b9" },
  ];

  return (
    <div className="home-container">
      <div className="home-header">
        <img width={300} src={images.playpro} alt="logo" />
      </div>

      <div className="buttons-grid">
        {pages.map((page, index) => (
          <motion.div
            key={index}
            className="button-wrapper"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to={page.path}
              className="nav-button"
              style={{ backgroundColor: page.color }}
            >
              <motion.div
                className="button-content"
                whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                transition={{ duration: 0.5 }}
              >
                {page.name}
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PadelverseTams;
