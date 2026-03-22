// src/api/ratingService.js
import publicApi from './publicApi';  // ← Nếu có hiển thị ratings công khai
import api from './api';

export const ratingService = {
  // Nếu bạn có API public để xem ratings của phim (không cần login)
  getRatings: (maPhim) => publicApi.get(`/ratings/${maPhim}`),
  
  submitRating: (data) => {
    const { MaPhim } = data;
    return api.post('/ratings', data).catch(() => {
      return api.put(`/ratings/${MaPhim}`, data);
    });
  }
};