import axios from 'axios';
import {store} from "../redux/store";
import {backendApiBaseUrl} from "../config";

export const axiosInstance = axios.create({
  baseURL: `${backendApiBaseUrl}`,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  config.headers['Content-Type'] = 'application/json';
  config.headers['X-CSRFToken'] = store.getState().auth.csrfToken;

  return config;
});
