// src/components/MovieSlider.jsx
import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './MovieSlider.css'; // Tạo file CSS riêng cho slider

const MovieSlider = ({ title, movies }) => {
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth / 2; // Cuộn nửa chiều rộng
      if (direction === 'left') {
        scrollRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const handleMovieClick = (movieId) => {
    navigate(`/movie/${movieId}`);
  };

  if (!movies || movies.length === 0) {
    return null; // Không hiển thị nếu không có phim
  }

  return (
    <div className="movie-slider-container">
      {title && <h2 className="slider-title">{title}</h2>}
      <div className="slider-wrapper">
        <button className="scroll-btn left" onClick={() => scroll('left')}>&#10094;</button>
        <div className="movie-list-scroll" ref={scrollRef}>
          {movies.map(movie => (
            <div 
              key={movie.MaPhim} 
              className="movie-slide-item" 
              onClick={() => handleMovieClick(movie.MaPhim)}
            >
              <img src={movie.HinhAnh} alt={movie.TenPhim} />
              <div className="movie-title-overlay">{movie.TenPhim}</div>
            </div>
          ))}
        </div>
        <button className="scroll-btn right" onClick={() => scroll('right')}>&#10095;</button>
      </div>
    </div>
  );
};

export default MovieSlider;