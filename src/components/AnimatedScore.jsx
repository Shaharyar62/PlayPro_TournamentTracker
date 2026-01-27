import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Custom hook to track previous value
const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
};

const AnimatedScore = ({ 
  score, 
  isGameScore = false, 
  className = "",
  textColor = "text-black"
}) => {
  const previousScore = usePrevious(score);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    // Only animate if score actually changed
    if (previousScore !== undefined && previousScore !== score) {
      setAnimationKey(prev => prev + 1);
    }
  }, [score, previousScore]);

  const flipVariants = {
    initial: { 
      rotateX: 90,
      opacity: 0,
    },
    animate: { 
      rotateX: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      }
    },
    exit: {
      rotateX: -90,
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeIn",
      }
    }
  };

  return (
    <div 
      className="relative inline-block" 
      style={{ 
        perspective: "1000px",
        perspectiveOrigin: "center center",
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${score}-${animationKey}`}
          variants={flipVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={`${className} ${textColor}`}
          style={{
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
            transformOrigin: "center bottom",
          }}
        >
          <span
            className={`
              inline-block
              ${isGameScore ? 'animated-game-score' : 'animated-set-score'}
            `}
            style={{
              display: "inline-block",
              fontWeight: "900",
            }}
          >
            {score}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default React.memo(AnimatedScore);
