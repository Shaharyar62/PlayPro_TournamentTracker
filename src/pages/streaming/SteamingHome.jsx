import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../../assets/css/home.css";
import { ImageConstants } from "../../assets/images/ImageConstants";

const StreamingHome = () => {
  const pages = [
    {
      path: "/streaming-live-court?tournamentId=25&courtId=79",
      name: "Galaxy 1 -",
      color: "#2e55b9",
    },
    {
      path: "/streaming-live-court?tournamentId=25&courtId=80",
      name: "Galaxy 2",
      color: "#2e55b9",
    },
    {
      path: "/streaming-live-court?tournamentId=25&courtId=81",
      name: "Galaxy 3",
      color: "#2e55b9",
    },
    {
      path: "/streaming-live-court?tournamentId=25&courtId=82",
      name: "Galaxy 4",
      color: "#2e55b9",
    },
    {
      path: "/streaming-live-court?tournamentId=25&courtId=83",
      name: "Black Star 1 -",
      color: "#2e55b9",
    },
    {
      path: "/streaming-live-court?tournamentId=25&courtId=84",
      name: "Black Star 2",
      color: "#2e55b9",
    },
    {
      path: "/streaming-live-court?tournamentId=25&courtId=85",
      name: "Infinity -",
      color: "#2e55b9",
    },

    // { path: "/live-score", name: "Live Score", color: "#2e55b9" },
    // { path: "/time-table", name: "Time Table", color: "#2e55b9" },
    // { path: "/score-table", name: "Score Table", color: "#2e55b9" },
    // { path: "/score-card", name: "Score Card", color: "#2e55b9" },
    // { path: "/today-match", name: "Today's Matches", color: "#2e55b9" },
    // { path: "/live-court", name: "Live Court", color: "#2e55b9" },
    // { path: "/matches-timetable", name: "7 Day Schedule", color: "#2e55b9" },
  ];

  return (
    <div className="home-container">
      <div className="home-header">
        <img width={300} src={ImageConstants.playpro} alt="logo" />
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

export default StreamingHome;
