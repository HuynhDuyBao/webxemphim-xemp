import React, { useState, useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { fetchMovies, fetchGenres, fetchCountries } from "./api/movieService";
import './App.css';
import './index.css';
import GlobalLoading from "./components/GlobalLoading";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FavoritesProvider } from "./contexts/FavoritesContext";

function App() {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);

        const [moviesRes, genresRes, countriesRes] = await Promise.all([
          fetchMovies(),
          fetchGenres(),
          fetchCountries(),
        ]);

        const safeMovies = Array.isArray(moviesRes) ? moviesRes : (moviesRes?.data || moviesRes?.movies || []);
        const safeGenres = Array.isArray(genresRes) ? genresRes : (genresRes?.data || genresRes?.genres || []);
        const safeCountries = Array.isArray(countriesRes) ? countriesRes : (countriesRes?.data || countriesRes?.countries || []);

        setMovies(safeMovies);
        setGenres(safeGenres);
        setCountries(safeCountries);

      } catch (err) {
        console.error("Lỗi tải dữ liệu ban đầu:", err);
        setMovies([]);
        setGenres([]);
        setCountries([]);
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };

    loadInitialData();
  }, []);

  if (loading) {
    return <GlobalLoading />; 
  }

  return (
    <Router>
      <FavoritesProvider>
        <ToastContainer position="top-right" autoClose={3000} theme="dark" />
        
        <AppRoutes 
          movies={movies} 
          genres={genres} 
          countries={countries} 
        />
      </FavoritesProvider>
    </Router>
  );
}

export default App;