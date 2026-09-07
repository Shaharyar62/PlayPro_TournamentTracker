import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../assets/css/home.css";
import { ALL_IMAGES } from "../assets/images/ImageConstants";

const TOURNAMENT_ID = "91";
const COURT_DISPLAY_ID = "91";
const MULTI_COURT_LIVE_DISPLAY_ID = "911";
const MULTI_COURT_SCHEDULE_DISPLAY_ID = "912";
const SCORE_TABLE_DISPLAY_ID = "913";
const TODAY_MATCH_DISPLAY_ID = "914";
const THEME_ID = "kfcpadel";
const BUTTON_COLOR = "#e4002b";

const COURT_IDS = "203,204,205";
const SCORE_TABLE_TOURNAMENT_IDS = "342";

const COURTS = [
  { courtId: "203", name: "Court 1" },
  { courtId: "204", name: "Court 2" },
  { courtId: "205", name: "Court 3" },
];

const KfcPadel = () => {
  const courtPages = COURTS.map(({ courtId, name }) => ({
    path: `/home/live-court?tournamentId=${TOURNAMENT_ID}&courtId=${courtId}&displayId=${COURT_DISPLAY_ID}&themeId=${THEME_ID}`,
    name,
    color: BUTTON_COLOR,
  }));

  const pages = [
    ...courtPages,
    {
      path: `/home/multi-court-live?tournamentId=${TOURNAMENT_ID}&courtId=${COURT_IDS}&displayId=${MULTI_COURT_LIVE_DISPLAY_ID}&themeId=${THEME_ID}`,
      name: "Multi Court Live",
      color: BUTTON_COLOR,
    },
    {
      path: `/home/multi-court-schedule?masterTournamentId=${TOURNAMENT_ID}&courtId=${COURT_IDS}&displayId=${MULTI_COURT_SCHEDULE_DISPLAY_ID}&themeId=${THEME_ID}`,
      name: "Multi Court Schedule",
      color: BUTTON_COLOR,
    },
    {
      path: `/home/score-table?tournamentIds=${SCORE_TABLE_TOURNAMENT_IDS}&groupDisplayTime=5&refreshInterval=10&tournamentId=${TOURNAMENT_ID}&displayId=${SCORE_TABLE_DISPLAY_ID}&themeId=${THEME_ID}`,
      name: "Score Table",
      color: BUTTON_COLOR,
    },
    {
      path: `/home/today-match?tournamentId=${TOURNAMENT_ID}&displayId=${TODAY_MATCH_DISPLAY_ID}&themeId=${THEME_ID}`,
      name: "Today's Matches",
      color: BUTTON_COLOR,
    },
  ];

  return (
    <div className="home-container">
      <div className="home-header">
        <img width={300} src={ALL_IMAGES.playpronewlogo} alt="logo" />
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

export default KfcPadel;
