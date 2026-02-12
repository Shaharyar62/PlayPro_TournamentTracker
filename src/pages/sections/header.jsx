import { motion } from "framer-motion";
import { useTournamentImages } from "../../context/TournamentImagesContext";

const Header = ({ displayTime }) => {
  const images = useTournamentImages();
  return (
    <>
      <div
        className="w-full mt-[40px] flex justify-end mb-2"
        style={{ marginBottom: "-170px" }}
      >
        <div className="bg-[var(--color-primary)] p-[15px] rounded-lg shadow-lg text-[55px] font-bold">
          {displayTime.format("HH:mm:ss")}
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center grid grid-cols-3 gap-4 items-center justify-center"
      >
        <motion.div
          style={{ position: "relative", top: "" }}
          className="w-[250px]"
        >
          <img
            width={300}
            className="justify-self-end"
            src={images.padelVerse}
            alt="Playpro"
          />
        </motion.div>

        <div className="text-center">
          <h1 className="text-6xl font-bold mt-4">MATCH SCHEDULE</h1>
          <p
            style={{
              color: "var(--color-primary)",
              textShadow: "1px 1px 8px white, 3px 3px 11px white",
              fontWeight: 700,
              fontSize: "var(--font-4xl)",
            }}
            className="text-[var(--color-background-mid)] text-4xl mt-2 font-semibold"
          >
            HAPPENING NOW
          </p>
        </div>
        <img
          width={300}
          className="justify-self-end"
          src={images.playproWhite}
          alt="Playpro"
        />
      </motion.div>
    </>
  );
};

export default Header;
