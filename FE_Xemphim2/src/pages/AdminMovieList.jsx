import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import api from "../api/api";
import publicApi from "../api/publicApi";
import { getImageUrl } from "../utils/imageUrl";
import './admin/AdminCommon.css';

const AdminMovieList = () => {
  const [movies, setMovies] = useState([]);
  const navigate = useNavigate();

  const loadMovies = async () => {
    try {
      const res = await publicApi.get("/phim");
      setMovies(res.data || []);
    } catch (err) {
      console.error("Lỗi load phim admin:", err);
      setMovies([]);
    }
  };

  useEffect(() => {
    loadMovies();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa phim này không?")) return;
    try {
      await api.delete(`/phim/${id}`);
      alert("Xóa thành công!");
      loadMovies();
    } catch (err) {
      alert("Lỗi khi xóa phim: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <>
      <Header />
      <div className="admin-page">
      <button className="btn-back" onClick={() => navigate("/admin")}>← Quay lại bảng điều khiển</button>
      
      <div className="admin-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h1 className="admin-title">🎬 Danh Sách Phim</h1>
            <button className="admin-btn" onClick={() => navigate("/admin/add-movie")}>
            ➕ Thêm Phim Mới
            </button>
        </div>

      {movies.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px", color: "#999" }}>
          Chưa có phim nào hoặc đang tải...
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên Phim</th>
              <th>Ảnh</th>
              <th>Năm</th>
              <th>Quốc gia</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie) => (
              <tr key={movie.MaPhim}>
                <td style={{ textAlign: "center" }}>{movie.MaPhim}</td>
                
                <td>
                    <div style={{ fontWeight: "bold", fontSize: "1.1em" }}>{movie.TenPhim}</div>
                    <div style={{ fontSize: "0.9em", color: "#888" }}>{movie.TieuDe}</div>
                    <div style={{ fontSize: "0.8em", color: "#e50914" }}>
                        {movie.PhanLoai} {/* Hiển thị để biết Lẻ hay Bộ */}
                    </div>
                </td>

                <td style={{ padding: "12px", textAlign: "center" }}>
                  <img 
                    src={getImageUrl(movie.HinhAnh)} 
                    width="60" 
                    alt={movie.TenPhim} 
                    style={{ borderRadius: 4, objectFit: "cover" }} 
                  />
                </td>

                <td style={{ padding: "12px", textAlign: "center" }}>{movie.NamPhatHanh || "-"}</td>
                <td style={{ padding: "12px", textAlign: "center" }}>{movie.quocgia?.TenQuocGia || "-"}</td>
                
                <td style={{ padding: "12px" }}>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                    <button
                        onClick={() => navigate(`/admin/movies/edit/${movie.MaPhim}`)}
                        style={{
                            background: "#3b82f6",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: 4,
                            color: "#fff",
                            cursor: "pointer",
                            fontWeight: "bold"
                        }}
                    >
                        ✏️ Sửa
                    </button>
                        <button
                        onClick={() => navigate(`/admin/movies/${movie.MaPhim}/trailer`)}
                        style={{
                            background: "#8b5cf6",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: 4,
                            color: "#fff",
                            cursor: "pointer",
                            fontWeight: "bold"
                        }}
                    >
                        🎞 Trailer
                    </button>
                    {/* ĐÃ SỬA: Luôn hiển thị nút Tập phim bất kể Bộ hay Lẻ */}
                    <button
                        onClick={() => navigate(`/admin/movies/${movie.MaPhim}/episodes`)}
                        style={{
                            background: "#10b981",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: 4,
                            color: "#fff",
                            cursor: "pointer",
                            fontWeight: "bold"
                        }}
                    >
                        📺 Tập
                    </button>

                    <button
                      onClick={() => handleDelete(movie.MaPhim)}
                      style={{
                        background: "#ef4444",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: 4,
                        color: "#fff",
                        cursor: "pointer",
                        fontWeight: "bold"
                      }}
                    >
                      🗑 Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </div>
      </div>
    </>
  );
};export default AdminMovieList;