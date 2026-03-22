// src/api/commentService.jsx
import publicApi from './publicApi';  // Dùng để GET bình luận (public)
import api from './api';              // ← THÊM DÒNG NÀY (dùng để POST bình luận khi đã login)

export const commentService = {
  getComments: (maPhim) => publicApi.get(`/binhluan/${maPhim}`),
  postComment: (data) => api.post('/binhluan', data),  // ← cần đăng nhập → dùng api
  deleteComment: (id) => api.delete(`/binhluan/${id}`),  // ← xóa bình luận
};