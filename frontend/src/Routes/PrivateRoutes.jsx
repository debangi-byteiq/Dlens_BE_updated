import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import CryptoJS from "crypto-js";

const key = "AccessTheToken";
const PrivateRoute = () => {
  const encryptedToken = localStorage.getItem("access_token");
  const decryptToken = (encryptedToken) => {
    if (!encryptedToken) return null;
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedToken, key);
      const decryptedToken = bytes.toString(CryptoJS.enc.Utf8);
      return decryptedToken || null;
    } catch (error) {
      console.error("Error decrypting token:", error);
      return null;
    }
  };

  const token = decryptToken(encryptedToken);
  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const decoded = jwtDecode(token);
      return decoded.exp < Date.now() / 1000;
    } catch (error) {
      return true;
    }
  };

  if (!token || isTokenExpired(token)) {
    localStorage.removeItem("access_token");
    alert("You must be logged in");
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
