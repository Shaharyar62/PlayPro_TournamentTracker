import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../assets/css/home.css";
import { useTournamentImages } from "../context/TournamentImagesContext";

const TOURNAMENT_ID = "99";
const COURT_DISPLAY_ID = "94";
const MULTI_COURT_LIVE_DISPLAY_ID = "941";
const MULTI_COURT_SCHEDULE_DISPLAY_ID = "942";
const SCORE_TABLE_DISPLAY_ID = "943";
const TODAY_MATCH_DISPLAY_ID = "944";
const THEME_ID = "padel-for-pink";
const BUTTON_COLOR = "#2e55b9";

const COURT_IDS = "209,206,207,208,264,265,210,211,212,213";
const SCORE_TABLE_TOURNAMENT_IDS = "370,369,368,367,366";

const COURTS = [
  { courtId: "209", name: "Court 1 (Padel 1)" },
  { courtId: "206", name: "Court 2 (Padel R1)" },
  { courtId: "207", name: "Court 3 (Padel R2)" },
  { courtId: "208", name: "Court 4 (Padel X)" },
  { courtId: "264", name: "Court 5 (Champion Court 1)" },
  { courtId: "265", name: "Court 6 (Champion Court 2)" },
  { courtId: "210", name: "Court 7 (Padel 2)" },
  { courtId: "211", name: "Court 8 (Padel 3)" },
  { courtId: "212", name: "Court 9 (Padel 4)" },
  { courtId: "213", name: "Court 10 (Padel 5)" },
];

const PadelForPink = () => {
  const images = useTournamentImages();

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

export default PadelForPink;
