import api from './api';

export const videoService = {
  // Lấy danh sách trailer của phim
  getVideosByMovie: (maPhim) => api.get(`/videos/phim/${maPhim}`),

  // Thêm trailer mới
  // payload: { MaPhim, TenVideo, Link, ... }
  addVideo: (payload) => api.post('/videos', payload),

  // Xóa trailer
  deleteVideo: (videoId) => api.delete(`/videos/${videoId}`),
};