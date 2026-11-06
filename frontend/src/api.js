import axios from "axios";
const env = import.meta.env;
export const paths = {
  login: env.VITE_AUTH_LOGIN_PATH || "/api/auth/login",
  register: env.VITE_AUTH_REGISTER_PATH || "/api/auth/register",
  interviews: env.VITE_INTERVIEWS_PATH || "/api/interviews",
  questions: env.VITE_QUESTIONS_PATH || "/api/questions",
  answers: env.VITE_ANSWERS_PATH || "/api/answers",
};
export const api = axios.create({
  baseURL: env.VITE_API_BASE_URL || "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("aic_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}
export function extractList(data) {
  if (Array.isArray(data)) return data;
  for (const key of ["interviews", "questions", "results", "data"])
    if (Array.isArray(data?.[key])) return data[key];
  return [];
}
export function extractToken(data) {
  return (
    data?.token ||
    data?.accessToken ||
    data?.data?.token ||
    data?.user?.token ||
    ""
  );
}
