/* Default / shared images */
import sponsorTmp from "./sponsor-tmp-2026.png";
import adsS1 from "./ads_s1.png";
import adsS2 from "./ads_s2.png";
import adsS3 from "./ads_s3.png";
import adsS4 from "./ads_s4.png";
import playproWhite from "./fix/playpro-w.png";
import playpro from "./playpro.png";
import playproColorVertical from "./playpro_logo_vertical.png";
import tmpLogo from "./tmp-logo.png";
import tmpCup from "./fix/tmp-cup.png";
import apptBg from "./appt-bg.png";
import padelCollective from "./padel_collective.png";
import premierWhite from "./premier-white.png";
import pvc4 from "./pvc-4.png";
import pvc4Bg from "./pvc-4-bg.jpg";
import premierCup from "./premier-cup.png";
import apptCup from "./appt-cup.png";
import apptCup3 from "./appt-cup3.png";
import padelVerse from "./padel-verse.png";
import padelverse_W from "./fix/padelvers.png";
import appStore from "./apple.jpg";
import googlePlay from "./google.jpg";
import logo1 from "./logos/1.png";
import logo2 from "./logos/2.png";
import logo3 from "./logos/3.png";
import logo4 from "./logos/4.png";
import logo5 from "./logos/5.png";
import logo6 from "./logos/6.png";
import logo7 from "./logos/7.png";
import logo8 from "./logos/8.png";
import logo9 from "./logos/9.png";

/**
 * Flat map of all imported images by key.
 * Used by getImagesForTournament to resolve tournament-specific images.
 */
export const ALL_IMAGES = {
  "tmp-logo": tmpLogo,
  "playpro-w": playproWhite,
  "tmp-cup": tmpCup,
  "appt-bg": apptBg,
  "sponsor-tmp-2026": sponsorTmp,
  ads_s1: adsS1,
  ads_s2: adsS2,
  ads_s3: adsS3,
  ads_s4: adsS4,
  playpro: playpro,
  padel_collective: padelCollective,
  "premier-white": premierWhite,
  "pvc-4": pvc4,
  "pvc-4-bg": pvc4Bg,
  "premier-cup": premierCup,
  "appt-cup": apptCup,
  "appt-cup3": apptCup3,
  padelverselogo: padelverse_W,
  apple: appStore,
  google: googlePlay,
  playpro_logo_vertical: playproColorVertical,
  logo1,
  logo2,
  logo3,
  logo4,
  logo5,
  logo6,
  logo7,
  logo8,
  logo9,
};

/**
 * Default ImageConstants for backward compatibility.
 * Same variable names, resolves to default images.
 */
export const ImageConstants = {
  leftLogo: tmpLogo,
  rightLogo: playproWhite,
  cupLogo: tmpCup,
  sponsor1: sponsorTmp,
  sponsor2: sponsorTmp,
  sponsor3: adsS3,
  sponsor4: adsS4,
  playproWhite,
  playpro,
  bg: apptBg,
  appStore,
  googlePlay,
  playproColorVertical,
  padelverse_W,
  premierCup,
};
