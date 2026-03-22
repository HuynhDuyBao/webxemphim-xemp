import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Star, MessageCircle, Send, Reply, X, ThumbsUp, Share2 } from "lucide-react";
import movieService from "../api/movieService"; 
import { userService } from "../api/userService"; 
import { ratingService } from "../api/ratingService";
import { commentService } from "../api/commentService";
import { getAuth } from "../store/auth"; 
import { getImageUrl } from "../utils/imageUrl";
import VideoPlayer from "../components/VideoPlayer";
import './WatchMovie.css';

const WatchMovie = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // State Phim & Player
  const [movie, setMovie] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState(0);
  
  // State Bình luận & Đánh giá & Phim liên quan
  const [comments, setComments] = useState([]);
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [visibleComments, setVisibleComments] = useState(5);

  const debounceTimeout = useRef(null); 
  const { user } = useMemo(() => getAuth(), []);

  // --- 1. LOGIC PLAYER & HISTORY (GIỮ NGUYÊN) ---
  const saveProgressToHistory = useCallback((currentTime) => {
    if (!user || !selectedEpisode || !movie) return;
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(async () => {
        try {
            await userService.saveProgressToHistory({ 
                MaPhim: movie.MaPhim || id,
                MaTap: selectedEpisode.MaTap, 
                ThoiGianXem: currentTime,
            });
        } catch (error) { console.error(error); }
    }, 1000); 
  }, [user, movie, selectedEpisode, id]); 

  const handleEnded = useCallback(() => {
      if (movie?.PhanLoai !== 'Bộ' || !movie.episodes) return;
      const currentIndex = movie.episodes.findIndex(ep => ep.MaTap === selectedEpisode.MaTap);
      const nextEpisode = movie.episodes[currentIndex + 1];
      if (nextEpisode) setSelectedEpisode(nextEpisode);
  }, [movie, selectedEpisode]);

  // --- 2. LOGIC LOAD DATA TỔNG HỢP ---
  const loadFullData = async () => {
    try {
      setLoading(true);
      
      // Gọi song song các API cần thiết
      const [movieRes, commentsRes, ratingsRes, relatedRes] = await Promise.all([
        movieService.getMovie(id),
        commentService.getComments(id),
        user ? movieService.getRatings(id) : Promise.resolve(null),
        movieService.fetchRecommended() // Lấy phim đề xuất làm phim liên quan
      ]);

      // Xử lý Movie & Episode
      if (!movieRes) { setMovie(null); return; }
      setMovie(movieRes);

      // Xử lý chọn tập
      const tapParam = searchParams.get('tap');
      let initialEpisode = null;
      if (tapParam && movieRes.episodes?.length > 0) {
        initialEpisode = movieRes.episodes.find(ep => ep.MaTap === parseInt(tapParam)) || movieRes.episodes[0];
      } else if (movieRes.episodes?.length > 0) {
        initialEpisode = movieRes.episodes[0];
      } else if (movieRes.Link) {
        initialEpisode = { Link: movieRes.Link, TenTap: 'Full HD', MaTap: movieRes.MaPhim }; 
      }
      setSelectedEpisode(initialEpisode);

      // Xử lý Bình luận
      setComments(Array.isArray(commentsRes?.data) ? commentsRes.data : []);

      // Xử lý Đánh giá của User
      if (user && ratingsRes?.data) {
        const myRate = ratingsRes.data.find(r => r.TenDN === user.ten_dang_nhap);
        if (myRate) {
          setUserRating(myRate.SoDiem || 0);
          setRatingComment(myRate.BinhLuan || "");
        }
      }

      // Xử lý Phim liên quan (Lọc bỏ phim đang xem)
      const related = (relatedRes?.data || relatedRes || []).filter(m => m.MaPhim !== parseInt(id));
      setRelatedMovies(related.slice(0, 6)); // Lấy 6 phim

    } catch (err) {
      console.error("Lỗi load data:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- 3. LOGIC XỬ LÝ HISTORY RESUME ---
  useEffect(() => {
    const fetchHistory = async () => {
        if (!user || !selectedEpisode || !movie) return;
        try {
            const historyRes = await userService.getHistory(); 
            const lastView = historyRes.data.data?.find(item => item.MaTap === selectedEpisode.MaTap);
            if (lastView && lastView.ThoiGianXem > 5) setStartTime(lastView.ThoiGianXem);
            else setStartTime(0);
        } catch (e) { console.error(e); }
    };
    fetchHistory();
  }, [selectedEpisode, user, movie]);

  useEffect(() => {
    loadFullData();
    return () => { if (debounceTimeout.current) clearTimeout(debounceTimeout.current); };
  }, [id, searchParams]);

  // --- 4. HANDLERS BÌNH LUẬN & ĐÁNH GIÁ ---
  const handleRatingSubmit = async () => {
    if (!userRating) return alert("Vui lòng chọn số sao!");
    try {
      await ratingService.submitRating({ MaPhim: parseInt(id), so_diem: userRating, binh_luan: ratingComment });
      alert("Đánh giá thành công!");
      loadFullData(); // Reload để cập nhật
    } catch { alert("Lỗi đánh giá"); }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;
    try {
      await commentService.postComment({ MaPhim: id, NoiDung: commentText, parent_id: replyTo?.MaBinhLuan || null });
      setCommentText("");
      setReplyTo(null);
      // Refresh comment list only
      const res = await commentService.getComments(id);
      setComments(res.data || []);
    } catch { alert("Lỗi bình luận"); }
  };

  if (loading) return <div className="loading">Đang tải phim...</div>;
  if (!movie) return <div className="not-found">Không tìm thấy phim!</div>;

  return (
    <div className="watch-page">
      <div className="watch-container">
        
        {/* === CỘT TRÁI: PLAYER & NỘI DUNG === */}
        <div className="watch-main">
          {/* Header Navigation */}
          <div className="watch-header">
            <button className="back-btn" onClick={() => navigate(`/movie/${id}`)}>
                <ArrowLeft size={20} /> Quay lại
            </button>
            <h1 className="movie-title-header">{movie.TenPhim} - {selectedEpisode?.TenTap}</h1>
          </div>

          {/* Video Player */}
          <div className="player-wrapper">
            {selectedEpisode ? (
              <VideoPlayer 
                url={selectedEpisode.Link}
                poster={getImageUrl(movie.HinhAnh)}
                startTime={startTime}
                onProgress={saveProgressToHistory}
                onEnded={handleEnded}
                videoUid={selectedEpisode.video_uid}
              />
            ) : (
              <div className="no-episode">Chưa có tập phim để phát.</div>
            )}
          </div>

          {/* Movie Info Bar (Dưới Player) */}
          <div className="movie-info-bar">
             <div className="info-left">
                <h2 className="info-title">{movie.TenPhim}</h2>
                <div className="info-meta">
                    <span className="meta-item rating"><Star size={14} fill="#fbbf24" color="#fbbf24"/> {movie.DanhGia || 0}</span>
                    <span className="meta-item">{movie.NamPhatHanh}</span>
                    <span className="meta-item">{movie.quocgia?.TenQuocGia}</span>
                </div>
             </div>
             <div className="info-actions">
                <button className="action-btn"><ThumbsUp size={18}/> Thích</button>
                <button className="action-btn"><Share2 size={18}/> Chia sẻ</button>
             </div>
          </div>

          {/* Danh sách tập */}
          {movie.PhanLoai === 'Bộ' && movie.episodes?.length > 0 && (
            <div className="episode-section">
              <h3>Danh sách tập</h3>
              <div className="episodes-grid">
                {movie.episodes.map(ep => (
                  <button
                    key={ep.MaTap}
                    onClick={() => setSelectedEpisode(ep)}
                    className={`episode-btn ${selectedEpisode?.MaTap === ep.MaTap ? 'active' : ''}`}
                  >
                    {ep.TenTap}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="divider"></div>

          {/* === KHU VỰC ĐÁNH GIÁ & BÌNH LUẬN === */}
          <div className="interaction-section">
            
            {/* 1. Đánh giá */}
            <div className="rating-box">
                <h3>Đánh giá của bạn</h3>
                {user ? (
                    <div className="rating-input-area">
                        <div className="stars-select">
                            {[...Array(10)].map((_, i) => (
                                <Star key={i} size={24} 
                                    fill={i + 1 <= userRating ? "#fbbf24" : "none"} 
                                    color={i + 1 <= userRating ? "#fbbf24" : "#64748b"}
                                    onClick={() => setUserRating(i + 1)}
                                    className="star-cursor"
                                />
                            ))}
                            <span className="rating-number">{userRating}/10</span>
                        </div>
                        <button onClick={handleRatingSubmit} className="submit-rating-btn">Gửi đánh giá</button>
                    </div>
                ) : (
                    <p className="login-hint">Đăng nhập để đánh giá phim này.</p>
                )}
            </div>

            {/* 2. Bình luận */}
            <div className="comment-box-watch">
                <h3>Bình luận </h3>
                
                {/* Form nhập */}
                {user && (
                    <div className="comment-input-row">
                        <img src={user.hinh_dai_dien_url || `https://ui-avatars.com/api/?name=${user.ho_ten}`} alt="Avatar" className="user-avatar-small"/>
                        <div className="input-wrapper">
                            {replyTo && (
                                <div className="reply-tag">
                                    Trả lời <b>{replyTo.TenDN}</b> <X size={12} onClick={() => setReplyTo(null)}/>
                                </div>
                            )}
                            <textarea 
                                placeholder="Viết bình luận..." 
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                            />
                            <button onClick={handleCommentSubmit}><Send size={16}/></button>
                        </div>
                    </div>
                )}

                {/* List bình luận */}
                <div className="comments-list-watch">
                    {comments.slice(0, visibleComments).map(c => (
                        <div key={c.MaBinhLuan} className="comment-item">
                            <img src={c.nguoi_dung?.hinh_dai_dien_url || `https://ui-avatars.com/api/?name=${c.TenDN}`} alt="Avt" className="comment-avatar"/>
                            <div className="comment-content">
                                <div className="comment-header">
                                    <span className="username">{c.TenDN}</span>
                                    <span className="time">{new Date(c.ThoiGian).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <p className="comment-text">{c.NoiDung}</p>
                                {user && <button className="reply-btn" onClick={() => {
                                    setReplyTo(c);
                                    setCommentText(`@${c.TenDN} `);
                                    document.querySelector('.comment-input-row textarea')?.focus();
                                }}><Reply size={12}/> Trả lời</button>}
                                
                                {/* Replies */}
                                {c.replies?.map(r => (
                                    <div key={r.MaBinhLuan} className="reply-item">
                                        <div className="reply-header">
                                            <span className="username">{r.TenDN}</span>
                                            <div className="user-avatar small">
                                              <img 
                                                src={r.nguoi_dung?.hinh_dai_dien_url ? `${r.nguoi_dung.hinh_dai_dien_url}?t=${Date.now()}` : `https://ui-avatars.com/api/?name=${r.nguoi_dung?.ho_ten || r.TenDN}&background=random`}
                                                alt={r.TenDN}
                                                onError={(e) => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${r.nguoi_dung?.ho_ten || r.TenDN}&background=random`)}
                                              />
                                              </div>
                                        </div>
                                        <p className="comment-text">{r.NoiDung}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {visibleComments < comments.length && (
                        <button className="load-more-cmt" onClick={() => setVisibleComments(prev => prev + 5)}>Xem thêm bình luận</button>
                    )}
                </div>
            </div>
          </div>
        </div>

        {/* === CỘT PHẢI: SIDEBAR PHIM LIÊN QUAN === */}
        <div className="watch-sidebar">
            <h3 className="sidebar-title">Có thể bạn thích</h3>
            <div className="related-list">
                {relatedMovies.map(m => (
                    <div key={m.MaPhim} className="related-item" onClick={() => navigate(`/movie/${m.MaPhim}`)}>
                        <div className="related-poster">
                            <img src={getImageUrl(m.HinhAnh)} alt={m.TenPhim} />
                            <span className="related-score">{m.DanhGia}</span>
                        </div>
                        <div className="related-info">
                            <h4>{m.TenPhim}</h4>
                            <span>{m.NamPhatHanh}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};

export default WatchMovie;