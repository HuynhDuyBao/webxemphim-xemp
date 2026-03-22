// src/components/FeaturedSlider.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/api';
import './FeaturedSlider.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';

const FeaturedSlider = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef(null);
  const navigate = useNavigate();

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    const fetchTopMovies = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/phim/top/viewed');
        setMovies(res.data);
      } catch (err) {
        console.error("Error loading featured movies:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTopMovies();
  }, []);

  useEffect(() => {
    resetTimeout();
    if (movies.length > 0) {
      timeoutRef.current = setTimeout(
        () =>
          setCurrentIndex((prevIndex) =>
            prevIndex === movies.length - 1 ? 0 : prevIndex + 1
          ),
        5000 // Change slide every 5 seconds
      );
    }
    return () => {
      resetTimeout();
    };
  }, [currentIndex, movies.length, resetTimeout]);

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? movies.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = useCallback(() => {
    const isLastSlide = currentIndex === movies.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  }, [currentIndex, movies.length]);

  const goToSlide = (slideIndex) => {
    setCurrentIndex(slideIndex);
  };

  if (loading) return <div className="slider-loading">Loading featured movies...</div>;
  if (movies.length === 0) return null;

  return (
    <div className="featured-slider-container">
      <button className="slider-nav left" onClick={goToPrevious}><ChevronLeft size={40} /></button>
      <div className="slider-track" style={{ transform: `translateX(${-currentIndex * 100}%)` }}>
        {movies.map((movie) => (
          <div 
            key={movie.MaPhim} 
            className="slider-item" 
            style={{ backgroundImage: `url(${getImageUrl(movie.HinhAnhBanner || movie.HinhAnh)})` }}
            onClick={() => navigate(`/movie/${movie.MaPhim}`)}
          >
            <div className="slider-item-overlay"></div>
            <div className="slider-item-content">
              <h3>{movie.TenPhim}</h3>
              <p>{movie.MoTa?.substring(0, 150)}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="slider-nav right" onClick={goToNext}><ChevronRight size={40} /></button>
      <div className="slider-dots">
        {movies.map((_, slideIndex) => (
          <div
            key={slideIndex}
            className={`dot ${currentIndex === slideIndex ? 'active' : ''}`}
            onClick={() => goToSlide(slideIndex)}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedSlider;