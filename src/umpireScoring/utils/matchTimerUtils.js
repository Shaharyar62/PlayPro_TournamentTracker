/**
 * Format seconds as MM:SS or HH:MM:SS
 * @param {number} seconds - Elapsed seconds
 * @returns {string}
 */
export function formatElapsedTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Compute current elapsed seconds from matchTimer state
 * @param {Object|null} matchTimer - { elapsedSeconds, startedAt, status }
 * @returns {number}
 */
export function computeElapsedSeconds(matchTimer) {
  if (!matchTimer) return 0;
  const { elapsedSeconds = 0, startedAt, status } = matchTimer;
  if (status === "running" && typeof startedAt === "number") {
    return elapsedSeconds + Math.floor((Date.now() - startedAt) / 1000);
  }
  return elapsedSeconds;
}
