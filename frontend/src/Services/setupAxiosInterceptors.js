import axios from "axios";
import { message } from "antd";
import CryptoJS from "crypto-js";
import { API_BASE_URL } from "./apiConfig";

const key = "AccessTheToken";

const setupAxiosInterceptors = (logout) => {
  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
  });

  // Function to decrypt the token
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

  // Function to encrypt the token
  const encryptToken = (token) => {
    if (!token) return null;
    try {
      const encryptedToken = CryptoJS.AES.encrypt(token, key).toString();
      return encryptedToken;
    } catch (error) {
      console.error("Error encrypting token:", error);
      return null;
    }
  };

  // Request Interceptor to add Authorization header
  axiosInstance.interceptors.request.use(
    (config) => {
      const encryptedAccessToken = localStorage.getItem("access_token");
      const accessToken = decryptToken(encryptedAccessToken);
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response Interceptor for handling token expiration and refresh
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      console.log("Response Interceptor Error:", error);
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const encryptedRefreshToken = localStorage.getItem("refresh_token");
          const refreshToken = decryptToken(encryptedRefreshToken);
          if (!refreshToken) {
            console.error("No refresh token found. Please log in again.");
            logout();
            return;
          }

          const resp = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            {},
            {
              headers: {
                "refresh-token": refreshToken,
              },
            }
          );
          if (resp?.data) {
            const newAccessToken =
              resp?.data?.data?.access_token || resp?.data?.access_token;

            // Encrypt and store the new access token
            const encryptedNewAccessToken = encryptToken(newAccessToken);
            localStorage.setItem("access_token", encryptedNewAccessToken);

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          console.error("Error during refresh token:", refreshError);
          if (refreshError.response?.status === 401) {
            message.error("Session Expired. Please Log In Again.");
            console.log("Refresh token expired. Logging out.");
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            logout();
            window.location.href = "/";
          } else {
            console.error("Unexpected refresh error", refreshError);
          }
        }
      }

      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

export default setupAxiosInterceptors;
