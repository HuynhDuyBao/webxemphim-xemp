// src/pages/admin/MovieStatistics.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import Header from "../../components/Header";
import "./MovieStatistics.css";
import { 
  Eye, 
  Star, 
  MessageCircle, 
  Heart, 
  Film, 
  TrendingUp, 
  ArrowLeft, 
  Search, 
  Calendar, 
  User,
  BarChart2,
  MessageSquare
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const MovieStatistics = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieStats, setMovieStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("LuotXem");
  const [sortOrder, setSortOrder] = useState("desc");

  const [overview, setOverview] = useState(null);

  useEffect(() => {
    fetchOverview();
    fetchMovies();
  }, [searchTerm, sortBy, sortOrder]);

  const fetchOverview = async () => {
    try {
      const response = await api.get("/dashboard/overview");
      if (response.data.success) {
        setOverview(response.data.data);
      }
    } catch (error) {
      console.error("Lỗi khi tải tổng quan:", error);
    }
  };

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await api.get("/dashboard/movies", {
        params: {
          search: searchTerm,
          sort_by: sortBy,
          sort_order: sortOrder,
        },
      });
      
      if (response.data.success) {
        setMovies(response.data.data || []);
      } else {
        alert("Không thể tải dữ liệu: " + (response.data.message || ""));
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách phim:", error);
      alert("Lỗi kết nối API");
    } finally {
      setLoading(false);
    }
  };

  const fetchMovieStats = async (movieId) => {
    try {
      setStatsLoading(true);
      const response = await api.get(`/dashboard/movies/${movieId}`);
      
      if (response.data.success) {
        setMovieStats(response.data.data);
      }
    } catch (error) {
      console.error("Lỗi khi tải thống kê:", error);
      alert("Lỗi khi tải thống kê phim");
    } finally {
      setStatsLoading(false);
    }
  };

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
    fetchMovieStats(movie.MaPhim);
  };

  const handleBackToList = () => {
    setSelectedMovie(null);
    setMovieStats(null);
  };

  const formatNumber = (num) => {
    return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";
  };

  return (
    <>
      <Header />
      <div className="statistics-page">
        <header className="statistics-header">
          <button className="btn-back" onClick={() => navigate("/admin")}>
            <ArrowLeft size={18} /> Quay lại Dashboard
          </button>
          <h1 className="admin-title">Thống Kê Phim</h1>
          <div style={{ width: "100px" }}></div>
        </header>

          {!selectedMovie ? (
            <div className="movies-list-section">
              {overview && (
                <div className="overview-cards">
                  <div className="overview-card blue">
                    <div className="card-icon"><Film size={32} /></div>
                    <div className="card-info">
                      <h3>Tổng Phim</h3>
                      <p>{formatNumber(overview.total_movies)}</p>
                    </div>
                  </div>
                  <div className="overview-card green">
                    <div className="card-icon"><Eye size={32} /></div>
                    <div className="card-info">
                      <h3>Tổng Lượt Xem</h3>
                      <p>{formatNumber(overview.total_views)}</p>
                    </div>
                  </div>
                  <div className="overview-card orange">
                    <div className="card-icon"><Star size={32} /></div>
                    <div className="card-info">
                      <h3>Đánh Giá TB</h3>
                      <p>{overview.average_rating}/10</p>
                    </div>
                  </div>
                  <div className="overview-card purple">
                    <div className="card-icon"><MessageCircle size={32} /></div>
                    <div className="card-info">
                      <h3>Tổng Bình Luận</h3>
                      <p>{formatNumber(overview.total_comments)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Charts Section */}
              {movies.length > 0 && (
                <div className="charts-section">
                  <div className="chart-card">
                    <h3><TrendingUp size={20} /> Top 10 Phim Có Lượt Xem Cao Nhất</h3>
                    <Bar
                      data={{
                        labels: movies.slice(0, 10).map(m => m.TenPhim.length > 20 ? m.TenPhim.substring(0, 20) + '...' : m.TenPhim),
                        datasets: [{
                          label: 'Lượt Xem',
                          data: movies.slice(0, 10).map(m => m.LuotXem),
                          backgroundColor: 'rgba(59, 130, 246, 0.6)',
                          borderColor: 'rgba(59, 130, 246, 1)',
                          borderWidth: 2,
                          borderRadius: 4,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          title: { display: false }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: { color: '#94a3b8' },
                            grid: { color: '#334155' }
                          },
                          x: {
                            ticks: { color: '#94a3b8' },
                            grid: { display: false }
                          }
                        }
                      }}
                    />
                  </div>

                  <div className="charts-row">
                    <div className="chart-card half">
                      <h3><Star size={20} /> Top 10 Phim Đánh Giá Cao Nhất</h3>
                      <Bar
                        data={{
                          labels: movies.slice().sort((a, b) => parseFloat(b.avg_rating || 0) - parseFloat(a.avg_rating || 0)).slice(0, 10).map(m => m.TenPhim.length > 15 ? m.TenPhim.substring(0, 15) + '...' : m.TenPhim),
                          datasets: [{
                            label: 'Điểm Đánh Giá',
                            data: movies.slice().sort((a, b) => parseFloat(b.avg_rating || 0) - parseFloat(a.avg_rating || 0)).slice(0, 10).map(m => parseFloat(m.avg_rating || 0)),
                            backgroundColor: 'rgba(245, 158, 11, 0.6)',
                            borderColor: 'rgba(245, 158, 11, 1)',
                            borderWidth: 2,
                            borderRadius: 4,
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          indexAxis: 'y',
                          plugins: {
                            legend: { display: false }
                          },
                          scales: {
                            x: {
                              beginAtZero: true,
                              max: 10,
                              ticks: { color: '#94a3b8' },
                              grid: { color: '#334155' }
                            },
                            y: {
                              ticks: { color: '#94a3b8' },
                              grid: { display: false }
                            }
                          }
                        }}
                      />
                    </div>

                    <div className="chart-card half">
                      <h3><MessageSquare size={20} /> Bình Luận & Yêu Thích</h3>
                      <Line
                        data={{
                          labels: movies.slice(0, 10).map(m => m.TenPhim.substring(0, 15)),
                          datasets: [
                            {
                              label: 'Bình Luận',
                              data: movies.slice(0, 10).map(m => m.comment_count || 0),
                              borderColor: '#8b5cf6',
                              backgroundColor: 'rgba(139, 92, 246, 0.1)',
                              fill: true,
                              tension: 0.4,
                              pointBackgroundColor: '#8b5cf6'
                            },
                            {
                              label: 'Yêu Thích',
                              data: movies.slice(0, 10).map(m => m.favorite_count || 0),
                              borderColor: '#ec4899',
                              backgroundColor: 'rgba(236, 72, 153, 0.1)',
                              fill: true,
                              tension: 0.4,
                              pointBackgroundColor: '#ec4899'
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              labels: { color: '#94a3b8' }
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: { color: '#94a3b8' },
                              grid: { color: '#334155' }
                            },
                            x: {
                              ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 },
                              grid: { display: false }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="chart-card">
                    <h3><BarChart2 size={20} /> So Sánh Đánh Giá Các Phim</h3>
                    <Bar
                      data={{
                        labels: movies.slice(0, 15).map(m => m.TenPhim.length > 20 ? m.TenPhim.substring(0, 20) + '...' : m.TenPhim),
                        datasets: [{
                          label: 'Điểm Đánh Giá',
                          data: movies.slice(0, 15).map(m => parseFloat(m.avg_rating || 0)),
                          backgroundColor: movies.slice(0, 15).map(m => {
                            const rating = parseFloat(m.avg_rating || 0);
                            if (rating >= 8) return 'rgba(16, 185, 129, 0.6)';
                            if (rating >= 6) return 'rgba(245, 158, 11, 0.6)';
                            return 'rgba(239, 68, 68, 0.6)';
                          }),
                          borderColor: movies.slice(0, 15).map(m => {
                            const rating = parseFloat(m.avg_rating || 0);
                            if (rating >= 8) return 'rgba(16, 185, 129, 1)';
                            if (rating >= 6) return 'rgba(245, 158, 11, 1)';
                            return 'rgba(239, 68, 68, 1)';
                          }),
                          borderWidth: 2,
                          borderRadius: 4,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                return 'Điểm: ' + context.parsed.y + '/10';
                              }
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 10,
                            ticks: { 
                              color: '#94a3b8',
                              stepSize: 1
                            },
                            grid: { color: '#334155' }
                          },
                          x: {
                            ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 },
                            grid: { display: false }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="filters-section">
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Tìm kiếm phim..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: 48 }}
                  />
                </div>
                <div className="sort-controls">
                  <label>Sắp xếp:</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="LuotXem">Lượt xem</option>
                    <option value="avg_rating">Đánh giá</option>
                    <option value="comment_count">Bình luận</option>
                    <option value="favorite_count">Yêu thích</option>
                  </select>
                  <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                    <option value="desc">Giảm dần</option>
                    <option value="asc">Tăng dần</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="loading">Đang tải...</div>
              ) : (
                <div className="movies-grid-enhanced">
                  {movies.map((movie) => {
                    const views = movie.LuotXem || 0;
                    const rating = parseFloat(movie.avg_rating || 0);
                    const comments = movie.comment_count || 0;
                    const favorites = movie.favorite_count || 0;
                    const maxValue = Math.max(views, rating * 1000, comments * 100, favorites * 100);
                    
                    return (
                      <div key={movie.MaPhim} className="movie-card-enhanced" onClick={() => handleMovieClick(movie)}>
                        <div className="movie-card-header">
                          <img src={movie.HinhAnh || "/placeholder.png"} alt={movie.TenPhim} className="card-poster" onError={(e) => e.target.src = "/placeholder.png"} />
                          <div className="card-movie-info">
                            <h4 className="card-movie-title">{movie.TenPhim}</h4>
                            <span className="card-movie-year"><Calendar size={14} /> {movie.NamPhatHanh}</span>
                            <span className={`rating-badge ${rating >= 8 ? 'high' : rating >= 5 ? 'medium' : 'low'}`}>
                              <Star size={12} fill="currentColor" /> {rating ? rating.toFixed(1) : "N/A"}
                            </span>
                          </div>
                        </div>
                        
                        <div className="movie-stats-chart">
                          <div className="stat-bar-item">
                            <div className="stat-bar-label">
                              <span className="stat-icon-label"><Eye size={16} /></span>
                              <span className="stat-name">Lượt Xem</span>
                              <span className="stat-value">{formatNumber(views)}</span>
                            </div>
                            <div className="stat-bar-track">
                              <div className="stat-bar-fill views" style={{ width: `${(views / maxValue) * 100}%` }}></div>
                            </div>
                          </div>
                          
                          <div className="stat-bar-item">
                            <div className="stat-bar-label">
                              <span className="stat-icon-label"><Star size={16} /></span>
                              <span className="stat-name">Đánh Giá</span>
                              <span className="stat-value">{rating.toFixed(1)}</span>
                            </div>
                            <div className="stat-bar-track">
                              <div className="stat-bar-fill rating" style={{ width: `${(rating / 10) * 100}%` }}></div>
                            </div>
                          </div>
                          
                          <div className="stat-bar-item">
                            <div className="stat-bar-label">
                              <span className="stat-icon-label"><MessageCircle size={16} /></span>
                              <span className="stat-name">Bình Luận</span>
                              <span className="stat-value">{formatNumber(comments)}</span>
                            </div>
                            <div className="stat-bar-track">
                              <div className="stat-bar-fill comments" style={{ width: `${(comments / (maxValue / 100)) * 100}%` }}></div>
                            </div>
                          </div>
                          
                          <div className="stat-bar-item">
                            <div className="stat-bar-label">
                              <span className="stat-icon-label"><Heart size={16} /></span>
                              <span className="stat-name">Yêu Thích</span>
                              <span className="stat-value">{formatNumber(favorites)}</span>
                            </div>
                            <div className="stat-bar-track">
                              <div className="stat-bar-fill favorites" style={{ width: `${(favorites / (maxValue / 100)) * 100}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!loading && movies.length === 0 && (
                <div className="no-data">Không tìm thấy phim nào.</div>
              )}
            </div>
          ) : (
            <div className="movie-detail-stats">
              <button className="btn-back-detail" onClick={handleBackToList}>
                <ArrowLeft size={18} /> Quay lại danh sách
              </button>

              {statsLoading ? (
                <div className="loading">Đang tải thống kê...</div>
              ) : movieStats ? (
                <>
                  <div className="movie-header">
                    <img src={movieStats.movie.HinhAnh || "/placeholder.png"} alt={movieStats.movie.TenPhim} className="detail-poster" onError={(e) => e.target.src = "/placeholder.png"} />
                    <div className="movie-header-info">
                      <h2>{movieStats.movie.TenPhim}</h2>
                      <p className="movie-description">{movieStats.movie.MoTa}</p>
                      <div className="movie-meta">
                        <span><Calendar size={14} /> Năm: {movieStats.movie.NamPhatHanh}</span>
                        {movieStats.movie.ThoiLuong && <span><Film size={14} /> Thời lượng: {movieStats.movie.ThoiLuong}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="stats-grid">
                    <div className="stat-box">
                      <div className="stat-icon-large"><Eye size={48} color="#3b82f6" /></div>
                      <div className="stat-value">{formatNumber(movieStats.statistics.views)}</div>
                      <div className="stat-label">Lượt Xem</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-icon-large"><Heart size={48} color="#ec4899" /></div>
                      <div className="stat-value">{formatNumber(movieStats.statistics.favorites)}</div>
                      <div className="stat-label">Lượt Thích</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-icon-large"><Star size={48} color="#f59e0b" /></div>
                      <div className="stat-value">{movieStats.statistics.ratings.average}/10</div>
                      <div className="stat-label">Đánh Giá ({movieStats.statistics.ratings.count} lượt)</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-icon-large"><MessageCircle size={48} color="#8b5cf6" /></div>
                      <div className="stat-value">{formatNumber(movieStats.statistics.comments.total)}</div>
                      <div className="stat-label">Bình Luận</div>
                    </div>
                  </div>

                  {movieStats.statistics.ratings.count > 0 && (
                    <div className="rating-distribution">
                      <h3><BarChart2 size={24} /> Phân Phối Đánh Giá</h3>
                      <div className="rating-bars">
                        {movieStats.statistics.ratings.distribution.slice().reverse().map((item) => (
                          <div key={item.rating} className="rating-bar-row">
                            <span className="rating-number">{item.rating} <Star size={14} fill="currentColor" style={{ display: 'inline', verticalAlign: 'middle' }} /></span>
                            <div className="rating-bar-container">
                              <div className="rating-bar-fill" style={{ width: `${item.percentage}%` }}></div>
                            </div>
                            <span className="rating-count">{item.count} ({item.percentage}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {movieStats.top_raters && movieStats.top_raters.length > 0 && (
                    <div className="top-raters">
                      <h3><User size={24} /> Top Người Đánh Giá</h3>
                      <div className="raters-list">
                        {movieStats.top_raters.map((rater, index) => (
                          <div key={index} className="rater-item">
                            <div className="rater-info">
                              <strong>{rater.ho_ten || rater.ten_dang_nhap}</strong>
                              <span className="rater-rating">{rater.SoDiem}/10 <Star size={12} fill="currentColor" /></span>
                            </div>
                            {rater.BinhLuan && <p className="rater-comment">"{rater.BinhLuan}"</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {movieStats.statistics.comments.recent && movieStats.statistics.comments.recent.length > 0 && (
                    <div className="recent-comments">
                      <h3><MessageSquare size={24} /> Bình Luận Gần Đây</h3>
                      <div className="comments-list">
                        {movieStats.statistics.comments.recent.map((comment) => (
                          <div key={comment.MaBinhLuan} className="comment-item">
                            <div className="comment-header">
                              <strong>{comment.nguoi_dung?.ho_ten || comment.TenDN}</strong>
                              <span className="comment-time">{new Date(comment.ThoiGian).toLocaleDateString("vi-VN")}</span>
                            </div>
                            <p className="comment-content">{comment.NoiDung}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-data">Không có dữ liệu.</div>
              )}
            </div>
          )}
      </div>
    </>
  );
};

export default MovieStatistics;
