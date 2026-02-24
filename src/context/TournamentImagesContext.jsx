import { createContext, useContext, useMemo } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { ALL_IMAGES, ImageConstants } from "../assets/images/ImageConstants";
import { getImagesForTournament } from "../const/tournamentImageConfig";

const TournamentImagesContext = createContext(ImageConstants);

export function TournamentImagesProvider({ children }) {
  const [searchParams] = useSearchParams();
  const params = useParams();

  // Support tournamentId, masterTournamentId, or first ID from tournamentIds (for ScoreTable)
  let tournamentId =
    searchParams.get("tournamentId") ||
    searchParams.get("masterTournamentId") ||
    params?.tournamentId ||
    null;

  if (!tournamentId && searchParams.get("tournamentIds")) {
    try {
      const parsed = JSON.parse(searchParams.get("tournamentIds"));
      tournamentId = Array.isArray(parsed) ? parsed[0] : parsed;
    } catch {
      const csv = searchParams.get("tournamentIds").split(",").map((id) => id.trim())[0];
      tournamentId = csv || null;
    }
  }

  const images = useMemo(() => {
    return getImagesForTournament(tournamentId, ALL_IMAGES);
  }, [tournamentId]);

  return (
    <TournamentImagesContext.Provider value={images}>
      {children}
    </TournamentImagesContext.Provider>
  );
}

export function useTournamentImages() {
  const context = useContext(TournamentImagesContext);
  return context || ImageConstants;
}
