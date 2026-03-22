import React from "react";

const MovieFilter = ({ genres, countries, filters, onFilterChange, onApplyFilter }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange(name, value);
  };

  return (
    <div className="filter-section">
      <h2 className="filter-title">
        <svg fill="currentColor" viewBox="0 0 20 20" className="inline-block">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707l-4 4a1 1 0 00-.293.707v5a1 1 0 01-.439.824l-3 2A1 1 0 018 19v-6a1 1 0 00-.293-.707l-4-4A1 1 0 013 7V4z" />
        </svg>
        Bộ lọc phim
      </h2>

      <div className="filter-grid">
        {/* Thể loại */}
        <div className="filter-group">
          <label>Thể loại</label>
          <select name="genreId" value={filters.genreId} onChange={handleChange}>
            <option value="">-- Tất cả thể loại --</option>
            {genres.map(g => (
              <option key={g.MaTheLoai} value={g.MaTheLoai}>{g.TenTheLoai}</option>
            ))}
          </select>
        </div>

        {/* Quốc gia */}
        <div className="filter-group">
          <label>Quốc gia</label>
          <select name="countryId" value={filters.countryId} onChange={handleChange}>
            <option value="">-- Tất cả quốc gia --</option>
            {countries.map(c => (
              <option key={c.MaQuocGia} value={c.MaQuocGia}>{c.TenQuocGia}</option>
            ))}
          </select>
        </div>

        {/* Tình trạng */}
        <div className="filter-group">
          <label>Tình trạng</label>
          <select name="status" value={filters.status} onChange={handleChange}>
            <option value="">-- Tất cả --</option>
            <option value="Đang chiếu">Đang chiếu</option>
            <option value="Đã kết thúc">Đã kết thúc</option>
            <option value="Sắp chiếu">Sắp chiếu</option>
          </select>
        </div>

        <div className="filter-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button onClick={onApplyFilter} className="filter-button w-full">
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovieFilter;