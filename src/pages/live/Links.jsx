import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../../assets/css/home.css";
import { useTournamentImages } from "../../context/TournamentImagesContext";

const Links = () => {
  const images = useTournamentImages();
  const pagespadelverse = [
    {
      path: "/streaming-live-court?tournamentId=46&courtId=79",
      name: "Galaxy 1",
      color: "#2e55b9",
    },
    {
      path: "/streaming-live-court?tournamentId=46&courtId=80",
      name: "Galaxy 2",
      color: "#2e55b9",
    },
    {
      path: "/streaming-live-court?tournamentId=46&courtId=81",
      name: "Galaxy 3",
      color: "#2e55b9",
    },
    {
      path: "/streaming-live-court?tournamentId=46&courtId=82",
      name: "Galaxy 4",
      color: "#2e55b9",
    },
    {
      path: "/streaming-live-court?tournamentId=46&courtId=83",
      name: "Black Star 1",
      color: "#2e55b9",
    },
    {
      path: "/streaming-live-court?tournamentId=46&courtId=84",
      name: "Black Star 2",
      color: "#2e55b9",
    },
    {
      path: "/streaming-live-court?tournamentId=46&courtId=85",
      name: "Infinity",
      color: "#2e55b9",
    },
  ];

  const pagestmp = [
    {
      path: "/streaming-live-court?tournamentId=49&courtId=105",
      name: "Court 1",
      color: "#2e55b9",
    },
    {
      path: "/streaming-live-court?tournamentId=49&courtId=106",
      name: "Court 2",
      color: "#2e55b9",
    },
    {
      path: "/streaming-live-court?tournamentId=49&courtId=107",
      name: "Court 3",
      color: "#2e55b9",
    },
    {
      path: "/streaming-live-court?tournamentId=49&courtId=263",
      name: "Court 4",
      color: "#2e55b9",
    },
  ];

  return (
    <div className="home-container">
      <div className="home-header">
        <img width={300} src={images.playpro} alt="logo" />
      </div>

      <h1 className="text-2xl  font-bold text-black mb-5">TMP</h1>

      <div className="buttons-grid">
        {pagestmp.map((page, index) => (
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

      {/* <h1 className="text-2xl  font-bold text-black mb-5">Padelverse</h1>
      <div className="buttons-grid">
        {pagespadelverse.map((page, index) => (
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
      </div> */}
    </div>
  );
};

export default Links;
