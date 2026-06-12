/* Default / shared images */
import sponsorTmp from "./sponsor-tmp-2026.png";
import padelCollective from "./fix/padel_collective.png";
import apptCup from "./fix/appt-cup.png";
import greenwich from "./fix/greenwich-w.png";
import mmiCup from "./fix/mmi-cup.png";
import mmiBg from "./mmi-bg.png";
import sponsorMMI1 from "./fix/sponsor-mmi-1.png";
import sponsorMMI2 from "./fix/sponsor-mmi-2.png";
import playproWhite from "./fix/playpro-w.png";
import legendsLogo from "./fix/legends-logo.png";
import gkBg from "./gk-bg.png";
import sponsorAppt from "./fix/sponsor-appt.png";
import sponsorKG from "./sponsor-kg.png";
import sponsorKG2 from "./sponsor-kg-2.png";
import gkCup from "./fix/gk-cup.png";
import padelIn from "./fix/padelin.png";
import adsS1 from "./ads_s1.png";
import adsS2 from "./ads_s2.png";
import adsS3 from "./ads_s3.png";
import adsS4 from "./ads_s4.png";
// import playpro from "./playpro.png";
import playproColorVertical from "./playpro_logo_vertical.png";
import gkLogo from "./fix/kg-logo.png";
import tmpLogo from "./tmp-logo.png";
import tmpCup from "./fix/tmp-cup.png";
import apptBg from "./appt-bg.png";
import premierWhite from "./premier-white.png";
import pvc4 from "./pvc-4.png";
import pvc4Bg from "./pvc-4-bg.jpg";
import premierCup from "./premier-cup.png";
import apptCup3 from "./fix/appt-cup-3.png";
import padelVerse from "./padel-verse.png";
import padelverse_W from "./fix/padelvers.png";
import appStore from "./apple.jpg";
import googlePlay from "./google.jpg";
import shamsiPadelOpenCup from "./fix/shamsi-padel-open-cup.png";
import shamsiPadelOpenBg from "./shamsi-padel-open-bg.png";
import crossCourt from "./fix/cross-court.png";
import sponsorShamsiPadelOpen1 from "./fix/sponsor-shamshi.png";
import ogsLogo from "./fix/ogs-logo.png";
import ogsBg from "./ogs-bg.jpg";
import meydanLogo from "./fix/meydan-logo.png";
import centenaryLogo from "./fix/centenary.png";
// import centenaryBg from "./centenary-bg.jpg";
import centenaryCup from "./fix/centenary-cup.png";
import sponsorCentenary from "./fix/sponsor-centenary.png";

import indoljLogo from "./fix/indolj-logo.png";
import indoljCup from "./fix/indolj-cup.png";
import indoljBg from "./indolj-bg.png"; 
import playpro from "./fix/playpro.png";

import ads_indolj_1 from "./fix/ads_indolj-1.png";
import ads_indolj_2 from "./fix/ads_indolj-2.png";
import ads_indolj_3 from "./fix/ads_indolj-3.png";
import ads_indolj_4 from "./fix/ads_indolj-4.png";

import tampsLogo from "./fix/tamps-logo.png";
import tampsCup from "./fix/tamps-cup.png";




// import sponsorShamsiPadelOpen2 from "./fix/sponsor-shamsi-padel-open-2.png";
/**
 * Flat map of all imported images by key.
 * Used by getImagesForTournament to resolve tournament-specific images.
 */
export const ALL_IMAGES = {
  "tmp-logo": tmpLogo,
  "playpro-w": playproWhite,
  "kg-logo": gkLogo,
  "tmp-cup": tmpCup,
  "gk-cup": gkCup,
  "legends-logo": legendsLogo,
  "padel-in": padelIn,
  "appt-bg": apptBg,
  "sponsor-tmp-2026": sponsorTmp,
  "sponsor-kg": sponsorKG,
  "sponsor-kg-2": sponsorKG2,
  "gk-bg": gkBg,
  ads_s1: adsS1,
  ads_s2: adsS2,
  ads_s3: adsS3,
  ads_s4: adsS4,
  // playpro: playpro,
  padel_collective: padelCollective,
  "premier-white": premierWhite,
  "pvc-4": pvc4,
  "pvc-4-bg": pvc4Bg,
  "premier-cup": premierCup,
  "appt-cup": apptCup,
  "appt-cup3": apptCup3,
  "sponsor-appt": sponsorAppt,
  padelverselogo: padelverse_W,
  apple: appStore,
  google: googlePlay,
  playpro_logo_vertical: playproColorVertical,
  "mmi-cup": mmiCup,
  "mmi-bg": mmiBg,
  greenwich: greenwich,
  "sponsor-mmi-1": sponsorMMI1,
  "sponsor-mmi-2": sponsorMMI2,
  "shamsi-padel-open-cup": shamsiPadelOpenCup,
  "shamsi-padel-open-bg": shamsiPadelOpenBg,
  "cross-court": crossCourt,
  "sponsor-shamshi": sponsorShamsiPadelOpen1,
  "ogs-logo": ogsLogo,
  "ogs-bg": ogsBg,
  "meydan-logo": meydanLogo,
  "centenary-logo": centenaryLogo,
  // "centenary-bg": centenaryBg,
  "centenary-cup": centenaryCup,
  "sponsor-centenary": sponsorCentenary,


  "indolj-logo": indoljLogo,
  "indolj-cup": indoljCup,
  "indolj-bg": indoljBg,
  playpro: playpro,
  "ads_indolj_1": ads_indolj_1,
  "ads_indolj_2": ads_indolj_2,
  "ads_indolj_3": ads_indolj_3,
  "ads_indolj_4": ads_indolj_4,
  "tamps-logo": tampsLogo,
  "tamps-cup": tampsCup,
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
