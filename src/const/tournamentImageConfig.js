/**
 * Tournament Image Configuration
 * Maps tournamentId to image key overrides.
 * Each value references a key in ALL_IMAGES from ImageConstants.
 */

const DEFAULT_IMAGES = {
  leftLogo: "tmp-logo",
  rightLogo: "playpro-w",
  cupLogo: "tmp-cup",
  bg: "appt-bg",
  sponsor1: "sponsor-tmp-2026",
  sponsor2: "sponsor-tmp-2026",
  sponsor3: "ads_s3",
  sponsor4: "ads_s4",
  playproWhite: "playpro-w",
  playpro: "playpro",
  padelVerse: "padel-verse",
  premierCup: "premier-cup",
};

export const TOURNAMENT_IMAGES = {
  default: DEFAULT_IMAGES,
  46: {
    leftLogo: "padelverselogo",
    cupLogo: "pvc-4",
    bg: "pvc-4-bg",
    sponsor1: "ads_s1",
    sponsor2: "ads_s2",
  },
  47: {
    leftLogo: "padel_collective",
    rightLogo: "premier-white",
    cupLogo: "premier-cup",
    bg: "appt-bg",
    sponsor1: "ads_s1",
    sponsor2: "ads_s2",
  },
  52: {
    leftLogo: "kg-logo",
    rightLogo: "playpro-w",
    cupLogo: "gk-cup",
    bg: "gk-bg",
    sponsor1: "sponsor-kg",
    sponsor2: "sponsor-kg-2",
  },
  53: {
    leftLogo: "kg-logo",
    rightLogo: "playpro-w",
    bg: "gk-bg",

    sponsor1: "sponsor-kg",
    sponsor2: "sponsor-kg-2",
  },
  58: {
    leftLogo: "padel_collective",
    cupLogo: "appt-cup3",
    rightLogo: "legends-logo",
    // rightLogo: "padel-in",
    bg: "apptBg",

    sponsor1: "sponsor-appt",
    sponsor2: "sponsor-appt",
  },
  57: {
    leftLogo: "greenwich",
    cupLogo: "mmi-cup",
    rightLogo: "playpro-w",
    bg: "mmi-bg",
    sponsor1: "sponsor-mmi-1",
    sponsor2: "sponsor-mmi-2",
  },
  60: {
    leftLogo: "cross-court",
    cupLogo: "shamsi-padel-open-cup",
    rightLogo: "playpro-w",
    bg: "shamsi-padel-open-bg",
    sponsor1: "sponsor-shamshi",
    sponsor2: "sponsor-shamshi",
  },
  63: {
    leftLogo: "meydan-logo",
    cupLogo: "ogs-logo",
    rightLogo: "playpro-w",
    bg: "ogs-bg",
    sponsor1: "sponsor-appt",
    sponsor2: "sponsor-appt",
  },
  65: {
    leftLogo: "centenary-logo",
    cupLogo: "centenary-cup",
    rightLogo: "playpro-w",
    bg: "appt-bg",
    sponsor1: "sponsor-centenary",
    sponsor2: "sponsor-centenary",
  },
  68: {
    leftLogo: "indolj-logo",
    cupLogo: "indolj-cup",
    rightLogo: "playpro",
    bg: "indolj-bg",
    sponsor1: "ads_indolj_1",
    sponsor2: "ads_indolj_2",
  },
  67: {
    leftLogo: "tamps-logo",
    cupLogo: "tamps-cup",
    rightLogo: "playpro-w",
    bg: "pvc-4-bg",
    sponsor1: "ads_s1",
    sponsor2: "ads_s2",
  },
  75: {
    leftLogo: "legends-logo",
    cupLogo: "legends-cup",
    rightLogo: "playpro-w",
    bg: "legends-bg",
    sponsor1: "sponsor-lagends",
    sponsor2: "sponsor-lagends",
  },
  76: {
    leftLogo: "tmpwmoLeft",
    cupLogo: "tmpwmoCup",
    rightLogo: "playproWhite",
    bg: "tmpwmoBg",
    sponsor1: "tmpwmoSponsor",
    sponsor2: "tmpwmoSponsor",
  },
  73: {
    leftLogo: "heritageCupLeft",
    cupLogo: "heritageCupCup",
    rightLogo: "playpro",
    bg: "heritageCupBg",
    sponsor1: "heritageCupSponsor",
    sponsor2: "heritageCupSponsor",
  },
  99: {
    leftLogo: "padAzadiCupLeft",
    cupLogo: "padAzadiCupCup",
    rightLogo: "playproWhite",
    bg: "padAzadiCupBg",
    sponsor1: "padAzadiCupSponsor",
    sponsor2: "padAzadiCupSponsor",
  },
  81: {
    leftLogo: "padAzadiCupLeft",
    cupLogo: "padAzadiCupCup",
    rightLogo: "playproWhite",
    bg: "padAzadiCupBg",
    sponsor1: "padAzadiCupSponsor",
    sponsor2: "padAzadiCupSponsor",
  },
  83: {
    leftLogo: "alNadiAlBurhaniLeft",
    cupLogo: "alNadiAlBurhaniCup",
    rightLogo: "playpro-ww",
    playproWhite: "playpro-ww",
    bg: "alNadiAlBurhaniBg",
    sponsor1: "alNadiAlBurhaniSponsor",
    sponsor2: "alNadiAlBurhaniSponsor",
  },
  84: {
    leftLogo: "padelverseOnedayLeft",
    cupLogo: "padelverseOnedayCup",
    rightLogo: "padelverseOnedayRight",
    bg: "padelverseOnedayBg",
    sponsor1: null,
    sponsor2: null,
  },
  "fip-promises": {
    leftLogo: "fipPromisesLeft",
    cupLogo: "fipPromisesCup",
    rightLogo: "fipPromisesRight",
    bg: "fipPromisesBg",
    sponsor1: "fipPromisesSponsor",
    sponsor2: "fipPromisesSponsor",
  },
  kfcpadel: {
    leftLogo: "kfcPadelLeft",
    cupLogo: "kfcPadelCup",
    rightLogo: "playpronewlogo",
    bg: "kfcPadelBg",
    sponsor1: null,
    sponsor2: null,
  },
  appchallenger: {
    leftLogo: "padelverselogo",
    cupLogo: "appchallengerCup",
    rightLogo: "playpronewlogo",
    bg: "appchallengerBg",
    sponsor1: "appchallengerSponsor3",
    sponsor2: "appchallengerSponsor4",
  },
  80: {
    leftLogo: "padelverselogo",
    cupLogo: "appchallengerCup",
    rightLogo: "playpronewlogo",
    bg: "appchallengerBg",
    sponsor1: "appchallengerSponsor3",
    sponsor2: "appchallengerSponsor4",
  },
  89: {
    leftLogo: "fipPromisesLeft",
    cupLogo: "fipPromisesCup",
    rightLogo: "fipPromisesRight",
    bg: "fipPromisesBg",
    sponsor1: "fipPromisesSponsor",
    sponsor2: "fipPromisesSponsor",
  },
  "premier-padel-league": {
    leftLogo: "ppllogo",
    cupLogo: null,
    rightLogo: "playpro-ww",
    playproWhite: "playpro-ww",
    bg: "pplBg",
    sponsor1: null,
    sponsor2: null,
  },
  87: {
    leftLogo: "ppllogo",
    cupLogo: "ppllogo",
    rightLogo: "playpro-ww",
    playproWhite: "playpro-ww",
    bg: "alNadiAlBurhaniBg",
    sponsor1: null,
    sponsor2: null,
  },
};

