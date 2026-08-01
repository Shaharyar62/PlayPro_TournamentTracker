import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../assets/css/home.css";
import { useTournamentImages } from "../context/TournamentImagesContext";

const Padelverse = () => {
  const images = useTournamentImages();
  const pages = [
    {
      path: "/home/live-court?tournamentId=75&courtId=206&displayId=25",
      name: "Court R1",
      color: "#2e55b9",
    },
    {
      path: "/home/live-court?tournamentId=75&courtId=207&displayId=25",
      name: "Court R2",
      color: "#2e55b9",
    },
    {
      path: "/home/live-court?tournamentId=75&courtId=208&displayId=25",
      name: "Court X",
      color: "#2e55b9",
    },
    {
      path: "/home/live-court?tournamentId=75&courtId=209&displayId=25",
      name: "Court 1",
      color: "#2e55b9",
    },
    {
      path: "/home/live-court?tournamentId=75&courtId=210&displayId=25",
      name: "Court 2",
      color: "#2e55b9",
    },
    {
      path: "/home/live-court?tournamentId=75&courtId=211&displayId=25",
      name: "Court 3",
      color: "#2e55b9",
    },
    {
      path: "/home/live-court?tournamentId=75&courtId=212&displayId=25",
      name: "Court 4",
      color: "#2e55b9",
    },
    {
      path: "/home/live-court?tournamentId=75&courtId=213&displayId=25",
      name: "Court 5",
      color: "#2e55b9",
    },
    {
      path: "/home/live-court?tournamentId=75&courtId=264&displayId=25",
      name: "Champion Court 1",
      color: "#2e55b9",
    },
    {
      path: "/home/live-court?tournamentId=75&courtId=265&displayId=25",
      name: "Champion Court 2",
      color: "#2e55b9",
    },

    {
      path: "/home/multi-court-live?tournamentId=75&courtId=206,207,208,209,210,211,212,213,264,265&displayId=25",
      name: "Multi Court Live",
      color: "#2e55b9",
    },
    {
      path: "/home/multi-court-schedule?masterTournamentId=75&courtId=206,207,208,209,210,211,212,213,264,265&tournamentId=75&displayId=25",
      name: "Multi Court Schedule",
      color: "#2e55b9",
    },

    {
      path: "/home/score-table?tournamentIds=271,272,273,274,275,276,277,278&groupDisplayTime=5&refreshInterval=10&tournamentId=75&displayId=25",
      name: "Score Table",
      color: "#2e55b9",
    },
    {
      path: "/home/today-match?tournamentId=75&displayId=25",
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

export default Padelverse;
