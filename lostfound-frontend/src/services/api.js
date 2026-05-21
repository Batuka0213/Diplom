import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
});

/* Хүсэлт бүрт JWT token автоматаар нэмэх */
API.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* 401 хариу ирвэл session цэвэрлэж login руу шилжүүлэх */
API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // GitHub Pages-д PUBLIC_URL=/Diplom тул зөв замыг бүрдүүлнэ
      const base = process.env.PUBLIC_URL || "";
      window.location.href = base + "/login";
    }
    return Promise.reject(err);
  }
);

export default API;