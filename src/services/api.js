import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  headers: { "Content-Type": "application/json" },
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auto-order-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auto-order-token");
      localStorage.removeItem("auto-order-user");
      window.dispatchEvent(new Event("auth-expired"));
    }
    return Promise.reject(error);
  },
);
export const getApiError = (error, fallback = "요청을 처리하지 못했습니다.") =>
  error.response?.data?.message || error.response?.data?.error || fallback;
export default api;
