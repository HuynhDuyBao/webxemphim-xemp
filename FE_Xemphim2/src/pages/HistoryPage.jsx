import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MovieCard from "../components/MovieCard";
import { userService } from "../api/userService";
import { getAuth } from "../store/auth";
import '../components/css/MovieCard.css';
import './list-pages.css'; 

const HistoryPage = () => {
    const [history, setHistory] = useState([]);
    const { user } = getAuth();
    const navigate = useNavigate();

    const loadHistory = () => {
        if (user) {
            userService.getHistory()
                .then(res => {
                    const historyObjects = res.data.data || []; 
                    const uniqueMovieIds = new Set();
                    const historyMovies = historyObjects
                        .map(item => item.phim)
                        .filter(p => p && !uniqueMovieIds.has(p.MaPhim) && uniqueMovieIds.add(p.MaPhim));
                    setHistory(historyMovies);
                })
                .catch(err => console.error("Lỗi tải lịch sử xem:", err));
        }
    };

    useEffect(() => {
        loadHistory();
    }, [user]);

    const handleDeleteItem = async (e, maPhim) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm("Bạn muốn xóa phim này khỏi lịch sử?")) return;

        try {
            await userService.deleteHistoryItem(maPhim);
            setHistory(prev => prev.filter(movie => movie.MaPhim !== maPhim));
        } catch (error) {
            alert("Lỗi khi xóa: " + (error.response?.data?.message || error.message));
        }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm("Bạn có chắc muốn xóa TOÀN BỘ lịch sử xem không?")) return;

        try {
            await userService.deleteAllHistory();
            setHistory([]);
        } catch (error) {
            alert("Lỗi khi xóa tất cả: " + (error.response?.data?.message || error.message));
        }
    };

    if (!user) return (
        <div className="page-container">
            <div className="empty-state">
                <div className="empty-state-icon">🔒</div>
                <div className="empty-state-text">Vui lòng đăng nhập</div>
                <div className="empty-state-subtext">Đăng nhập để xem lịch sử xem phim</div>
            </div>
        </div>
    );

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">⌚ Lịch Sử Xem</h1>
                <div className="page-actions">
                    <button onClick={() => navigate(-1)} className="btn-back">
                        ← Quay lại
                    </button>
                    {history.length > 0 && (
                        <button onClick={handleDeleteAll} className="btn-delete-all">
                            🗑️ Xóa tất cả
                        </button>
                    )}
                </div>
            </div>

            {history.length > 0 ? (
                <div className="movie-grid">
                    {history.map(movie => (
                        <div key={movie.MaPhim} className="movie-item-wrapper">
                            <MovieCard movie={movie} />
                            <button
                                onClick={(e) => handleDeleteItem(e, movie.MaPhim)}
                                className="btn-delete-item"
                                title="Xóa khỏi lịch sử"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">📺</div>
                    <div className="empty-state-text">Chưa có lịch sử xem</div>
                    <div className="empty-state-subtext">Các phim bạn xem sẽ hiển thị ở đây</div>
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
