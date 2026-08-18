import { BracketLayoutEngine } from "./bracketLayoutEngine";
import { hasContent } from "./bracketHelpers";

export const BracketCardMetrics = {
  cardWidthPhone: 280,
  cardWidthTablet: 340,
  cardHeightBase: 96,
  cardHeightCourtExtra: 14,
  cardHeightSingleSideReduction: 12,
  cardBorderRadius: 14,
  cardBorderWidth: 1,
  winnerAccentWidth: 5,
  liveAccentWidth: 3,
  progressionCapWidth: 4,
  metaRowHeight: 28,
  participantRowHeight: 32,
  verticalGap: 20,
  columnGap: 56,
  connectorGutter: 28,
  headerHeight: 40,
  horizontalPadding: 20,
  componentGap: 32,
  metaPaddingH: 10,
  metaPaddingTop: 6,
  metaPaddingBottom: 4,
  rowPaddingV: 4,
  scoreColumnWidth: 28,
  nameScoreGap: 12,
  connectorStrokeWidth: 2.5,
  connectorWinnerStrokeWidth: 3,
  connectorBaseColor: "#D0D5DD",
  trophyColorLight: "#C8922A",
  trophyColorDark: "#E6B84D",
  championCardWidth: 200,
  championCardHeight: 108,
  scrollHorizontalPadding: 16,
  autoScrollOffset: 24,
  cardShadowBlur: 6,
  cardShadowAlpha: 0.05,
  metaFontSize: 13,
  winnerNameFontSize: 13,
  loserNameFontSize: 12,
  scoreFontSize: 14,

  resolveCardWidth(override) {
    if (override != null) return override;
    if (typeof window !== "undefined" && window.innerWidth >= 600) {
      return BracketCardMetrics.cardWidthTablet;
    }
    return BracketCardMetrics.cardWidthPhone;
  },

  columnWidth(cardWidth) {
    return (
      cardWidth +
      BracketCardMetrics.columnGap +
      BracketCardMetrics.connectorGutter
    );
  },

  createLayoutEngine({ cardWidth } = {}) {
    const width = BracketCardMetrics.resolveCardWidth(cardWidth);
    return new BracketLayoutEngine({
      cardWidth: width,
      cardHeight: BracketCardMetrics.cardHeightBase,
      verticalGap: BracketCardMetrics.verticalGap,
      columnGap: BracketCardMetrics.columnGap,
      connectorGutter: BracketCardMetrics.connectorGutter,
      headerHeight: BracketCardMetrics.headerHeight,
      horizontalPadding: BracketCardMetrics.horizontalPadding,
      componentGap: BracketCardMetrics.componentGap,
    });
  },

  estimateCardHeight(match) {
    let height = BracketCardMetrics.cardHeightBase;
    if (hasContent(match.courtName)) {
      height += BracketCardMetrics.cardHeightCourtExtra;
    }
    if (match.participantB == null || match.participantB.isBye) {
      height -= BracketCardMetrics.cardHeightSingleSideReduction;
    }
    return height;
  },

  participantRowTopY(match, side) {
    if (side === "A") return BracketCardMetrics.metaRowHeight;
    return (
      BracketCardMetrics.metaRowHeight + BracketCardMetrics.participantRowHeight
    );
  },
};
