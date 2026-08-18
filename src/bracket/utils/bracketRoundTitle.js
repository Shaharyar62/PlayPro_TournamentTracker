import { hasContent } from "./bracketHelpers";

export const BracketRoundTitle = {
  resolve(round) {
    for (const match of round.matches) {
      const name = match.stageTypeName;
      if (hasContent(name)) return String(name).trim();
    }
    return round.name;
  },
};
