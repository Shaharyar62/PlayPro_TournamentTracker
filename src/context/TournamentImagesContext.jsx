import { createContext, useContext, useMemo } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { ALL_IMAGES, ImageConstants } from "../assets/images/ImageConstants";
import { getImagesForTournament } from "../const/tournamentImageConfig";

const TournamentImagesContext = createContext(ImageConstants);

export function TournamentImagesProvider({ children }) {
  const [searchParams] = useSearchParams();
  const params = useParams();

  const tournamentId =
    searchParams.get("tournamentId") ||
    searchParams.get("masterTournamentId") ||
    params?.tournamentId ||
    null;

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
