// src/pages/SearchResults.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import FilterSidebar from "../components/FilterSidebar";
import MovieCard from "../components/MovieCard";
import movieService from "../api/movieService";
import './SearchResults.css';
import '../components/css/MovieCard.css';

const SearchResults = ({ genres = [], countries = [] }) => {
  const [searchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalMovies, setTotalMovies] = useState(0);

  // Lấy các tham số từ URL
  const query = searchParams.get("q") || "";
  const genreParams = searchParams.get("genres") 
    ? searchParams.get("genres").split(',').filter(Boolean) 
    : [];
  const countryParam = searchParams.get("country") || "";
  const yearParam = searchParams.get("year") || "";
  const typeParam = searchParams.get("type") || "";
  const statusParam = searchParams.get("status") || "";

  useEffect(() => {
    const fetchFilteredMovies = async () => {
      setLoading(true);
      try {
        const filters = {};
        if (query) filters.q = query;
        if (genreParams.length > 0) filters.genres = genreParams;
        if (countryParam) filters.country = countryParam;
        if (yearParam) filters.year = yearParam;
        if (typeParam) filters.type = typeParam;
        if (statusParam) filters.status = statusParam;

        console.log('SearchResults - Filters:', filters);
        console.log('SearchResults - genreParams:', genreParams);

        // Gọi API với filters
        const res = await movieService.fetchMovies(1, 50, filters); // Lấy 50 phim, có thể thêm phân trang sau
        
        // Fix: Kiểm tra nếu res là mảng (API trả về trực tiếp danh sách phim)
        const moviesData = Array.isArray(res) ? res : (res.data || res.movies || []);
        
        setMovies(moviesData);
        setTotalMovies(res.total || moviesData.length);
      } catch (error) {
        console.error("Lỗi tìm kiếm phim:", error);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, genreParams.join(','), countryParam, yearParam, typeParam, statusParam]); // Chạy lại khi params thay đổi

  return (
    <div className="search-layout">
      <FilterSidebar
        genres={genres}
        countries={countries}
        // Truyền các giá trị hiện tại vào Sidebar để nó hiển thị đúng state
        initialValues={{
            searchQuery: query,
            selectedGenres: genreParams,
            selectedCountry: countryParam,
            selectedYear: yearParam,
            selectedType: typeParam,
            selectedStatus: statusParam
        }}
      />

      <main className="search-results">
        <div className="results-header">
          <h2>
            {loading ? "Đang tìm kiếm..." : (
                query 
                ? `Kết quả tìm kiếm cho "${query}" (${movies.length} phim)`
                : `Danh sách phim lọc được (${movies.length} phim)`
            )}
          </h2>
        </div>
        
        {loading ? (
            <div className="loading-spinner"></div>
        ) : (
            <div className="movie-grid-container">
                {movies.length > 0 ? (
                movies.map(movie => <MovieCard key={movie.MaPhim} movie={movie} />)
                ) : (
                <p className="no-results">Không tìm thấy phim nào phù hợp.</p>
                )}
            </div>
        )}
      </main>
    </div>
  );
};

export default SearchResults;