import AppConstant from "../../const/appConstant";

export function hasContent(value) {
  if (value == null) return false;
  const str = String(value).trim();
  return str.length > 0 && str !== "null";
}

export function getImageUrl(path) {
  if (!hasContent(path)) return null;
  const str = String(path).trim();
  if (str.startsWith("http://") || str.startsWith("https://")) return str;
  return `${AppConstant.imgBaseurl}${str}`;
}

export function getMatchStageLabel(stageType) {
  const labels = {
    1: "Group Matches",
    2: "Quarter Final",
    3: "Semi Final",
    4: "Final",
    5: "Knockout",
    6: "3rd Place",
    7: "Round of 16",
    8: "Exhibition",
  };
  return labels[stageType] ?? "Match";
}
