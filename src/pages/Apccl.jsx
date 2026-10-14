import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../assets/css/home.css";
import { ALL_IMAGES } from "../assets/images/ImageConstants";

const TOURNAMENT_ID = "101";
const COURT_DISPLAY_ID = "101";
const MULTI_COURT_LIVE_DISPLAY_ID = "1011";
const MULTI_COURT_SCHEDULE_DISPLAY_ID = "1012";
const SCORE_TABLE_DISPLAY_ID = "1013";
const TODAY_MATCH_DISPLAY_ID = "1014";
const THEME_ID = "apccl";

const COURT_IDS =
  "64,65,66,87,105,106,107,115,116,117,452,132,133,134,135,139,140,141,142,157,158,159";
const SCORE_TABLE_TOURNAMENT_IDS = "376,375,374,373,372";

const COURTS = [
  { courtId: "64", name: "Premier Club — Court 1" },
  { courtId: "65", name: "Premier Club — Court 2" },
  { courtId: "66", name: "Premier Club — Court 3" },
  { courtId: "87", name: "Maidan — Court 1" },
  { courtId: "105", name: "The Match Point — Court 1" },
  { courtId: "106", name: "The Match Point — Court 2" },
  { courtId: "107", name: "The Match Point — Court 3" },
  { courtId: "115", name: "Smash X — Court 1" },
  { courtId: "116", name: "Smash X — Court 2" },
  { courtId: "117", name: "Smash X — Court 3" },
  { courtId: "452", name: "Smash X — Court 4" },
  { courtId: "132", name: "Club Vibora — Blue 1" },
  { courtId: "133", name: "Club Vibora — Blue 2" },
  { courtId: "134", name: "Club Vibora — Red 1" },
  { courtId: "135", name: "Club Vibora — Red 2" },
  { courtId: "139", name: "PADEL X — Ocean 1" },
  { courtId: "140", name: "PADEL X — Ocean 2" },
  { courtId: "141", name: "PADEL X — Tera 1" },
  { courtId: "142", name: "PADEL X — Tera 2" },
  { courtId: "157", name: "Neo Maidan — Court 1" },
  { courtId: "158", name: "Neo Maidan — Court 2" },
  { courtId: "159", name: "Neo Maidan — Court 3" },
];

const BUTTON_STYLE = {
  background:
    "radial-gradient(120% 80% at 0% 0%, rgba(245, 197, 24, 0.22), transparent 46%), linear-gradient(165deg, #16140e 0%, #0c0c0e 100%)",
  color: "#ffe566",
  border: "2px solid #f5c518",
  boxShadow:
    "0 0 22px rgba(245, 197, 24, 0.28), inset 0 0 24px rgba(245, 197, 24, 0.1)",
};

const Apccl = () => {
  const courtPages = COURTS.map(({ courtId, name }) => ({
    path: `/home/live-court?tournamentId=${TOURNAMENT_ID}&courtId=${courtId}&displayId=${COURT_DISPLAY_ID}&themeId=${THEME_ID}`,
    name,
  }));

  const pages = [
    ...courtPages,
    {
      path: `/home/multi-court-live?tournamentId=${TOURNAMENT_ID}&courtId=${COURT_IDS}&displayId=${MULTI_COURT_LIVE_DISPLAY_ID}&themeId=${THEME_ID}`,
      name: "Multi Court Live",
    },
    {
      path: `/home/multi-court-schedule?masterTournamentId=${TOURNAMENT_ID}&courtId=${COURT_IDS}&displayId=${MULTI_COURT_SCHEDULE_DISPLAY_ID}&themeId=${THEME_ID}`,
      name: "Multi Court Schedule",
    },
    {
      path: `/home/score-table?tournamentIds=${SCORE_TABLE_TOURNAMENT_IDS}&groupDisplayTime=5&refreshInterval=10&tournamentId=${TOURNAMENT_ID}&displayId=${SCORE_TABLE_DISPLAY_ID}&themeId=${THEME_ID}`,
      name: "Score Table",
    },
    {
      path: `/home/today-match?tournamentId=${TOURNAMENT_ID}&displayId=${TODAY_MATCH_DISPLAY_ID}&themeId=${THEME_ID}`,
      name: "Today's Matches",
    },
  ];

  return (
    <div
      className="home-container"
      style={{
        background: `url(${ALL_IMAGES["apccl-bg"]}) center / cover no-repeat`,
        justifyContent: "flex-start",
        paddingTop: "2.5rem",
        paddingBottom: "3rem",
      }}
    >
      <div className="home-header">
        <img width={220} src={ALL_IMAGES.appcllogo} alt="APCCl" />
      </div>

      <div className="buttons-grid">
        {pages.map((page, index) => (
          <motion.div
            key={page.path}
            className="button-wrapper"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to={page.path} className="nav-button" style={BUTTON_STYLE}>
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

export default Apccl;
