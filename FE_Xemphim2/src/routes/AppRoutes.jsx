// src/routes/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import SearchResults from "../pages/SearchResults";
import MovieDetail from "../pages/MovieDetail";
import WatchMovie from "../pages/WatchMovie";
import Login from "../pages/Login"; 
import Profile from "../pages/Profile";
import FavoritesPage from "../pages/FavoritesPage";
import HistoryPage from "../pages/HistoryPage";
// Admin
import AdminDashboard from "../pages/AdminDashboard";
import AdminTheLoai from "../pages/AdminTheLoai";    
import AdminQuocGia from "../pages/AdminQuocGia";     
import AdminMovieList from "../pages/AdminMovieList";
import AdminMovieEpisodes from "../pages/AdminMovieEpisodes";   
import AddMovie from "../pages/admin/AddMovie";   
import MainLayout from "../components/MainLayout";
import AdminUser from "../pages/AdminUser";
import EditMovie from "../pages/admin/EditMovie";
import AdminMovieTrailers from "../pages/admin/AdminMovieTrailers";
import MovieStatistics from "../pages/admin/MovieStatistics";
import AdminSubtitles from "../pages/AdminSubtitles";
const AppRoutes = ({ movies, genres, countries }) => {
  return (
    <Routes>
    
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home movies={movies} />} />
        <Route path="/search" element={<SearchResults movies={movies} genres={genres} countries={countries} />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
        <Route path="/watch/:id" element={<WatchMovie />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/history" element={<HistoryPage />} />
        
      <Route path="/login" element={<Login />} />
      <Route path="/admin/the-loai" element={<AdminTheLoai />} />
      <Route path="/admin/quoc-gia" element={<AdminQuocGia />} />
      <Route path="/admin/movies" element={<AdminMovieList />} />
      <Route path="/admin/add-movie" element={<AddMovie />} />
      <Route path="/admin/movies/:id/episodes" element={<AdminMovieEpisodes />} />
      <Route path="/admin/movies/:id/episodes/:episodeId/subtitles" element={<AdminSubtitles />} />
      <Route path="/admin/users" element={<AdminUser />} /> 
      <Route path="/admin/movies/edit/:id" element={<EditMovie />} />
      <Route path="/admin/movies/:id/trailer" element={<AdminMovieTrailers />} />
      <Route path="/admin/statistics" element={<MovieStatistics />} />
      </Route>

      <Route path="/admin" element={<AdminDashboard />} />


      
      
    </Routes>
  );
};

export default AppRoutes;