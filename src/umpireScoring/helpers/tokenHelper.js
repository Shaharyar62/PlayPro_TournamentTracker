import CryptoJS from "crypto-js";

const SECRET_KEY = "*#PlayPro*_95#*";

/**
 * Encrypt JWT token before storing in localStorage
 * @param {string} token - JWT token to encrypt
 * @returns {string} Encrypted token string
 */
export const encryptToken = (token) => {
  if (!token) return null;
  try {
    const encryptedToken = CryptoJS.AES.encrypt(
      token,
      SECRET_KEY
    ).toString();
    return encryptedToken;
  } catch (error) {
    console.error("Error encrypting token:", error);
    return null;
  }
};

/**
 * Decrypt JWT token from localStorage
 * @param {string} encryptedToken - Encrypted token string
 * @returns {string} Decrypted JWT token
 */
export const decryptToken = (encryptedToken) => {
  if (!encryptedToken) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, SECRET_KEY);
    const decryptedToken = bytes.toString(CryptoJS.enc.Utf8);
    return decryptedToken;
  } catch (error) {
    console.error("Error decrypting token:", error);
    return null;
  }
};

/**
 * Store encrypted token in localStorage
 * @param {string} token - JWT token to store
 */
export const setUmpireToken = (token) => {
  if (!token) {
    localStorage.removeItem("umpireToken");
    return;
  }
  const encryptedToken = encryptToken(token);
  if (encryptedToken) {
    localStorage.setItem("umpireToken", encryptedToken);
  }
};

/**
 * Get and decrypt token from localStorage
 * @returns {string|null} Decrypted JWT token or null
 */
export const getUmpireToken = () => {
  const encryptedToken = localStorage.getItem("umpireToken");
  if (!encryptedToken) return null;
  return decryptToken(encryptedToken);
};

/**
 * Clear token from localStorage
 */
export const clearUmpireToken = () => {
  localStorage.removeItem("umpireToken");
};

