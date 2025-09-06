import Cookies from "js-cookie";
import CryptoJS from "crypto-js";

const SECRET_KEY = "*#PlayPro*_95#*";

const setUser = async (user) => {
  const encryptedUser = CryptoJS.AES.encrypt(
    JSON.stringify(user),
    SECRET_KEY
  ).toString();
  clearUser();
  Cookies.set("playprologin", encryptedUser, { expires: 30 });
};

const getUser = () => {
  const encryptedUser = Cookies.get("playprologin");
  if (!encryptedUser) return null;

  try {
    const bytes = CryptoJS.AES.decrypt(encryptedUser, SECRET_KEY);
    const decryptedUser = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    return decryptedUser;
  } catch (error) {
    console.error("Error decrypting user data", error);
    return null;
  }
};

const clearUser = async () => {
  Cookies.remove("playprologin");
};

const setCachedQueryParams = async (params) => {
  const encryptedUser = CryptoJS.AES.encrypt(
    JSON.stringify(params),
    SECRET_KEY
  ).toString();
  Cookies.set("queryParams", encryptedUser, { expires: 30 });
};

const getCachedQueryParams = () => {
  const cachedParams = Cookies.get("queryParams");
  if (!cachedParams) return null;

  try {
    const bytes = CryptoJS.AES.decrypt(cachedParams, SECRET_KEY);
    const decryptedParams = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    return decryptedParams;
  } catch (error) {
    console.error("Error decrypting user data", error);
    return null;
  }
};

const clearCachedQueryParams = async () => {
  Cookies.remove("queryParams");
};

const setToken = async (token) => {
  Cookies.set("token", token, { expires: 30 });
};

const getToken = async () => {
  return Cookies.get("token");
};

const clearToken = async () => {
  Cookies.remove("token");
};

export {
  setUser,
  getUser,
  clearUser,
  setToken,
  getToken,
  clearToken,
  setCachedQueryParams,
  getCachedQueryParams,
  clearCachedQueryParams,
};
