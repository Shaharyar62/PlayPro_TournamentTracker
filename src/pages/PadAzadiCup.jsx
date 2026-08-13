import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../assets/css/home.css";
import { useTournamentImages } from "../context/TournamentImagesContext";

const TOURNAMENT_ID = "81";
const COURT_DISPLAY_ID = "81";
const MULTI_COURT_LIVE_DISPLAY_ID = "811";
const MULTI_COURT_SCHEDULE_DISPLAY_ID = "812";
const SCORE_TABLE_DISPLAY_ID = "813";
const TODAY_MATCH_DISPLAY_ID = "814";
const BUTTON_COLOR = "#aacb32";

const COURT_IDS = "418,419,420,421,422,423";
const SCORE_TABLE_TOURNAMENT_IDS =
  "313,314,315,316,317,318,319,320";

const COURTS = [
  { courtId: "418", name: "Court 1" },
  { courtId: "419", name: "Court 2" },
  { courtId: "420", name: "Court 3" },
  { courtId: "421", name: "Court 4" },
  { courtId: "422", name: "Court 5" },
  { courtId: "423", name: "Court 6" },
];

const PadAzadiCup = () => {
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

export default PadAzadiCup;
