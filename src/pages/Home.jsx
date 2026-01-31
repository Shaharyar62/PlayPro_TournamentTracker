import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../assets/css/home.css";
import { ImageConstants } from "../assets/images/ImageConstants";

const Home = () => {
  const pages = [
    {
      path: "/home/live-court?tournamentId=47&courtId=247",
      name: "Premier Court",
      color: "#2e55b9",
    },
    {
      path: "/home/live-court?tournamentId=47&courtId=64",
      name: "Court 1",
      color: "#2e55b9",
    },
    {
      path: "/home/live-court?tournamentId=47&courtId=65",
      name: "Court 2",
      color: "#2e55b9",
    },
   
    {
      path: "/home/live-court?tournamentId=47&courtId=66",
      name: "Court 3",
      color: "#2e55b9",
    },
 
    {
      path: "/home/live-court?tournamentId=47&courtId=67",
      name: "Court 4",
      color: "#2e55b9",
    },
    {
      path: "/home/live-court?tournamentId=47&courtId=182",
      name: "Court 5",
      color: "#2e55b9",
    },
     
    {
      path: "/home/multi-court-live?tournamentId=47&courtId=247,66,65,64,67,182",
      name: "Multi Court Live",
      color: "#2e55b9",
    },
    {
      path: "/home/multi-court-schedule?masterTournamentId=47&courtId=67,182,247,66,65",
      name: "Multi Court Schedule",
      color: "#2e55b9",
    },

   {
      path: "/home/score-table?tournamentIds=162,163,164,165,166,167,168,169,170&groupDisplayTime=5&refreshInterval=10",
      name: "Score Table",
      color: "#2e55b9",
    },
    {
      path: "/home/today-match?tournamentId=47",
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
