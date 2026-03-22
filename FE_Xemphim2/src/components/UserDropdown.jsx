// src/components/UserDropdown.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, logout, isAdmin } from "../store/auth";
import { userService } from "../api/userService";
import { useFavorites } from "../contexts/FavoritesContext";
import "./UserDropdown.css";

const UserDropdown = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const [user, setUser] = useState(getAuth().user);
  const [histCount, setHistCount] = useState(0);
  const { favorites } = useFavorites();

  // Load history count
  const loadHistoryCount = useCallback(async (currentUser) => {
    if (!currentUser || !currentUser.id) {
        setHistCount(0);
        return;
    }
    try {
        const histRes = await userService.getHistory();
        const safeHist = Array.isArray(histRes.data.data) ? histRes.data.data : histRes.data.data || [];
        setHistCount(safeHist.length);
    } catch (e) {
        console.error("Failed to load history", e);
    }
  }, []);

  // Load history khi user thay đổi
  useEffect(() => {
    if (user) {
        loadHistoryCount(user);
    }
  }, [user, loadHistoryCount]);

  // Cập nhật realtime khi user thay đổi trong localStorage
  useEffect(() => {
    const onStorageChange = () => setUser(getAuth().user);
    window.addEventListener("storage", onStorageChange);
    return () => window.removeEventListener("storage", onStorageChange);
  }, []);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (!user) {
    return (
      <button onClick={() => navigate("/login")} className="btn-login">
        Đăng nhập
      </button>
    );
  }

  const avatarSrc = user.hinh_dai_dien_url
    ? `${user.hinh_dai_dien_url}?t=${Date.now()}`
    : "/placeholder.svg";

  return (
    <div className="user-dropdown" ref={ref}>
      <div className="user-avatar" onClick={() => setOpen(!open)}>
        <img
          src={avatarSrc}
          alt={ user.ten_dang_nhap}
          onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
        />
      </div>
      <div className="user-display" onClick={() => setOpen(!open)}>
        {user.ten_dang_nhap}
      </div>

      {open && (
        <div className="dropdown-menu">
          <div className="dropdown-item user-name">
            {user.ten_dang_nhap}
          </div>
          <button
            className="dropdown-item"
            onClick={() => {
              navigate("/profile");
              setOpen(false);
            }}
          >
            Hồ sơ
          </button>

           {isAdmin() && (
            <button
              className="dropdown-item"
              onClick={() => {
                navigate("/admin");
                setOpen(false);
              }}
            >
              Quản lý
            </button>
          )}
          
          <button
            className="dropdown-item link-with-count"
            onClick={() => {
              navigate("/favorites");
              setOpen(false);
            }}
          >
          Yêu thích 
            <span className="item-count">{favorites.length}</span>
          </button>

          <button
            className="dropdown-item link-with-count"
            onClick={() => {
              navigate("/history");
              setOpen(false);
            }}
          >
            Lịch sử xem
            <span className="item-count">{histCount}</span>
          </button>

         
          <button
            className="dropdown-item"
            onClick={() => {
              logout();
              window.location.reload();
            }}
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;