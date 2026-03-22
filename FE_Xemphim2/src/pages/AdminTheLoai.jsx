// src/pages/AdminTheLoai.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
// BƯỚC 1: Sửa lại import
import axios from "../api/api"; 
import './admin/AdminCommon.css';


const AdminTheLoai = () => {
  const navigate = useNavigate();
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [tenTheLoai, setTenTheLoai] = useState("");

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    setLoading(true);
    try {
      // BƯỚC 3: Xóa API_BASE
      const res = await axios.get("/genres");
      setGenres(res.data.data);
    } catch (err) {
      alert("Lỗi tải dữ liệu");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!tenTheLoai.trim()) return alert("Tên thể loại không được để trống");

    try {
      if (isEditing) {
        // BƯỚC 3 (Tương tự): Xóa API_BASE
        await axios.put(`/genres/${editId}`, { name: tenTheLoai });
      } else {
        await axios.post("/genres", { name: tenTheLoai });
      }
      setTenTheLoai("");
      setIsEditing(false);
      setEditId(null);
      loadGenres();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi lưu");
    }
  };

  const handleEdit = (item) => {
    setIsEditing(true);
    setEditId(item.MaTheLoai);
    setTenTheLoai(item.TenTheLoai);
  };

  const handleDelete = async (id) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm("Xóa thể loại này?")) return;
    try {
      // BƯỚC 3 (Tương tự): Xóa API_BASE
      await axios.delete(`/genres/${id}`);
      loadGenres();
    } catch (err) {
      alert(err.response?.data?.message || "Không thể xóa");
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setTenTheLoai("");
  };

  return (
    <>
      <Header />
      <div className="admin-layout">
        <button className="btn-back" onClick={() => navigate("/admin")}>← Quay lại</button>
        <main className="admin-content">
        <h1 className="admin-title">🎭 Quản Lý Thể Loại</h1>

          <div className="admin-form">
            <input
              type="text"
              placeholder="Tên thể loại..."
              value={tenTheLoai}
              onChange={(e) => setTenTheLoai(e.target.value)}
              className="admin-input"
            />
            <button className="admin-btn" onClick={handleSave}>
              {isEditing ? "Cập nhật" : "Thêm mới"}
            </button>
            {isEditing && (
              <button className="admin-btn cancel" onClick={cancelEdit}>Hủy</button>
            )}
          </div>

          {loading ? (
            <p>Đang tải...</p>
          ) : (
            <div className="admin-list">
              {genres.map((g) => (
                <div key={g.MaTheLoai} className="admin-list-item">
                  <span>{g.TenTheLoai}</span>
                  <div>
                    <button className="admin-btn small" onClick={() => handleEdit(g)}>Sửa</button>
                    <button className="admin-btn small delete" onClick={() => handleDelete(g.MaTheLoai)}>Xóa</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default AdminTheLoai;