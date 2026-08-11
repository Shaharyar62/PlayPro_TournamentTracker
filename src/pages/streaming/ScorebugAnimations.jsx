import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const springSnap = { type: "spring", stiffness: 520, damping: 32, mass: 0.8 };

export const scorebugBarVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.12 },
  },
};

export const scorebugPanelVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

export const scorebugFooterVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 },
  },
};

export const ScorebugWrap = ({ children, visible }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        className="scorebug-wrap"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="scorebug-stack">{children}</div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const ScorebugBar = ({ children }) => (
  <motion.div
    className="scorebug-bar"
    variants={scorebugBarVariants}
    initial="hidden"
    animate="show"
  >
    {children}
  </motion.div>
);

export const ScorebugPanel = ({ className, children, flash = false }) => (
  <motion.div
    className={`scorebug-panel ${className}${flash ? " scorebug-panel--flash" : ""}`}
    variants={scorebugPanelVariants}
  >
    {children}
  </motion.div>
);

export const ScorebugFooter = ({ children }) => (
  <motion.div className="scorebug-footer" variants={scorebugFooterVariants}>
    <span className="scorebug-footer-inner">{children}</span>
  </motion.div>
);

export const AnimatedScoreValue = ({ value, className }) => (
  <span className={`scorebug-score-slot ${className ?? ""}`}>
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={String(value)}
        className="scorebug-score-value"
        initial={{ y: "-110%", opacity: 0, scale: 0.75, filter: "blur(4px)" }}
        animate={{ y: "0%", opacity: 1, scale: 1, filter: "blur(0px)" }}
        exit={{ y: "110%", opacity: 0, scale: 0.85, filter: "blur(2px)" }}
        transition={springSnap}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  </span>
);

export const AnimatedServeIndicator = ({ show }) => (
  <AnimatePresence>
    {show && (
      <motion.span
        className="scorebug-serve"
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: 1,
        }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{
          scale: { repeat: Infinity, duration: 1.4, ease: "easeInOut" },
          opacity: { duration: 0.2 },
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <circle cx="12" cy="12" r="8" fill="var(--sb-serve, #38bdf8)" />
        </svg>
      </motion.span>
    )}
  </AnimatePresence>
);

export const AnimatedTeamRow = ({ serving, children }) => (
  <div className={`scorebug-row${serving ? " scorebug-row--serving" : ""}`}>
    {children}
  </div>
);

export const AnimatedHeaderLabel = ({ text }) => (
  <AnimatePresence mode="wait">
    <motion.span
      key={text}
      className="scorebug-points-label"
      initial={{ opacity: 0, y: -6, letterSpacing: "0.2em" }}
      animate={{ opacity: 1, y: 0, letterSpacing: "0.06em" }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.35 }}
    >
      {text}
    </motion.span>
  </AnimatePresence>
);

/** Tracks value changes and exposes flash state for panels */
export function useScoreChangeFlash(values, durationMs = 650) {
  const prevRef = useRef(null);
  const timerRef = useRef(null);
  const [flashKeys, setFlashKeys] = React.useState(new Set());

  useEffect(() => {
    const key = JSON.stringify(values);
    if (prevRef.current !== null && prevRef.current !== key) {
      const changed = new Set();
      Object.entries(values).forEach(([k, v]) => {
        try {
          const prev = JSON.parse(prevRef.current);
          if (prev[k] !== v) changed.add(k);
        } catch {
          changed.add(k);
        }
      });
      if (changed.size) {
        setFlashKeys(changed);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setFlashKeys(new Set()), durationMs);
      }
    }
    prevRef.current = key;
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [values, durationMs]);

  return flashKeys;
}

export const AnimatedWarning = ({ code }) => (
  <motion.span
    className={`scorebug-warning ${
      code === "W1" ? "scorebug-warning--yellow" : "scorebug-warning--red"
    }`}
    initial={{ scale: 0, opacity: 0, x: 8 }}
    animate={{ scale: 1, opacity: 1, x: 0 }}
    transition={springSnap}
  >
    {code}
  </motion.span>
);
