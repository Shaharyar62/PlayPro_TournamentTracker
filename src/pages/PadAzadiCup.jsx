import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../assets/css/home.css";
import { useTournamentImages } from "../context/TournamentImagesContext";

const TOURNAMENT_ID = "81";
const DISPLAY_ID = "81";
const BUTTON_COLOR = "#aacb32";


const COURT_IDS = "418,419,420,421,422,423";

const PadAzadiCup = () => {
  const images = useTournamentImages();
  const pages = [
    {
      path: `/home/live-court?tournamentId=${TOURNAMENT_ID}&courtId=139&displayId=${DISPLAY_ID}`,
      name: "Court 1",
      color: BUTTON_COLOR,
    },
    {
      path: `/home/live-court?tournamentId=${TOURNAMENT_ID}&courtId=140&displayId=${DISPLAY_ID}`,
      name: "Court 2",
      color: BUTTON_COLOR,
    },
    {
      path: `/home/live-court?tournamentId=${TOURNAMENT_ID}&courtId=141&displayId=${DISPLAY_ID}`,
      name: "Court 3",
      color: BUTTON_COLOR,
    },
    {
      path: `/home/live-court?tournamentId=${TOURNAMENT_ID}&courtId=142&displayId=${DISPLAY_ID}`,
      name: "Court 4",
      color: BUTTON_COLOR,
    },
    {
      path: `/home/live-court?tournamentId=${TOURNAMENT_ID}&courtId=143&displayId=${DISPLAY_ID}`,
      name: "Court 5",
      color: BUTTON_COLOR,
    },
    {
      path: `/home/live-court?tournamentId=${TOURNAMENT_ID}&courtId=144&displayId=${DISPLAY_ID}`,
      name: "Court 6",
      color: BUTTON_COLOR,
    },
    // {
    //   path: `/home/live-court?tournamentId=${TOURNAMENT_ID}&courtId=260&displayId=${DISPLAY_ID}`,
    //   name: "MejorSet 1",
    //   color: BUTTON_COLOR,
    // },
    // {
    //   path: `/home/live-court?tournamentId=${TOURNAMENT_ID}&courtId=248&displayId=${DISPLAY_ID}`,
    //   name: "MejorSet 2",
    //   color: BUTTON_COLOR,
    // },
    {
      path: `/home/multi-court-live?tournamentId=${TOURNAMENT_ID}&courtId=${COURT_IDS}&displayId=${DISPLAY_ID}`,
      name: "Multi Court Live",
      color: BUTTON_COLOR,
    },
    {
      path: `/home/multi-court-schedule?masterTournamentId=${TOURNAMENT_ID}&courtId=${COURT_IDS}&displayId=${DISPLAY_ID}`,
      name: "Multi Court Schedule",
      color: BUTTON_COLOR,
    },
    {
      path: `/home/score-table?tournamentIds=313,314,315,316,317,318,319,320&groupDisplayTime=5&refreshInterval=10&tournamentId=${TOURNAMENT_ID}&displayId=${DISPLAY_ID}`,
      name: "Score Table",
      color: BUTTON_COLOR,
    },
    {
      path: `/home/today-match?tournamentId=${TOURNAMENT_ID}&displayId=${DISPLAY_ID}`,
      name: "Today's Matches",
      color: BUTTON_COLOR,
    },
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

export default PadAzadiCup;
