// src/pages/AdminQuocGia.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
// BƯỚC 1: Sửa lại import - Dùng axios đã cấu hình
import axios from "../api/api"; 
import './admin/AdminCommon.css';

// BƯỚC 2: Xóa dòng API_BASE
// const API_BASE = "http://localhost:8000/api";

const AdminQuocGia = () => {
  const navigate = useNavigate();
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [tenQuocGia, setTenQuocGia] = useState("");

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    setLoading(true);
    try {
      // BƯỚC 3: Xóa API_BASE, axios sẽ tự động dùng "baseURL"
      const res = await axios.get("/countries"); 
      setCountries(res.data.data);
    } catch (err) {
      alert("Lỗi tải dữ liệu");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!tenQuocGia.trim()) return alert("Tên quốc gia không được để trống");

    try {
      if (isEditing) {
        // BƯỚC 3 (Tương tự): Xóa API_BASE
        await axios.put(`/countries/${editId}`, { name: tenQuocGia });
      } else {
        await axios.post("/countries", { name: tenQuocGia });
      }
      setTenQuocGia("");
      setIsEditing(false);
      setEditId(null);
      loadCountries();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi lưu");
    }
  };

  const handleEdit = (item) => {
    setIsEditing(true);
    setEditId(item.MaQuocGia);
    setTenQuocGia(item.TenQuocGia);
  };

  const handleDelete = async (id) => {
    // Giữ lại dòng này để tắt cảnh báo "confirm"
    // eslint-disable-next-line no-restricted-globals 
    if (!confirm("Xóa quốc gia này?")) return;
    try {
      // BƯỚC 3 (Tương tự): Xóa API_BASE
      await axios.delete(`/countries/${id}`);
      loadCountries();
    } catch (err) {
      alert(err.response?.data?.message || "Không thể xóa");
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setTenQuocGia("");
  };

  return (
    <>
      <Header />
      <div className="admin-layout">
        <button className="btn-back" onClick={() => navigate("/admin")}>← Quay lại</button>
        <main className="admin-content">
        <h1 className="admin-title">🌍 Quản Lý Quốc Gia</h1>

          <div className="admin-form">
            <input
              type="text"
              placeholder="Tên quốc gia..."
              value={tenQuocGia}
              onChange={(e) => setTenQuocGia(e.target.value)}
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
              {countries.map((c) => (
                <div key={c.MaQuocGia} className="admin-list-item">
                  <span>{c.TenQuocGia}</span>
                  <div>
                    <button className="admin-btn small" onClick={() => handleEdit(c)}>Sửa</button>
                    <button className="admin-btn small delete" onClick={() => handleDelete(c.MaQuocGia)}>Xóa</button>
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

export default AdminQuocGia;