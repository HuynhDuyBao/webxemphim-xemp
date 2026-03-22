// src/hooks/useSearchFilters.js
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const useSearchFilters = (allMovies, genres, countries) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL params
  const urlQuery = searchParams.get("q") || "";
  const urlGenres = searchParams.get("genres") ? searchParams.get("genres").split(',') : [];
  const urlCountry = searchParams.get("country") || "";
  const urlYear = searchParams.get("year") || "";
  const urlType = searchParams.get("type") || "";
  const urlStatus = searchParams.get("status") || "";

  // Local state
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [selectedGenres, setSelectedGenres] = useState(urlGenres);
  const [selectedCountry, setSelectedCountry] = useState(urlCountry);
  const [selectedYear, setSelectedYear] = useState(urlYear);
  const [selectedType, setSelectedType] = useState(urlType);
  const [selectedStatus, setSelectedStatus] = useState(urlStatus);
  const [filteredMovies, setFilteredMovies] = useState([]);

  // Lọc phim
  const applyFilters = () => {
    let results = allMovies;

    if (urlQuery) {
      results = results.filter(m =>
        m.TenPhim.toLowerCase().includes(urlQuery.toLowerCase()) ||
        (m.TieuDe && m.TieuDe.toLowerCase().includes(urlQuery.toLowerCase()))
      );
    }

    if (urlGenres.length > 0) {
      results = results.filter(m =>
        urlGenres.some(id => m.theloai.some(g => g.MaTheLoai.toString() === id))
      );
    }

    if (urlCountry) results = results.filter(m => m.quocgia?.MaQuocGia.toString() === urlCountry);
    if (urlYear) results = results.filter(m => m.NamPhatHanh === parseInt(urlYear));
    if (urlType) results = results.filter(m => m.PhanLoai === urlType);
    if (urlStatus) results = results.filter(m => m.TinhTrang === urlStatus);

    setFilteredMovies(results);
  };

  // Gọi khi URL thay đổi
  useEffect(() => {
    applyFilters();
  }, [searchParams]);

  // Áp dụng filter
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

  const toggleGenre = (id) => {
    setSelectedGenres(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  return {
    searchQuery, setSearchQuery,
    selectedGenres, toggleGenre,
    selectedGenres, setSelectedGenres, toggleGenre,
    selectedCountry, setSelectedCountry,
    selectedYear, setSelectedYear,
    selectedType, setSelectedType,
    selectedStatus, setSelectedStatus,
    filteredMovies,
    handleApplyFilters,
    resetFilters,
    urlQuery
  };
};

export default useSearchFilters;