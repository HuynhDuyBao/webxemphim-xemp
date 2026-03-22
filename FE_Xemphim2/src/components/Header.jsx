// src/components/Header.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import UserDropdown from "./UserDropdown";
import ThemeToggle from "./ThemeToggle";
import axios from "../api/api";
import './Header.css';
import { ChevronDown } from 'lucide-react';

const Header = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [genres, setGenres] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loadingGenres, setLoadingGenres] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const [searchParams] = useSearchParams();
  const currentType = searchParams.get("type") || "";

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Fetch genres
  useEffect(() => {
    const loadGenres = async () => {
      setLoadingGenres(true);
      try {
        const res = await axios.get("/genres");
        setGenres(res.data.data || res.data || []);
      } catch (err) {
        console.error("Error loading genres:", err);
      }
      setLoadingGenres(false);
    };
    loadGenres();
  }, []);

  // Fetch countries
  useEffect(() => {
    const loadCountries = async () => {
      setLoadingCountries(true);
      try {
        const res = await axios.get("/countries");
        setCountries(res.data.data || res.data || []);
      } catch (err) {
        console.error("Error loading countries:", err);
      }
      setLoadingCountries(false);
    };
    loadCountries();
  }, []);

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleGenreClick = (genreId) => {
    navigate(`/search?genres=${genreId}`);
  };

  const handleCountryClick = (countryId) => {
    navigate(`/search?country=${countryId}`);
  };

  const handleTypeClick = (type) => {
    navigate(`/search?type=${type}`);
  };

  const safeGenres = Array.isArray(genres) ? genres : [];
  const safeCountries = Array.isArray(countries) ? countries : [];

  return (
    <header className={`rophim-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-inner">
        
        <div className="logo" onClick={() => navigate("/")}>
          <h1>XemPhim</h1>
        </div>

        <nav className="nav-filter">
          <button 
            className={`nav-item ${currentType === 'Lẻ' ? 'active' : ''}`}
            onClick={() => handleTypeClick('Lẻ')}
          >
            Phim Lẻ
          </button>
          <button 
            className={`nav-item ${currentType === 'Bộ' ? 'active' : ''}`}
            onClick={() => handleTypeClick('Bộ')}
          >
            Phim Bộ
          </button>
          
          <div className="dropdown-filter">
            <span>Thể Loại <ChevronDown size={16} /></span>
            <div className="dropdown-content">
              {loadingGenres ? (
                <div className="dropdown-item">Đang tải...</div>
              ) : (
                safeGenres.slice(0, 12).map(g => (
                  <div
                    key={g.MaTheLoai}
                    className="dropdown-item"
                    onClick={() => handleGenreClick(g.MaTheLoai)}
                  >
                    {g.TenTheLoai}
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="dropdown-filter">
            <span>Quốc Gia <ChevronDown size={16} /></span>
            <div className="dropdown-content">
              {loadingCountries ? (
                <div className="dropdown-item">Đang tải...</div>
              ) : (
                safeCountries.slice(0, 10).map(c => (
                  <div
                    key={c.MaQuocGia}
                    className="dropdown-item"
                    onClick={() => handleCountryClick(c.MaQuocGia)}
                  >
                    {c.TenQuocGia}
                  </div>
                ))
              )}
            </div>
          </div>
        </nav>

        <div className="search-box-large">
          <input
            type="text"
            placeholder="Tìm kiếm phim, diễn viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" onClick={() => searchQuery.trim() && navigate(`/search?q=${encodeURIComponent(searchQuery)}`)}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <div className="user-actions">
          <UserDropdown />
        </div>
        
      </div>
    </header>
  );
};

export default Header;
