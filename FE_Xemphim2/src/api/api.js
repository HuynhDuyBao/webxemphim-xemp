// src/api/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  timeout: 60000,          // tăng timeout vì upload lớn
  withCredentials: true,   // Gửi credentials (cookies) trong request
});

// Get CSRF token từ cookie
const getCsrfToken = () => {
  const name = 'XSRF-TOKEN';
  let csrfToken = '';
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        csrfToken = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return csrfToken;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Thêm CSRF token nếu có
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    config.headers['X-CSRF-TOKEN'] = csrfToken;
  }
  
  return config;
});

// FIX CHO UPLOAD CLOUDFLARE (nếu dùng XMLHttpRequest thì không cần)
// Nhưng để chắc ăn thì thêm cái này
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"]; // để browser tự set boundary
  }
  return config;
});

export default api;