import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MovieCard from "../components/MovieCard";
import FeaturedSlider from "../components/FeaturedSlider";
import movieService from "../api/movieService";    
import '../components/css/MovieCard.css';
import './Home.css'; 

// 1. CẤU HÌNH CÁC CHỦ ĐỀ BẠN MUỐN HIỂN THỊ
// Sử dụng từ khóa để map đúng thể loại từ API
const TOPIC_GROUPS = [
  { 
    id: 'action_adventure',
    title: "Bom Tấn Hành Động", 
    keywords: ['hành động', 'phiêu lưu', 'võ thuật', 'chiến tranh', 'action', 'adventure'],
    genreIds: [], 
    gradient: "topic-gradient-0" 
  },
  { 
    id: 'romance',
    title: "Tình Cảm & Lãng Mạn", 
    keywords: ['tình cảm', 'lãng mạn', 'tâm lý', 'romance', 'drama'],
    genreIds: [],
    gradient: "topic-gradient-5" 
  },
  { 
    id: 'horror',
    title: "Kinh Dị & Hồi Hộp", 
    keywords: ['kinh dị', 'ma', 'hồi hộp', 'bí ẩn', 'horror', 'thriller', 'mystery'],
    genreIds: [],
    gradient: "topic-gradient-4" 
  },
  { 
    id: 'comedy',
    title: "Hài Hước & Gia Đình", 
    keywords: ['hài', 'gia đình', 'học đường', 'comedy', 'family'],
    genreIds: [],
    gradient: "topic-gradient-3" 
  },
  { 
    id: 'animation',
    title: "Hoạt Hình & Anime", 
    keywords: ['hoạt hình', 'anime', 'cartoon', 'animation'],
    genreIds: [],
    gradient: "topic-gradient-1" 
  }
];