/**
 * Get resolved image modules for a tournament ID.
 * @param {string|null|undefined} tournamentId - Tournament ID from URL
 * @param {Object} allImages - ALL_IMAGES from ImageConstants
 * @returns {Object} Images object with same keys as ImageConstants
 */
export function getImagesForTournament(tournamentId, allImages) {
  const config =
    TOURNAMENT_IMAGES[tournamentId] ||
    TOURNAMENT_IMAGES[String(tournamentId)] ||
    DEFAULT_IMAGES;
  const merged = { ...DEFAULT_IMAGES, ...config };

  const defaultImg = (key) => {
    if (config[key] === null) return null;
    return allImages[merged[key]] || allImages[DEFAULT_IMAGES[key]];
  };

  return {
    leftLogo: defaultImg("leftLogo"),
    rightLogo: defaultImg("rightLogo"),
    cupLogo: defaultImg("cupLogo"),
    bg: defaultImg("bg"),
    sponsor1: defaultImg("sponsor1"),
    sponsor2: defaultImg("sponsor2"),
    sponsor3: defaultImg("sponsor3"),
    sponsor4: defaultImg("sponsor4"),
    sponsor: defaultImg("sponsor1"),
    playproWhite: defaultImg("playproWhite"),
    playpro: defaultImg("playpro"),
    padelVerse: defaultImg("padelVerse"),
    premierCup: defaultImg("premierCup"),
    appStore: allImages["apple"],
    googlePlay: allImages["google"],
    playproColorVertical: allImages["playpro_logo_vertical"],
    logo1: allImages["logo1"],
    logo2: allImages["logo2"],
    logo3: allImages["logo3"],
    logo4: allImages["logo4"],
    logo5: allImages["logo5"],
    logo6: allImages["logo6"],
    logo7: allImages["logo7"],
    logo8: allImages["logo8"],
    logo9: allImages["logo9"],
  };
}
