import Cookies from "js-cookie";
import AppConstant from "../const/appConstant";

export function getTokenFromUrl() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("token");
}

export function resolveAuthToken() {
  return (
    Cookies.get("token") ||
    getTokenFromUrl() ||
    AppConstant.serviceAuthToken ||
    null
  );
}
