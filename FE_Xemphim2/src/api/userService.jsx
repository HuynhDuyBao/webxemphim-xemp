// src/api/userService.jsx
import api from './api'; 

export const userService = {
    // 1. GET /api/favorites/{userId}
    getFavorites: (userId) => api.get(`/favorites/${userId}`), 

    // 2. POST /api/favorites (Thêm yêu thích)
    addFavorite: (userId, movieId) => api.post(`/favorites`, { id: userId, MaPhim: movieId }),

    // 3. DELETE /api/favorites/{userId}/{maPhim} (Xóa yêu thích)
    removeFavorite: (userId, movieId) => api.delete(`/favorites/${userId}/${movieId}`),

    // 4. GET /api/history (Yêu cầu Token - Xem LichSuController)
    saveProgressToHistory: (payload) => api.post(`/history`, payload),
deleteHistoryItem: (maPhim) => api.delete(`/history/${maPhim}`),
deleteAllHistory: () => api.delete(`/history`),
    getHistory: () => api.get(`/history`), 
};