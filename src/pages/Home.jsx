import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../assets/css/home.css";
import { ImageConstants } from "../assets/images/ImageConstants";

const Home = () => {
  const pages = [
    {
      path: "/home/live-court?tournamentId=43&courtId=108",
      name: "Court 1",
      color: "#2e55b9",
    },
    {
      path: "/home/live-court?tournamentId=43&courtId=109",
      name: "Court 2",
      color: "#2e55b9",
    },
    {
      path: "/home/live-court?tournamentId=43&courtId=110",
      name: "Court 3",
      color: "#2e55b9",
    },
    // {
    //   path: "/home/live-court?tournamentId=34&courtId=67",
    //   name: "Court 4",
    //   color: "#2e55b9",
    // },
    // {
    //   path: "/home/live-court?tournamentId=34&courtId=182",
    //   name: "Court 5",
    //   color: "#2e55b9",
    // },
    // {
    //   path: "/home/live-court?tournamentId=34&courtId=247",
    //   name: "Court 6",
    //   color: "#2e55b9",
    // },

    // {
    //   path: "/admin",
    //   name: "⚙️ Admin Portal",
    //   color: "#7c3aed",
    // },

    {
      path: "/home/score-table?tournamentIds=145,146,147&groupDisplayTime=2&refreshInterval=10",
      name: "Score Table",
      color: "#2e55b9",
    },
    {
      path: "/home/today-match?tournamentId=43",
      name: "Today's Matches",
      color: "#2e55b9",
    },

    {
      path: "/home/multi-court-live?tournamentId=43&courtId=108,109,110",
      name: "Multi Court Live",
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

export default Home;
