import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../../assets/css/home.css";
import { useTournamentImages } from "../../context/TournamentImagesContext";

const StreamingHome = () => {
  const images = useTournamentImages();
  const defaultDisplayId = "court-79";

  const pages = [
    {
      tournamentId: "25",
      courtId: "79",
      name: "Galaxy 1 -",
      color: "#2e55b9",
    },
    {
      tournamentId: "25",
      courtId: "80",
      name: "Galaxy 2",
      color: "#2e55b9",
    },
    {
      tournamentId: "25",
      courtId: "81",
      name: "Galaxy 3",
      color: "#2e55b9",
    },
    {
      tournamentId: "25",
      courtId: "82",
      name: "Galaxy 4",
      color: "#2e55b9",
    },
    {
      tournamentId: "25",
      courtId: "83",
      name: "Black Star 1 -",
      color: "#2e55b9",
    },
    {
      tournamentId: "25",
      courtId: "84",
      name: "Black Star 2",
      color: "#2e55b9",
    },
    {
      tournamentId: "25",
      courtId: "85",
      name: "Infinity -",
      color: "#2e55b9",
    },
  ];

  const buildOverlayPath = (tournamentId, courtId) =>
    `/streaming-live-court?tournamentId=${tournamentId}&courtId=${courtId}&displayId=${defaultDisplayId}`;

  const buildSetupPath = (tournamentId, courtId) =>
    `/home/scorebug-setup?displayId=${defaultDisplayId}&tournamentId=${tournamentId}&courtId=${courtId}`;

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
              to={buildOverlayPath(page.tournamentId, page.courtId)}
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
            <Link
              to={buildSetupPath(page.tournamentId, page.courtId)}
              className="nav-button"
              style={{
                backgroundColor: "#1a2744",
                marginTop: "8px",
                fontSize: "0.85rem",
              }}
            >
              Setup
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default StreamingHome;
