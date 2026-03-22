// src/pages/MovieDetail.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import movieService from "../api/movieService"; 
import { ratingService } from "../api/ratingService";
import { commentService } from "../api/commentService";
import "./MovieDetail.css";
import { Star, MessageCircle, Heart, Play, Send, Reply, X, Trash2 } from "lucide-react";
import { useFavorites } from "../contexts/FavoritesContext";
import { getAuth } from "../store/auth";
import { getImageUrl } from "../utils/imageUrl";

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [comments, setComments] = useState([]);
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [visibleComments, setVisibleComments] = useState(5);
  const [loading, setLoading] = useState(true);

  const { user, token } = useMemo(() => getAuth(), []);
  const { isFavorite: checkIsFavorite, toggleFavorite: contextToggleFavorite } = useFavorites();
  
  const isFavorite = movie ? checkIsFavorite(movie.MaPhim) : false;

  // ================= LOAD DATA ===============
  const loadData = async () => {
  setLoading(true);
  try {
    // Dùng Promise.all nhưng nhận đúng response
    const [movieResponse, commentsResponse, ratingsResponse, relatedResponse] = await Promise.all([
      movieService.getMovie(id),
      commentService.getComments(id),
      user ? movieService.getRatings(id) : Promise.resolve(null),
      movieService.fetchRecommended()
    ]);

    // DEBUG để chắc chắn
    console.log("MovieDetail - movieResponse:", movieResponse);
    console.log("MovieDetail - commentsResponse:", commentsResponse);
    console.log("MovieDetail - ratingsResponse:", ratingsResponse);

    // Gán phim
    setMovie(movieResponse || null);

    // Gán bình luận (an toàn)
    const commentsData = commentsResponse?.data || commentsResponse || [];
    setComments(Array.isArray(commentsData) ? commentsData : []);

    // Gán đánh giá của user (nếu có đăng nhập)
    if (user && ratingsResponse?.data) {
      const myRate = ratingsResponse.data.find(r => r.TenDN === user.ten_dang_nhap);
      if (myRate) {
        setUserRating(myRate.SoDiem || 0);
        setRatingComment(myRate.BinhLuan || "");
      }
    }

    // Gán phim liên quan (lọc bỏ phim hiện tại)
    const related = (relatedResponse?.data || relatedResponse || []).filter(m => m.MaPhim !== parseInt(id));
    setRelatedMovies(related.slice(0, 6));

  } catch (err) {
    console.error("Lỗi load data MovieDetail:", err.response || err);
    setMovie(null);
    setComments([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    setLoading(true);
    setMovie(null); // reset
    setUserRating(0);
    setRatingComment("");

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // =================== ACTION ===================
  const toggleFavorite = async (e) => {
    e.stopPropagation();
    if (!user) return alert("Vui lòng đăng nhập!");
    if (!movie) return;

    const success = await contextToggleFavorite(movie.MaPhim);
    if (!success) {
      alert("Lỗi! Không thể cập nhật yêu thích.");
    }
  };

  const handleWatchNow = async (episode = null) => {
    if (!movie) return;

    // Tăng lượt xem khi nhấn nút xem
    try {
      await movieService.incrementView(id);
    } catch (err) {
      console.log("Lỗi tăng lượt xem:", err);
    }

    let tapQuery = "";
    if (movie.PhanLoai !== "Lẻ") {
      const tapToWatch = episode || movie.episodes?.[0];
      if (!tapToWatch) return alert("Phim chưa có tập nào!");
      tapQuery = `?tap=${tapToWatch.MaTap}`;
    }
    navigate(`/watch/${id}${tapQuery}`);
  };

  const handleRatingSubmit = async () => {
    if (!userRating) return alert("Vui lòng chọn số sao!");
    try {
      await ratingService.submitRating({
        MaPhim: parseInt(id),
        so_diem: userRating,
        binh_luan: ratingComment,
      });
      loadData();
      alert("Đánh giá thành công!");
    } catch {
      alert("Lỗi đánh giá");
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;
    try {
      await commentService.postComment({
        MaPhim: id,
        NoiDung: commentText,
        parent_id: replyTo?.MaBinhLuan || null,
      });
      setCommentText("");
      setReplyTo(null);
      loadData();
    } catch {
      alert("Lỗi bình luận");
    }
  };

  const startReply = (comment) => {
    setReplyTo(comment);
    setCommentText(`@${comment.nguoiDung?.ho_ten || comment.TenDN} `);
    // Scroll to input
    document.querySelector('.comment-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Bạn có chắc muốn xóa bình luận này?")) return;
    try {
      await commentService.deleteComment(commentId);
      loadData();
      alert("Đã xóa bình luận!");
    } catch (err) {
      console.error("Lỗi xóa bình luận:", err);
      alert("Lỗi khi xóa bình luận!");
    }
  };

  const showMore = () => setVisibleComments(prev => prev + 5);

  // =================== RENDER – BẢO VỆ LỖI ===================
  if (loading)
    return <div className="loading">Đang tải...</div>;

  if (!movie)
    return <div className="loading">Không tìm thấy phim!</div>;

  // ========== FALLBACK IMAGE =============
  const poster = getImageUrl(movie.HinhAnh);
  // Ưu tiên dùng HinhAnhBanner nếu có, nếu không thì dùng HinhAnh
  const banner = getImageUrl(movie.HinhAnhBanner || movie.HinhAnh);
const trailerVideo =
  movie.videos && movie.videos.length > 0 ? movie.videos[0] : null;
 const backgroundLink = trailerVideo ? trailerVideo.Link : null;
  const isVideoLink = (link) => {
    return link && (link.includes(".mp4") || link.includes(".m3u8"));
  };
  return (
    <div className="movie-detail">

      {/* ===== BANNER ===== */}
      <div
        className="banner">
          {isVideoLink(backgroundLink) && (
          <video
            className="banner-video-bg"
            src={backgroundLink}
            autoPlay
            muted
            loop
            playsInline
            poster={poster}
          />
        )}

        <div
          className="banner-image-bg"
          style={{ backgroundImage: `url(${banner})` }}
        ></div>
        <div className="banner-overlay"></div>
        <div className="banner-content">
          <div className="banner-poster">
            <img src={poster} alt={movie.TenPhim} />
          </div>

          <div className="banner-info">
            <h1 className="title">{movie.TenPhim}</h1>
            <p className="subtitle">{movie.TieuDe || "Không có tiêu đề phụ"}</p>

            <div className="meta-tags">
              <span className="tag imdb">Điểm {movie.DanhGia || "N/A"}</span>
              <span className="tag">{movie.NamPhatHanh}</span>
              <span className="tag">{movie.ThoiLuong ? `${movie.ThoiLuong} phút` : "N/A"}</span>
            </div>

            <div className="genre-tags">
              {movie.theloai?.map(g => (
                <span key={g.MaTheLoai} className="genre-tag">{g.TenTheLoai}</span>
              ))}
            </div>

            <div className="banner-actions">
              <button className="btn-play" onClick={() => handleWatchNow(null)}>
                <Play fill="currentColor" size={20} /> Xem Ngay
              </button>

              <button className="btn-action" onClick={toggleFavorite}>
                <Heart fill={isFavorite ? "currentColor" : "none"} color={isFavorite ? "#ef4444" : "currentColor"} />
                {isFavorite ? "Đã thích" : "Yêu thích"}
              </button>

              <button className="btn-action" onClick={() => document.querySelector('.comment-section')?.scrollIntoView({ behavior: 'smooth' })}>
                <MessageCircle /> Bình luận
              </button>

              <div className="btn-rating">
                <span className="score">⭐ {movie.DanhGia || "N/A"}</span>
                <span>Đánh giá</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== BODY ====================== */}
      <div className="detail-layout">

        <div className="detail-main">
          {/* meta bar */}
          <div className="detail-meta-bar">
            <span className="meta-bar-tag">Điểm {movie.DanhGia || "N/A"}</span>
            <span className="meta-bar-tag">{movie.NamPhatHanh}</span>
            <span className="meta-bar-tag">{movie.PhanLoai}</span>
            {movie.ThoiLuong && <span className="meta-bar-tag">{movie.ThoiLuong} phút</span>}
          </div>

          {/* Episodes */}
          {movie.episodes?.length > 0 && (
            <div className="episode-section">
              <div className="episode-selector">
                <button className="episode-part-btn">Phần 1</button>
              </div>

              <div className="episode-grid">
                {movie.episodes.map(tap => (
                  <button
                    key={tap.MaTap}
                    className="episode-btn"
                    onClick={() => handleWatchNow(tap)}
                  >
                    {tap.TenTap}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="detail-info">
            <h3>Giới thiệu</h3>
            <p>{movie.MoTa || "Chưa có mô tả."}</p>

            <div className="info-grid">
              <strong>Thời lượng:</strong>
              <span>{movie.ThoiLuong ? `${movie.ThoiLuong} phút` : "N/A"}</span>

              <strong>Quốc gia:</strong>
              <span>{movie.quocgia?.TenQuocGia || "N/A"}</span>
            </div>
          </div>

          {/* Ratings */}
          <div className="section rating-section">
            <h3><Star className="icon-title" /> Đánh giá phim</h3>

            {user ? (
              <div className="rating-container">
                <div className="rating-left">
                   <div className="user-avatar-large">
                      <img 
                        src={user?.hinh_dai_dien_url ? `${user.hinh_dai_dien_url}?t=${Date.now()}` : `https://ui-avatars.com/api/?name=${user.ho_ten || user.ten_dang_nhap}&background=random`}
                        alt={user?.ten_dang_nhap}
                        onError={(e) => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${user.ho_ten || user.ten_dang_nhap}&background=random`)}
                      />
                   </div>
                   <div className="user-rating-info">
                      <strong>{user.ho_ten || user.ten_dang_nhap}</strong>
                      <span>Đánh giá của bạn</span>
                   </div>
                </div>

                <div className="rating-right">
                  <div className="stars-wrapper">
                    {[...Array(10)].map((_, i) => {
                      const n = i + 1;
                      return (
                        <Star
                          key={n}
                          size={28}
                          className={`star-icon ${n <= userRating ? "filled" : ""}`}
                          onClick={() => setUserRating(n)}
                          fill={n <= userRating ? "#fbbf24" : "none"}
                          color={n <= userRating ? "#fbbf24" : "#475569"}
                        />
                      );
                    })}
                    <span className="rating-score-text">{userRating}/10</span>
                  </div>

                  
                  <button onClick={handleRatingSubmit} className="btn-submit-rating">
                      Gửi đánh giá
                    </button>
                </div>
              </div>
            ) : (
              <div className="login-prompt">
                <p>Bạn cần đăng nhập để đánh giá phim này</p>
                <button onClick={() => navigate('/login')} className="btn-login-small">Đăng nhập ngay</button>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="section comment-section">
            <h3><MessageCircle className="icon-title" /> Bình luận </h3>

            {user ? (
              <div className="comment-form">
                <div className="comment-input-wrapper">
                  <div className="user-avatar">
                    <img 
                      src={user?.hinh_dai_dien_url ? `${user.hinh_dai_dien_url}?t=${Date.now()}` : `https://ui-avatars.com/api/?name=${user.ho_ten || user.ten_dang_nhap}&background=random`}
                      alt={user?.ten_dang_nhap}
                      onError={(e) => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${user.ho_ten || user.ten_dang_nhap}&background=random`)}
                    />
                  </div>
                  <div className="comment-box">
                    {replyTo && (
                      <div className="reply-badge">
                        <span>Trả lời <b>{replyTo.nguoiDung?.ho_ten || replyTo.TenDN}</b></span>
                        <button onClick={() => setReplyTo(null)}><X size={14} /></button>
                      </div>
                    )}
                    <textarea
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder="Chia sẻ suy nghĩ của bạn..."
                      rows={2}
                    />
                    <button onClick={handleCommentSubmit} className="btn-send-comment">
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="login-prompt">
                <p>Đăng nhập để tham gia thảo luận</p>
              </div>
            )}

            {/* Comments List */}
            <div className="comments-list">
              {comments.slice(0, visibleComments).map(c => (
                <div key={c.MaBinhLuan} className="comment-thread">
                  <div className="comment-main">
                    <div className="user-avatar">
                      <img 
                        src={c.nguoi_dung?.hinh_dai_dien_url ? `${c.nguoi_dung.hinh_dai_dien_url}?t=${Date.now()}` : `https://ui-avatars.com/api/?name=${c.nguoi_dung?.ho_ten || c.TenDN}&background=random`}
                        alt={c.TenDN}
                        onError={(e) => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${c.nguoi_dung?.ho_ten || c.TenDN}&background=random`)}
                      />
                    </div>
                    <div className="comment-content-wrapper">
                      <div className="comment-header">
                        <strong>{c.TenDN}</strong>
                        <span className="time-ago">{new Date(c.ThoiGian).toLocaleString("vi-VN")}</span>
                      </div>
                      <div className="comment-bubble">
                        <p>{c.NoiDung}</p>
                      </div>
                      <div className="comment-actions">
                        <button onClick={() => startReply(c)} className="btn-reply-text">
                          <Reply size={14} /> Trả lời
                        </button>
                        {user && c.TenDN === user.ten_dang_nhap && (
                          <button onClick={() => handleDeleteComment(c.MaBinhLuan)} className="btn-delete-text">
                            <Trash2 size={14} /> Xóa
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* replies */}
                  {c.replies?.length > 0 && (
                    <div className="replies-container">
                      {c.replies.map(r => (
                        <div key={r.MaBinhLuan} className="comment-reply">
                          <div className="user-avatar small">
                            <img 
                              src={r.nguoi_dung?.hinh_dai_dien_url ? `${r.nguoi_dung.hinh_dai_dien_url}?t=${Date.now()}` : `https://ui-avatars.com/api/?name=${r.nguoi_dung?.ho_ten || r.TenDN}&background=random`}
                              alt={r.TenDN}
                              onError={(e) => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${r.nguoi_dung?.ho_ten || r.TenDN}&background=random`)}
                            />
                          </div>
                          <div className="comment-content-wrapper">
                            <div className="comment-header">
                              <strong>{ r.TenDN}</strong>
                              <span className="time-ago">{new Date(r.ThoiGian).toLocaleString("vi-VN")}</span>
                            </div>
                            <div className="comment-bubble reply-bubble">
                              <p>{r.NoiDung}</p>
                            </div>
                            {user && r.TenDN === user.ten_dang_nhap && (
                              <button onClick={() => handleDeleteComment(r.MaBinhLuan)} className="btn-delete-text">
                                <Trash2 size={14} /> Xóa
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {visibleComments < comments.length && (
                <button onClick={showMore} className="btn-load-more-comments">
                  Xem thêm bình luận cũ hơn
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="detail-sidebar">
          <h3>Phim liên quan</h3>
          <div className="related-list">
            {relatedMovies.length > 0 ? (
              relatedMovies.map(m => (
                <div key={m.MaPhim} className="related-item" onClick={() => navigate(`/movie/${m.MaPhim}`)}>
                  <div className="related-poster">
                    <img src={m.HinhAnh} alt={m.TenPhim} />
                    <span className="related-score">{m.DanhGia || "N/A"}</span>
                  </div>
                  <div className="related-info">
                    <h4>{m.TenPhim}</h4>
                    <span>{m.NamPhatHanh}</span>
                  </div>
                </div>
              ))
            ) : (
              <p>(Đang cập nhật)</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