const Home = () => {
  const [allMovies, setAllMovies] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const [recMovies, setRecMovies] = useState([]);
  
  // State cho phần lọc theo CHỦ ĐỀ (Thay vì thể loại lẻ)
  const [topics, setTopics] = useState([]); // Danh sách chủ đề đã xử lý
  const [selectedTopic, setSelectedTopic] = useState(null); // Chủ đề đang chọn
  const [genreMovies, setGenreMovies] = useState([]);
  const [loadingGenreMovies, setLoadingGenreMovies] = useState(false);
  
  // State phân trang
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true); // Kiểm soát nút Xem thêm
  const [loadingMore, setLoadingMore] = useState(false);

  const genreRowRef = useRef(null);
  const scrollGenre = (direction) => {
      if (genreRowRef.current) {
        const { current } = genreRowRef;
        const scrollAmount = direction === 'left' ? -current.offsetWidth + 200 : current.offsetWidth - 200;
        current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
  };

  // 1. Load dữ liệu ban đầu
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [allRes, topRes, recRes, genresRes] = await Promise.all([
          movieService.fetchMovies(1, 18), // Trang 1, 18 phim
          movieService.fetchTopViewed(),
          movieService.fetchRecommended(),
          movieService.fetchGenres()
        ]);

        // Xử lý response linh hoạt (Laravel paginate trả về .data, hoặc array thường)
        const moviesData = allRes.data?.data || allRes.data || allRes || [];
        
        setAllMovies(moviesData);
        setTopMovies(Array.isArray(topRes) ? topRes : []);
        setRecMovies(Array.isArray(recRes) ? recRes : []);
        
        // XỬ LÝ: LẤY TOÀN BỘ THỂ LOẠI VÀ GÁN VÀO CÁC CHỦ ĐỀ
        const rawGenres = genresRes.data?.data || genresRes.data || genresRes || [];
        console.log("Raw Genres from API:", rawGenres);
        
        const processedTopics = TOPIC_GROUPS.map((group) => {
            // Lọc các thể loại khớp với từ khóa của chủ đề
            const matchedGenres = rawGenres.filter(g => {
                const genreName = (g.TenTheLoai || g.name || "").toLowerCase();
                return group.keywords.some(keyword => genreName.includes(keyword));
            });
            
            const assignedIds = matchedGenres.map(g => g.MaTheLoai);
            
            console.log(`Topic: ${group.title}, Matched Genres:`, matchedGenres.map(g => g.TenTheLoai));

            return {
                ...group,
                genreIds: assignedIds
            };
        }).filter(topic => topic.genreIds.length > 0);

        setTopics(processedTopics);
        
        // Mặc định chọn chủ đề đầu tiên nếu có
        if (processedTopics.length > 0) {
            setSelectedTopic(processedTopics[0]);
        }

        // Nếu trang đầu tiên đã ít hơn 18 phim -> Hết phim luôn -> Ẩn nút
        if (moviesData.length < 18) {
            setHasMore(false);
        }

      } catch (err) {
        console.error("Lỗi load trang chủ:", err);
      }
    };

    loadInitialData();
  }, []);

  // Effect load phim theo CHỦ ĐỀ khi selectedTopic thay đổi
  useEffect(() => {
    if (!selectedTopic || !selectedTopic.genreIds || selectedTopic.genreIds.length === 0) {
        console.warn("[Home] No topic selected or no genre IDs available");
        setGenreMovies([]);
        return;
    }
    
    const fetchTopicMovies = async () => {
        setLoadingGenreMovies(true);
        try {
            console.log("[Home] === FETCHING MOVIES FOR TOPIC ===");
            console.log("[Home] Topic:", selectedTopic.title);
            console.log("[Home] Genre IDs:", selectedTopic.genreIds);
            
            // Gửi mảng ID (genreIds) lên API
            const res = await movieService.fetchMovies(1, 12, { genres: selectedTopic.genreIds });
            
            console.log("[Home] Full Response from fetchMovies:", res);
            
            // Xử lý response: thử nhiều cấu trúc khác nhau
            let movies = [];
            if (Array.isArray(res)) {
                movies = res;
            } else if (res.data) {
                if (Array.isArray(res.data.data)) {
                    movies = res.data.data;
                } else if (Array.isArray(res.data)) {
                    movies = res.data;
                }
            }
            
            console.log("[Home] Extracted movies array:", movies);
            console.log("[Home] Movies count:", movies.length);
            
            setGenreMovies(movies);
        } catch (err) {
            console.error("[Home] Error fetching topic movies:", err);
            setGenreMovies([]);
        } finally {
            setLoadingGenreMovies(false);
        }
    };
    
    fetchTopicMovies();
  }, [selectedTopic]);

  // 2. SỬA HÀM LOAD MORE (LỌC TRÙNG + ẨN NÚT)
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await movieService.fetchMovies(nextPage, 18);
      
      // Lấy mảng phim mới từ response
      const newMovies = res.data?.data || res.data || res || [];
      
      if (newMovies.length === 0) {
        setHasMore(false); // Hết phim -> Ẩn nút
      } else {
        setAllMovies(prev => {
            // LỌC TRÙNG LẶP: Chỉ lấy phim có MaPhim chưa tồn tại trong danh sách cũ
            const existingIds = new Set(prev.map(m => m.MaPhim));
            const uniqueMovies = newMovies.filter(m => !existingIds.has(m.MaPhim));
            
            // Nếu lọc xong mà không còn phim nào mới -> Hết phim -> Ẩn nút
            if (uniqueMovies.length === 0) {
                setHasMore(false);
                return prev;
            }

            return [...prev, ...uniqueMovies];
        });

        setPage(nextPage);

        // Nếu số lượng phim trả về ít hơn limit (18) -> Chắc chắn là trang cuối -> Ẩn nút
        if (newMovies.length < 18) {
            setHasMore(false);
        }
      }
    } catch (err) {
      console.error("Lỗi load more:", err);
      setHasMore(false); // Gặp lỗi thì ẩn nút luôn cho an toàn
    } finally {
      setLoadingMore(false);
    }
  };

  const MovieRow = ({ title, movies }) => {
    const rowRef = useRef(null);

    const scroll = (direction) => {
      if (rowRef.current) {
        const { current } = rowRef;
        const scrollAmount = direction === 'left' ? -current.offsetWidth + 200 : current.offsetWidth - 200;
        current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    };

    return (
      <section className="movie-section">
        <h2 className="section-title">{title}</h2>
        <div className="movie-row-container">
          <button 
            className="scroll-btn left" 
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="movie-row" ref={rowRef}>
            {movies.length > 0 ? (
              movies.map(movie => (
                <div key={movie.MaPhim} className="movie-row-item">
                  <MovieCard movie={movie} />
                </div>
              ))
            ) : (
              <p className="loading-text">Đang cập nhật...</p>
            )}
          </div>

          <button 
            className="scroll-btn right" 
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </section>
    );
  };

  return (
    <div className="home-page">
      <FeaturedSlider />

      <div className="main-layout">
        <MovieRow title="🔥 Phim Đề Xuất Hôm Nay" movies={recMovies} />
        <MovieRow title="🏆 Top Lượt Xem" movies={topMovies} />

        <section className="movie-section">
          <h2 className="section-title">Bạn đang quan tâm gì?</h2>
          
          <div className="topic-section">
            <div className="topic-list">
              {topics.map((topic) => (
                <div 
                  key={topic.id}
                  className={`topic-card ${topic.gradient} ${selectedTopic?.id === topic.id ? 'active' : ''}`}
                  onClick={() => setSelectedTopic(topic)}
                >
                  <h3>{topic.title}</h3>
                  <span>Xem chủ đề <ChevronRight size={14} /></span>
                </div>
              ))}
            </div>
          </div>

          <div className="movie-row-container">
             <button 
                className="scroll-btn left" 
                onClick={() => scrollGenre('left')}
                aria-label="Scroll left"
              >
                <ChevronLeft size={24} />
              </button>

              <div className="movie-row" ref={genreRowRef}>
                {loadingGenreMovies ? (
                    <div style={{padding: '40px', width: '100%', textAlign: 'center', color: '#94a3b8'}}>Đang tải phim...</div>
                ) : genreMovies.length > 0 ? (
                  genreMovies.map(movie => (
                    <div key={movie.MaPhim} className="movie-row-item">
                      <MovieCard movie={movie} />
                    </div>
                  ))
                ) : (
                  <p className="loading-text" style={{width: '100%'}}>Không có phim nào thuộc thể loại này.</p>
                )}
              </div>

              <button 
                className="scroll-btn right" 
                onClick={() => scrollGenre('right')}
                aria-label="Scroll right"
              >
                <ChevronRight size={24} />
              </button>
          </div>
        </section>

        <section className="movie-section">
          <h2 className="section-title">🎬 Tất Cả Phim Mới Cập Nhật</h2>
          <div className="movie-grid-container">
            {allMovies.map(movie => (
              <MovieCard key={movie.MaPhim} movie={movie} />
            ))}
          </div>

          {/* Nút Load More: Chỉ hiện khi hasMore = true */}
          {hasMore ? (
            <div className="load-more-container">
              <button 
                className="btn-load-more" 
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Đang tải..." : "Xem thêm phim mới"}
              </button>
            </div>
          ) : (
            <div className="no-more-text" style={{textAlign: 'center', marginTop: '30px', color: '#777'}}>
              Bạn đã xem hết danh sách phim.
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default Home;