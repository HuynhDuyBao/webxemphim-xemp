import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MovieCard from "../components/MovieCard";
import { getAuth } from "../store/auth";
import { useFavorites } from "../contexts/FavoritesContext";
import '../components/css/MovieCard.css';
import "./list-pages.css";

const FavoritesPage = () => {
  const { user } = getAuth();
  const navigate = useNavigate();
  const { favorites, fetchFavorites } = useFavorites();

  useEffect(() => {
    if (user?.id) {
      fetchFavorites(true); // Force refresh khi vào trang favorites
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const movies = favorites.map(item => item.phim).filter(p => p);

  if (!user)
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <div className="empty-state-text">Vui lòng đăng nhập</div>
          <div className="empty-state-subtext">Đăng nhập để xem phim yêu thích của bạn</div>
        </div>
      </div>
    );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">❤️ Phim Yêu Thích</h1>
        <div className="page-actions">
          <button onClick={() => navigate(-1)} className="btn-back">
            ← Quay lại
          </button>
        </div>
      </div>

      {movies.length > 0 ? (
        <div className="movie-grid">
          {movies.map(
            (movie) => movie && <MovieCard key={movie.MaPhim} movie={movie} />
          )}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">💔</div>
          <div className="empty-state-text">Chưa có phim yêu thích</div>
          <div className="empty-state-subtext">Hãy thêm phim bạn thích vào danh sách này</div>
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
