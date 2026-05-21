import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../../assets/css/home.css";
import { useTournamentImages } from "../../context/TournamentImagesContext";

const Links = () => {
  const images = useTournamentImages();
  const pagespadelverse = [
    {
      path: "/streaming-live-court?tournamentId=58&courtId=347",
      name: "Court 1",
      color: "#2e55b9",
    },
    {
      path: "/streaming-live-court?tournamentId=58&courtId=348",
      name: "Court 2",
      color: "#2e55b9",
    },
    {
      path: "/streaming-live-court?tournamentId=58&courtId=349",
      name: "Court 3",
      color: "#2e55b9",
    },
    {
      path: "/streaming-live-court?tournamentId=58&courtId=350",
      name: "Court 4",
      color: "#2e55b9",
    },
    {
      path: "/streaming-live-court?tournamentId=58&courtId=351",
      name: "Court 5",
      color: "#2e55b9",
    },
  ];

  const centenary = [
    {
      path: "/streaming-live-court?tournamentId=65&courtId=260",
      name: "MejorSet 1",
      color: "#2e55b9",
    },
    {
      path: "/streaming-live-court?tournamentId=65&courtId=248",
      name: "MejorSet 2",
      color: "#2e55b9",
    },
    {
      path: "/streaming-live-court?tournamentId=65&courtId=144",
      name: "Cherry 2",
      color: "#2e55b9",
    },
    {
      path: "/streaming-live-court?tournamentId=65&courtId=143",
      name: "Cherry 1",
      color: "#2e55b9",
    },
    {
      path: "/streaming-live-court?tournamentId=65&courtId=142",
      name: "Tera 2",
      color: "#2e55b9",
    },
    {
      path: "/streaming-live-court?tournamentId=65&courtId=141",
      name: "Tera 1",
      color: "#2e55b9",
    },
    {
      path: "/streaming-live-court?tournamentId=65&courtId=140",
      name: "Ocean 2",
      color: "#2e55b9",
    },
    {
      path: "/streaming-live-court?tournamentId=65&courtId=139",
      name: "Ocean 1",
      color: "#2e55b9",
    },
     
  
  ];

  return (
    <div className="home-container">
      <div className="home-header">
        <img width={300} src={images.playpro} alt="logo" />
      </div>

      <h1 className="text-2xl  font-bold text-black mb-5">Centenary</h1>

      <div className="buttons-grid">
        {centenary.map((page, index) => (
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
