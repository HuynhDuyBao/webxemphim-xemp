// src/components/FilterSidebar.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './FilterSidebar.css';

const FilterSidebar = ({ genres = [], countries = [], initialValues = {} }) => {
  const navigate = useNavigate();

  // Local state for form fields
  const [searchQuery, setSearchQuery] = useState(initialValues?.searchQuery || "");
  const [selectedGenres, setSelectedGenres] = useState(initialValues?.selectedGenres || []);
  const [selectedCountry, setSelectedCountry] = useState(initialValues?.selectedCountry || "");
  const [selectedYear, setSelectedYear] = useState(initialValues?.selectedYear || "");
  const [selectedType, setSelectedType] = useState(initialValues?.selectedType || "");
  const [selectedStatus, setSelectedStatus] = useState(initialValues?.selectedStatus || "");

  // Update local state when initialValues change (e.g. URL changes)
  useEffect(() => {
    if (initialValues) {
      setSearchQuery(initialValues.searchQuery || "");
      setSelectedGenres(initialValues.selectedGenres || []);
      setSelectedCountry(initialValues.selectedCountry || "");
      setSelectedYear(initialValues.selectedYear || "");
      setSelectedType(initialValues.selectedType || "");
      setSelectedStatus(initialValues.selectedStatus || "");
    }
  }, [initialValues?.searchQuery, initialValues?.selectedGenres, initialValues?.selectedCountry, initialValues?.selectedYear, initialValues?.selectedType, initialValues?.selectedStatus]);

  const toggleGenre = (id) => {
    const idStr = String(id);
    setSelectedGenres(prev => {
      const prevStrings = prev.map(String);
      return prevStrings.includes(idStr)
        ? prevStrings.filter(g => g !== idStr)
        : [...prevStrings, idStr];
    });
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedGenres.length > 0) params.set("genres", selectedGenres.join(','));
    if (selectedCountry) params.set("country", selectedCountry);
    if (selectedYear) params.set("year", selectedYear);
    if (selectedType) params.set("type", selectedType);
    if (selectedStatus) params.set("status", selectedStatus);
    
    navigate(`/search?${params.toString()}`);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedGenres([]);
    setSelectedCountry("");
    setSelectedYear("");
    setSelectedType("");
    setSelectedStatus("");
    navigate("/search");
  };

  // Generate years (e.g., current year down to 2000)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <aside className="filter-sidebar">
      {/* TÌM KIẾM */}
      <div className="filter-group">
        <h3>Tìm kiếm</h3>
        <input
          type="text"
          placeholder="Nhập tên phim..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="filter-input"
        />
      </div>

      {/* THỂ LOẠI */}
      {genres && genres.length > 0 && (
        <div className="filter-group">
          <h3>Thể loại</h3>
          <div className="genre-tags">
            <button
              className={`tag ${selectedGenres.length === 0 ? 'active' : ''}`}
              onClick={() => setSelectedGenres([])}
            >
              Tất cả
            </button>
            {genres.map(g => (
              <button
                key={g.MaTheLoai}
                className={`tag ${selectedGenres.map(String).includes(String(g.MaTheLoai)) ? 'active' : ''}`}
                onClick={() => toggleGenre(g.MaTheLoai)}
              >
                {g.TenTheLoai}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* QUỐC GIA */}
      {countries && countries.length > 0 && (
        <div className="filter-group">
          <h3>Quốc gia</h3>
          <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className="filter-select">
            <option value="">Tất cả</option>
            {countries.map(c => (
              <option key={c.MaQuocGia} value={c.MaQuocGia}>{c.TenQuocGia}</option>
            ))}
          </select>
        </div>
      )}

      {/* NĂM */}
      <div className="filter-group">
        <h3>Năm sản xuất</h3>
        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="filter-select">
          <option value="">Tất cả</option>
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* LOẠI PHIM */}
      <div className="filter-group">
        <h3>Loại phim</h3>
        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="filter-select">
          <option value="">Tất cả</option>
          <option value="Lẻ">Phim lẻ</option>
          <option value="Bộ">Phim bộ</option>
        </select>
      </div>

      {/* TÌNH TRẠNG */}
      <div className="filter-group">
        <h3>Tình trạng</h3>
        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="filter-select">
          <option value="">Tất cả</option>
          <option value="Hoàn thành">Hoàn thành</option>
          <option value="Đang chiếu">Đang chiếu</option>
          <option value="Sắp chiếu">Sắp chiếu</option>
        </select>
      </div>

      {/* NÚT */}
      <div className="filter-actions">
        <button className="btn-apply" onClick={handleApplyFilters}>Lọc kết quả</button>
        <button className="btn-reset" onClick={resetFilters}>Xóa bộ lọc</button>
      </div>
    </aside>
  );
};

export default FilterSidebar;