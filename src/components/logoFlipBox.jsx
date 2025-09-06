import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ImageConstants } from "../assets/images/ImageConstants";
const LogoFlipBox = () => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Auto-flip every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsFlipped((prev) => !prev);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Manual flip on click
  const handleClick = () => {
    setIsFlipped((prev) => !prev);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full p-8">
      <div
        className="relative w-64 h-64 cursor-pointer perspective-1000"
        onClick={handleClick}
      >
        <div
          className={`relative w-full h-full duration-1000 transform-style-preserve-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front face - PlayPro logo */}
          <div className="absolute w-full h-full   flex items-center justify-center backface-hidden">
            <motion.img
              width={300}
              src={ImageConstants.playproWhite}
              alt="Playpro"
            />
            {/* <div className="p-4 flex items-center justify-center">
              <div className="w-48 h-48 bg-gray-800 flex items-center justify-center text-white font-bold text-xl rounded">
                PlayPro Logo
              </div>
            </div> */}
          </div>

          {/* Back face - PadelVerse logo */}
          <div className="absolute w-full h-full flex items-center justify-center backface-hidden rotate-y-180">
            {/* <div className="p-4 flex items-center justify-center">
              <div className="w-48 h-48 bg-blue-600 flex items-center justify-center text-white font-bold text-xl rounded">
                PadelVerse Logo
              </div>
            </div> */}
            <motion.img
              width={300}
              src={ImageConstants.padelVerse}
              alt="Playpro"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// We need to add some global CSS to make the 3D effect work
const styleTag = document.createElement("style");
styleTag.innerHTML = `
  .perspective-1000 {
    perspective: 1000px;
  }
  .transform-style-preserve-3d {
    transform-style: preserve-3d;
  }
  .backface-hidden {
    backface-visibility: hidden;
  }
  .rotate-y-180 {
    transform: rotateY(180deg);
  }
`;
document.head.appendChild(styleTag);

export default LogoFlipBox;
