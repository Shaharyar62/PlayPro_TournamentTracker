import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../assets/css/home.css";
import { useTournamentImages } from "../context/TournamentImagesContext";
 
const centenary = () => {
  const images = useTournamentImages();
  const pages = [
    {
      path: "/home/live-court?tournamentId=65&courtId=260",
      name: "MejorSet 1",
      color: "#2e55b9",
    },
    {
      path: "/home/live-court?tournamentId=65&courtId=248",
      name: "MejorSet 2",
      color: "#2e55b9",
    },
    {
      path: "/home/live-court?tournamentId=65&courtId=144",
      name: "Cherry 2",
      color: "#2e55b9",
    },

    {
      path: "/home/live-court?tournamentId=65&courtId=143",
      name: "Cherry 1",
      color: "#2e55b9",
    },

    {
      path: "/home/live-court?tournamentId=65&courtId=142",
      name: "Tera 2",
      color: "#2e55b9",
    },

    {
      path: "/home/live-court?tournamentId=65&courtId=141",
      name: "Tera 1",
      color: "#2e55b9",
    },

    {
      path: "/home/live-court?tournamentId=65&courtId=140",
      name: "Ocean 2",
      color: "#2e55b9",
    },
    {
      path: "/home/live-court?tournamentId=65&courtId=139",
      name: "Ocean 1",
      color: "#2e55b9",
    },
    

    {
      path: "/home/multi-court-live?tournamentId=65&courtId=260,248,144,143,142,141,140,139",
      name: "SMD Live Courts",
      color: "#2e55b9",
    },
    {
      path: "/home/multi-court-schedule?masterTournamentId=65&courtId=260,248,144,143,142,141,140,139",
      name: "Multi Court Schedule",
      color: "#2e55b9",
    },

    {
      path: "/home/score-table?tournamentIds=246,245,244,243,242,241,240,239,238,247&groupDisplayTime=5&refreshInterval=10",
      name: "Score Table",
      color: "#2e55b9",
    },
    {
      path: "/home/today-match?tournamentId=65",
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

export default centenary;
