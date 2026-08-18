import { getMatchStageLabel } from "./bracketHelpers";

const PROGRESSION = [1, 5, 7, 2, 3, 6, 4, 8];

export const BracketStageOrder = {
  roundKey(stageType) {
    return `stage_${stageType ?? "unknown"}`;
  },

  progressionIndex(stageType) {
    if (stageType == null) return PROGRESSION.length + 1;
    const idx = PROGRESSION.indexOf(stageType);
    return idx >= 0 ? idx : PROGRESSION.length;
  },

  displayName(stageType) {
    if (stageType === 1) return "Group Matches";
    return getMatchStageLabel(stageType);
  },

  compareGroups(a, b) {
    const strA = a?.toString() ?? "";
    const strB = b?.toString() ?? "";
    const intA = parseInt(strA, 10);
    const intB = parseInt(strB, 10);
    if (!Number.isNaN(intA) && !Number.isNaN(intB)) return intA - intB;
    return strA.localeCompare(strB);
  },

  isGroupStage(stageType) {
    return stageType === 1;
  },
};
