import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../assets/css/home.css";
import { useTournamentImages } from "../context/TournamentImagesContext";

const TOURNAMENT_ID = "73";
const COURT_DISPLAY_ID = "73";
const MULTI_COURT_LIVE_DISPLAY_ID = "731";
const MULTI_COURT_SCHEDULE_DISPLAY_ID = "732";
const SCORE_TABLE_DISPLAY_ID = "733";
const TODAY_MATCH_DISPLAY_ID = "734";
const BUTTON_COLOR = "#373735";

const COURT_IDS = "139,140,141,142,143,144,260,248";
const SCORE_TABLE_TOURNAMENT_IDS =
  "264,265,266,267,268,269,270";

const COURTS = [
  { courtId: "139", name: "Ocean 1" },
  { courtId: "140", name: "Ocean 2" },
  { courtId: "141", name: "Tera 1" },
  { courtId: "142", name: "Tera 2" },
  { courtId: "143", name: "Cherry 1" },
  { courtId: "144", name: "Cherry 2" },
  { courtId: "260", name: "MejorSet 1" },
  { courtId: "248", name: "MejorSet 2" },
];

const HeritageCup = () => {
  const images = useTournamentImages();

  const courtPages = COURTS.map(({ courtId, name }) => ({
    path: `/home/live-court?tournamentId=${TOURNAMENT_ID}&courtId=${courtId}&displayId=${COURT_DISPLAY_ID}`,
    name,
    color: BUTTON_COLOR,
  }));

  const pages = [
    ...courtPages,
    {
      path: `/home/multi-court-live?tournamentId=${TOURNAMENT_ID}&courtId=${COURT_IDS}&displayId=${MULTI_COURT_LIVE_DISPLAY_ID}`,
      name: "Multi Court Live",
      color: BUTTON_COLOR,
    },
    {
      path: `/home/multi-court-schedule?masterTournamentId=${TOURNAMENT_ID}&courtId=${COURT_IDS}&displayId=${MULTI_COURT_SCHEDULE_DISPLAY_ID}`,
      name: "Multi Court Schedule",
      color: BUTTON_COLOR,
    },
    {
      path: `/home/score-table?tournamentIds=${SCORE_TABLE_TOURNAMENT_IDS}&groupDisplayTime=5&refreshInterval=10&tournamentId=${TOURNAMENT_ID}&displayId=${SCORE_TABLE_DISPLAY_ID}`,
      name: "Score Table",
      color: BUTTON_COLOR,
    },
    {
      path: `/home/today-match?tournamentId=${TOURNAMENT_ID}&displayId=${TODAY_MATCH_DISPLAY_ID}`,
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
            key={page.path}
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

export default HeritageCup;
