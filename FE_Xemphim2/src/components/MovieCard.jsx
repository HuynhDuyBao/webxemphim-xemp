import React from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "../store/auth";
import { Play, Heart, Star, Clock } from "lucide-react";
import { useFavorites } from "../contexts/FavoritesContext";
import { getImageUrl } from "../utils/imageUrl";
import './css/MovieCard.css';

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const { user } = getAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const isMovieFavorite = isFavorite(movie.MaPhim);

  const handleToggleFavorite = async (e) => {
    e.stopPropagation(); 
    if (!user) return alert("Vui lòng đăng nhập để thích phim!");

    const success = await toggleFavorite(movie.MaPhim);
    if (!success) {
      alert("Lỗi cập nhật yêu thích!");
    } else {
      window.dispatchEvent(new Event('statsUpdateNeeded'));
    }
  };

  const handleImageError = (e) => {
    e.target.src = "https://placehold.co/300x450?text=No+Image";
  };

  return (
    <div className="movie-card-modern" onClick={() => navigate(`/movie/${movie.MaPhim}`)}>
      <div className="card-poster">
        <img 
          src={getImageUrl(movie.HinhAnh)} 
          alt={movie.TenPhim} 
          loading="lazy" 
          onError={handleImageError}
        />
        
        <div className="card-badges">
          {movie.ChatLuong && <span className="badge-quality">{movie.ChatLuong}</span>}
          {movie.NamPhatHanh && <span className="badge-year">{movie.NamPhatHanh}</span>}
        </div>

        <div className="card-overlay">
          <button className="play-button">
            <Play fill="currentColor" size={24} />
          </button>
          
          <div className="overlay-info">
            <div className="meta-row">
              <span className="meta-item"><Star size={12} fill="#fbbf24" color="#fbbf24" /> {movie.DiemDanhGia || 8.5}</span>
              <span className="meta-item"><Clock size={12} /> {movie.ThoiLuong || 'N/A'}</span>
            </div>
            <div className="genres-row">
              {movie.theloai?.slice(0, 2).map((g, i) => (
                <span key={i} className="genre-pill">{g.TenTheLoai}</span>
              ))}
            </div>
          </div>

          {user && (
            <button 
              className={`favorite-btn ${isMovieFavorite ? 'active' : ''}`}
              onClick={handleToggleFavorite}
            >
              <Heart size={18} fill={isMovieFavorite ? "currentColor" : "none"} />
            </button>
          )}
        </div>
      </div>
      
      <div className="card-content">
        <h3 className="card-title" title={movie.TenPhim}>{movie.TenPhim}</h3>
        <p className="card-subtitle">{movie.TieuDe || movie.TenPhim}</p>
      </div>
    </div>
  );
};

export default MovieCard;