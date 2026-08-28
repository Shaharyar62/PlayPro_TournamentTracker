import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../assets/css/home.css";
import { useTournamentImages } from "../context/TournamentImagesContext";

const TOURNAMENT_ID = "";
const BUTTON_COLOR = "#373735";

const CLUBS = [
  { name: "The Match Point", courtIds: "263,107,106,105" },
  {
    name: "Legends Arena",
    courtIds: "265,264,213,212,211,210,209,208,207,206",
  },
  { name: "Padel X", courtIds: "260,248,144,143,142,141,140,139" },
  { name: "Viva Padel Club", courtIds: "432,431" },
  { name: "Neo Maidan Stadium", courtIds: "159,158,157" },
];

const ALL_COURT_IDS = CLUBS.map((club) => club.courtIds).join(",");

const MultiClub = () => {
  const images = useTournamentImages();

  const pages = [
    ...CLUBS.map((club) => ({
      path: `/home/multi-court-live?tournamentId=${TOURNAMENT_ID}&courtId=${club.courtIds}`,
      name: club.name,
    }))
    // {
    //   path: `/home/multi-court-live?tournamentId=${TOURNAMENT_ID}&courtId=${ALL_COURT_IDS}`,
    //   name: "Multi Court Live",
    // },
    // {
    //   path: `/home/multi-court-schedule?masterTournamentId=${TOURNAMENT_ID}&courtId=${ALL_COURT_IDS}`,
    //   name: "Multi Court Schedule",
    // },
    // {
    //   path: `/home/today-match?tournamentId=${TOURNAMENT_ID}`,
    //   name: "Today's Matches",
    // },
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
              style={{ backgroundColor: BUTTON_COLOR }}
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

export default MultiClub;
