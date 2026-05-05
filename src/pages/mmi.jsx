import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../assets/css/home.css";
import { useTournamentImages } from "../context/TournamentImagesContext";

const MMI = () => {
  const images = useTournamentImages();
  const pages = [
    {
      path: "/home/multi-court-live?tournamentId=57&courtId=108,109,110",
      name: "SMD Live Courts",
      color: "red",
    },
    {
      path: "/home/multi-court-schedule?masterTournamentId=57&courtId=108,109,110",
      name: "SMD Schedule",
      color: "green",
    },
    {
      path: "/home/live-court?tournamentId=57&courtId=108",
      name: "Court 1",
      color: "#2e55b9",
    },
    {
      path: "/home/live-court?tournamentId=57&courtId=109",
      name: "Court 2",
      color: "#2e55b9",
    },
    {
      path: "/home/live-court?tournamentId=57&courtId=110",
      name: "Court 3",
      color: "#2e55b9",
    },

    // {
    //   path: "/home/score-table?tournamentIds=208,207,206&groupDisplayTime=5&refreshInterval=10&masterTournamentId=58",
    //   name: "Score Table",
    //   color: "#2e55b9",
    // },
    // {
    //   path: "/home/today-match?tournamentId=58",
    //   name: "Today's Matches",
    //   color: "#2e55b9",
    // },

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

export default MMI;
