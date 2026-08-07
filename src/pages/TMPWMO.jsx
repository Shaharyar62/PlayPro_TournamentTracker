import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../assets/css/home.css";
import { useTournamentImages } from "../context/TournamentImagesContext";

const TMPWMO = () => {
  const images = useTournamentImages();
  const pages = [
    {
      path: "/home/live-court?tournamentId=76&courtId=105&displayId=25",
      name: "Court 1",
      color: "#2e55b9",
    },
    {
      path: "/home/live-court?tournamentId=76&courtId=106&displayId=25",
      name: "Court 2",
      color: "#2e55b9",
    },
    {
      path: "/home/live-court?tournamentId=76&courtId=107&displayId=25",
      name: "Court 3",
      color: "#2e55b9",
    },

    {
      path: "/home/live-court?tournamentId=76&courtId=263&displayId=25",
      name: "Court 4",
      color: "#2e55b9",
    },

    {
      path: "/home/multi-court-live?tournamentId=76&courtId=105,106,107,263&displayId=25",
      name: "Multi Court Live",
      color: "#2e55b9",
    },
    {
      path: "/home/multi-court-schedule?masterTournamentId=76&courtId=105,106,107,263&displayId=25",
      name: "Multi Court Schedule",
      color: "#2e55b9",
    },

    {
      path: "/home/score-table?tournamentIds=283,282,281,280,279&groupDisplayTime=5&refreshInterval=10&tournamentId=76&displayId=25",
      name: "Score Table",
      color: "#2e55b9",
    },
    {
      path: "/home/today-match?tournamentId=76&displayId=25",
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

export default TMPWMO;
