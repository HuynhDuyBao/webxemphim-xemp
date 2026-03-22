import React, { useEffect, useState } from "react";
import axios from "../api/api";
import { updateUser } from "../store/auth";
import { useTheme } from "../contexts/ThemeContext";
import "./Profile.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { theme, setTheme } = useTheme();

  const [message, setMessage] = useState("");
  const [cursorType, setCursorType] = useState(localStorage.getItem("cursorType") || "default");
  const [cursorColor, setCursorColor] = useState(localStorage.getItem("cursorColor") || "#000000");

  const [editForm, setEditForm] = useState({
    ho_ten: "",
    email: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const token = localStorage.getItem("token");

  // ========================================
  // Lấy thông tin user
  // ========================================
  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userData = res.data?.user || res.data;

      setUser(userData);
      setEditForm({
        ho_ten: userData?.ho_ten || "",
        email: userData?.email || "",
      });

      setAvatarPreview(null);
    } catch (error) {
      setMessage("Không tải được thông tin người dùng!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // ========================================
  // Thay đổi con trỏ chuột
  // ========================================
  const handleCursorChange = (type, color = cursorColor) => {
    setCursorType(type);
    localStorage.setItem("cursorType", type);
    
    // Xóa class cũ
    document.body.classList.remove('cursor-default', 'cursor-plus');
    
    // Tạo SVG với màu tùy chỉnh cho dấu + (có viền đen, dài hơn, không bo tròn)
    const plusSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><line x1='16' y1='4' x2='16' y2='28' stroke='#000' stroke-width='5' stroke-linecap='square'/><line x1='4' y1='16' x2='28' y2='16' stroke='#000' stroke-width='5' stroke-linecap='square'/><line x1='16' y1='4' x2='16' y2='28' stroke='${color}' stroke-width='3' stroke-linecap='square'/><line x1='4' y1='16' x2='28' y2='16' stroke='${color}' stroke-width='3' stroke-linecap='square'/></svg>`;
    const encodedPlusSvg = encodeURIComponent(plusSvg);
    
    // Tạo SVG cho cursor mặc định (mũi tên với màu và viền đen)
    const arrowSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><path d='M 5 3 L 5 23 L 12 16 L 17 28 L 20 27 L 15 15 L 25 15 Z' fill='${color}' stroke='#000' stroke-width='2'/></svg>`;
    const encodedArrowSvg = encodeURIComponent(arrowSvg);
    
    // Áp dụng CSS variable cho cursor
    if (type === "plus") {
      document.body.classList.add('cursor-plus');
      document.documentElement.style.setProperty('--custom-cursor', `url("data:image/svg+xml,${encodedPlusSvg}") 16 16, crosshair`);
    } else {
      document.body.classList.add('cursor-default');
      document.documentElement.style.setProperty('--custom-cursor', `url("data:image/svg+xml,${encodedArrowSvg}") 2 2, default`);
    }
  };

  const handleCursorColorChange = (color) => {
    setCursorColor(color);
    localStorage.setItem("cursorColor", color);
    handleCursorChange(cursorType, color);
  };

  // Áp dụng cursor khi component mount
  useEffect(() => {
    handleCursorChange(cursorType);
  }, []);

  // ========================================
  // Chọn avatar mới
  // ========================================
  const handleSelectAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Kiểm tra kích thước file (2MB = 2 * 1024 * 1024 bytes)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setMessage("Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 2MB.");
      e.target.value = ""; // Reset input
      return;
    }
    
    // Kiểm tra định dạng ảnh
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setMessage("Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)!");
      e.target.value = "";
      return;
    }
    
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setMessage(""); // Xóa thông báo lỗi cũ
  };

  // ========================================
  // Upload avatar
  // ========================================
  const handleUploadAvatar = async (e) => {
    e.preventDefault();
    if (!avatarFile) return setMessage("Bạn chưa chọn ảnh!");

    try {
      const formData = new FormData();
      formData.append("hinh_dai_dien_file", avatarFile);

      const res = await axios.post(
        `/auth/upload-avatar/${user.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage(res.data.message || "Cập nhật ảnh thành công!");
      setAvatarFile(null);
      setAvatarPreview(null);

        // Lấy user mới từ response
      const updatedUser = res.data.user;

      // Cập nhật localStorage
      updateUser(updatedUser);

      // Cập nhật state Profile
      setUser(updatedUser);

      
    } catch (error) {
      console.error(error);
      setMessage("Lỗi cập nhật ảnh!");
    }
  };

  // ========================================
  // Cập nhật thông tin cá nhân
  // ========================================
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `/auth/update/${user.id}`,
        {
          ho_ten: editForm.ho_ten,
          email: editForm.email,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("Cập nhật thông tin thành công!");
      fetchUser();
    } catch (err) {
      console.error(err);
      setMessage("Cập nhật thất bại!");
    }
  };

  // ========================================
  // Đổi mật khẩu
  // ========================================
  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `/auth/change-password/${user.id}`,
        {
          old_password: passwordForm.old_password,
          new_password: passwordForm.new_password,
          new_password_confirmation: passwordForm.confirm_password,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("Đổi mật khẩu thành công!");
      setPasswordForm({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || "Đổi mật khẩu thất bại!");
    }
  };

  // ========================================
  // Loading
  // ========================================
  if (loading || !user) return <p>Đang tải dữ liệu...</p>;

  return (
    <div className="profile-container">

      {/* ======================================
            HIỂN THỊ THÔNG TIN USER
      ====================================== */}
      <div className="card profile-card">
        <h2>Thông Tin Cá Nhân</h2>

        <div className="avatar-wrapper">
          <img
            className="avatar"
            alt="avatar"
            src={
              avatarPreview ||
              (user.hinh_dai_dien_url
                ? `${user.hinh_dai_dien_url}?t=${Date.now()}`
                : "/default-avatar.png")
            }
          />
        </div>

        <div className="info-wrapper">
          <dl>
            <dt>Tên đăng nhập:</dt>
            <dd>{user.ten_dang_nhap}</dd>

            <dt>Họ tên:</dt>
            <dd>{user.ho_ten || "Chưa cập nhật"}</dd>

            <dt>Email:</dt>
            <dd>{user.email}</dd>
          </dl>
        </div>
      </div>

      {/* ======================================
            GIAO DIỆN (THEME)
      ====================================== */}
      <div className="card">
        <h2>Giao Diện</h2>
        <div className="theme-switcher">
          <button 
            className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => setTheme('light')}
          >
            <div className="color-preview light"></div>
            <span>Light Mode</span>
          </button>
          
          <button 
            className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            <div className="color-preview dark"></div>
            <span>Dark Mode</span>
          </button>
        </div>
      </div>

      {/* ======================================
            CON TRỎ CHUỘT
      ====================================== */}
      <div className="card">
        <h2>Con Trỏ Chuột</h2>
        <div className="cursor-switcher">
          <button 
            className={`cursor-btn ${cursorType === 'default' ? 'active' : ''}`}
            onClick={() => handleCursorChange('default')}
          >
            <div className="cursor-preview">
              <span className="cursor-icon">🖱️</span>
            </div>
            
          </button>
          
          <button 
            className={`cursor-btn ${cursorType === 'plus' ? 'active' : ''}`}
            onClick={() => handleCursorChange('plus')}
          >
            <div className="cursor-preview">
              <span className="cursor-icon plus">➕</span>
            </div>
            
          </button>
        </div>
        
        {/* Chọn màu cho cursor */}
        <div className="cursor-color-picker">
          <label>Màu Con Trỏ:</label>
            <div className="color-options">
              <button 
                className={`color-btn ${cursorColor === '#000000' ? 'active' : ''}`}
                style={{ backgroundColor: '#000000' }}
                onClick={() => handleCursorColorChange('#000000')}
                title="Đen"
              />
              <button 
                className={`color-btn ${cursorColor === '#FF0000' ? 'active' : ''}`}
                style={{ backgroundColor: '#FF0000' }}
                onClick={() => handleCursorColorChange('#FF0000')}
                title="Đỏ"
              />
              <button 
                className={`color-btn ${cursorColor === '#FFE500' ? 'active' : ''}`}
                style={{ backgroundColor: '#FFE500' }}
                onClick={() => handleCursorColorChange('#FFE500')}
                title="Vàng"
              />
              <button 
                className={`color-btn ${cursorColor === '#00FF00' ? 'active' : ''}`}
                style={{ backgroundColor: '#00FF00' }}
                onClick={() => handleCursorColorChange('#00FF00')}
                title="Xanh lá"
              />
              <button 
                className={`color-btn ${cursorColor === '#0000FF' ? 'active' : ''}`}
                style={{ backgroundColor: '#0000FF' }}
                onClick={() => handleCursorColorChange('#0000FF')}
                title="Xanh dương"
              />
              <button 
                className={`color-btn ${cursorColor === '#FF00FF' ? 'active' : ''}`}
                style={{ backgroundColor: '#FF00FF' }}
                onClick={() => handleCursorColorChange('#FF00FF')}
                title="Tím"
              />
              <button 
                className={`color-btn ${cursorColor === '#FFFFFF' ? 'active' : ''}`}
                style={{ backgroundColor: '#FFFFFF', border: '3px solid #000' }}
                onClick={() => handleCursorColorChange('#FFFFFF')}
                title="Trắng"
              />
              <input 
                type="color"
                value={cursorColor}
                onChange={(e) => handleCursorColorChange(e.target.value)}
                className="color-picker-input"
                title="Chọn màu tùy chỉnh"
              />
            </div>
          </div>
      </div>

      {/* ======================================
            CẬP NHẬT AVATAR
      ====================================== */}
      <div className="card">
        <h2>Đổi Ảnh Đại Diện</h2>
        <form onSubmit={handleUploadAvatar}>
          <input type="file" accept="image/*" onChange={handleSelectAvatar} />
          <button type="submit" className="btn-primary">Cập nhật</button>
        </form>
      </div>

      {/* ======================================
            CẬP NHẬT THÔNG TIN
      ====================================== */}
      <div className="card">
        <h2>Cập Nhật Thông Tin</h2>
        <form onSubmit={handleUpdateProfile}>
          <label>Họ tên:</label>
          <input
            type="text"
            value={editForm.ho_ten}
            onChange={(e) =>
              setEditForm({ ...editForm, ho_ten: e.target.value })
            }
          />

          <label>Email:</label>
          <input
            type="email"
            value={editForm.email}
            onChange={(e) =>
              setEditForm({ ...editForm, email: e.target.value })
            }
          />

          <button type="submit" className="btn-primary">Lưu</button>
        </form>
      </div>

      {/* ======================================
            ĐỔI MẬT KHẨU
      ====================================== */}
      <div className="card">
        <h2>Đổi Mật Khẩu</h2>
        <form onSubmit={handleChangePassword}>
          <label>Mật khẩu cũ:</label>
          <input
            type="password"
            required
            value={passwordForm.old_password}
            onChange={(e) =>
              setPasswordForm({ ...passwordForm, old_password: e.target.value })
            }
          />

          <label>Mật khẩu mới:</label>
          <input
            type="password"
            required
            value={passwordForm.new_password}
            onChange={(e) =>
              setPasswordForm({ ...passwordForm, new_password: e.target.value })
            }
          />

          <label>Xác nhận mật khẩu:</label>
          <input
            type="password"
            required
            value={passwordForm.confirm_password}
            onChange={(e) =>
              setPasswordForm({
                ...passwordForm,
                confirm_password: e.target.value,
              })
            }
          />

          <button type="submit" className="btn-primary">
            Đổi mật khẩu
          </button>
        </form>
      </div>

      {message && <div className="alert-message">{message}</div>}
    </div>
  );
};

export default Profile;
