import setupAxiosInterceptors from "./setupAxiosInterceptors";
import { toApiPath } from "./apiConfig";

// Setup Axios Interceptors
const axiosInstance = setupAxiosInterceptors(() => {});

const GET = async (apiEndPoint, params, config = {}) => {
  return await axiosInstance.get(toApiPath(apiEndPoint), { ...config, params });
};

const POST = async (apiEndPoint, payload, config = {}) => {
  return await axiosInstance.post(toApiPath(apiEndPoint), payload, config);
};

const PUT = async (apiEndPoint, payload, config = {}) => {
  return await axiosInstance.put(toApiPath(apiEndPoint), payload, config);
};

export const Services = {
  GET,
  POST,
  PUT,
};
