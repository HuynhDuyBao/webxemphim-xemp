import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import axios from "../api/api";
import "./admin/AdminCommon.css";

const initialForm = {
    ten_dang_nhap: "",
    email: "",
    ho_ten: "",
    hinh_dai_dien: "",
    trang_thai: "active",
    role: "user",
    mat_khau: "",
};

const AdminUser = () => {
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get("/auth/users");
            setUsers(res.data);
        } catch (err) {
            console.error("Error fetching users:", err);
            setError("Không lấy được danh sách tài khoản");
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleAdd = () => {
        setForm(initialForm);
        setEditingId(null);
        setShowForm(true);
        setError("");
    };

    const handleEdit = (user) => {
        setForm({ ...user, mat_khau: "" });
        setEditingId(user.id);
        setShowForm(true);
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                const payload = { ...form };
                if (!payload.mat_khau) delete payload.mat_khau;
                await axios.put(`/auth/update/${editingId}`, payload);
                fetchUsers();
            } else {
                // Creating new user: require provided password
                const payload = { ...form };
                await axios.post("/auth/register", payload);
                fetchUsers();
            }
            setShowForm(false);
        } catch (err) {
            console.error("Error saving user:", err);
            setError("Có lỗi khi lưu tài khoản");
        }
    };

    // Xoá tài khoản
    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc muốn xoá tài khoản này?")) return;
        try {
            await axios.delete(`/auth/delete/${id}`);
            setUsers(users.filter((u) => u.id !== id));
        } catch (err) {
            console.error("Error deleting user:", err);
            alert("Không thể xoá tài khoản");
        }
    };

    return (
        <>
            <Header />
            <div className="admin-page">
            <button className="btn-back" onClick={() => window.history.back()}>← Quay lại</button>
            
            <div className="admin-content">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h1 className="admin-title">👥 Quản Lý Tài Khoản</h1>
                    <button className="admin-btn" onClick={handleAdd}>
                        ➕ Thêm Tài Khoản Mới
                    </button>
                </div>

            {error && <div style={{ color: "var(--primary-color)", marginTop: "1rem" }}>{error}</div>}

            <table className="admin-table" style={{ marginTop: 16, width: "100%" }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tên đăng nhập</th>
                        <th>Email</th>
                        <th>Họ tên</th>
                        <th>Vai trò</th>
                        <th>Hình đại diện</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {users.length > 0 ? (
                        users.map((user) => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>{user.ten_dang_nhap}</td>
                                <td>{user.email}</td>
                                <td>{user.ho_ten}</td>
                                <td>{user.vai_tro}</td>
                                <td>{user.hinh_dai_dien}</td>
                                <td>{user.trang_thai}</td>
                                <td>
                                    <button onClick={() => handleEdit(user)}>Sửa</button>
                                    <button
                                        style={{ marginLeft: 6, color: "red" }}
                                        onClick={() => handleDelete(user.id)}
                                    >
                                        Xoá
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={8} style={{ textAlign: "center" }}>
                                Không có dữ liệu
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="admin-form"
                    style={{ display: "block", marginTop: 24 }}
                >
                    <h3>{editingId ? "Sửa tài khoản" : "Thêm tài khoản mới"}</h3>

                    <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", color: "#ccc" }}>Tên đăng nhập:</label>
                        <input
                            className="admin-input"
                            name="ten_dang_nhap"
                            value={form.ten_dang_nhap}
                            onChange={handleChange}
                            required
                            maxLength={50}
                            disabled={!!editingId}
                            style={{ width: "100%" }}
                        />
                    </div>

                 

                    <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", color: "#ccc" }}>Email:</label>
                        <input className="admin-input" name="email" value={form.email} onChange={handleChange} required style={{ width: "100%" }} />
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", color: "#ccc" }}>Họ tên:</label>
                        <input className="admin-input" name="ho_ten" value={form.ho_ten} onChange={handleChange} style={{ width: "100%" }} />
                    </div>

                    

                    <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", color: "#ccc" }}>Vai trò:</label>
                        <select className="admin-input" name="role" value={form.role} onChange={handleChange} style={{ width: "100%" }}>
                            <option value="user">Người dùng</option>
                            <option value="admin">Quản trị</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", color: "#ccc" }}>Trạng thái:</label>
                        <select className="admin-input" name="trang_thai" value={form.trang_thai} onChange={handleChange} style={{ width: "100%" }}>
                            <option value="active">Hoạt động</option>
                            <option value="inactive">Không hoạt động</option>
                            <option value="banned">Bị khoá</option>
                        </select>
                    </div>

                    <div style={{ marginTop: 16, display: "flex", gap: "1rem" }}>
                        <button type="submit" className="admin-btn">💾 Lưu</button>
                        <button type="button" className="admin-btn cancel" onClick={() => setShowForm(false)}>
                            ✕ Huỷ
                        </button>
                    </div>
                </form>
            )}
        </div>
        </div>
        </>
    );
};

export default AdminUser;
