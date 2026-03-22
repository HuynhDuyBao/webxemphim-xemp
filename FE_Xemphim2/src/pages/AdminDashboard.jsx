// src/pages/AdminDashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import './admin/AdminCommon.css';

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <div className="admin-layout">
      <main className="admin-content">
        <h1 className="admin-title">🎬 Bảng Điều Khiển Quản Trị</h1>
        
        <div className="admin-menu-grid">
          <button className="admin-menu-btn" onClick={() => navigate("/admin/add-movie")}>
            ➕ Thêm Phim Mới
          </button>
          <button className="admin-menu-btn" onClick={() => navigate("/admin/movies")}>
            📋 Danh Sách Phim
          </button>
          <button className="admin-menu-btn" onClick={() => navigate("/admin/the-loai")}>
            🎭 Quản Lý Thể Loại
          </button>
          <button className="admin-menu-btn" onClick={() => navigate("/admin/quoc-gia")}>
            🌍 Quản Lý Quốc Gia
          </button>
          <button className="admin-menu-btn" onClick={() => navigate("/admin/users")}>
            👥 Quản Lý Tài Khoản
          </button>
           <button className="admin-menu-btn" onClick={() => navigate("/admin/movies")}>
            🎞️ Quản Lý Trailer
          </button>
          <button className="admin-menu-btn" onClick={() => navigate("/admin/statistics")}>
            📊 Xem Thống Kê
          </button>
        </div>
      </main>
    </div>
    </>
  );
};

export default AdminDashboard;