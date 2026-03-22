// src/pages/admin/AddMovie.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as tus from "tus-js-client";
import './AdminCommon.css';
import {
  fetchGenres,
  fetchCountries,
  createMovie,
} from "../../api/movieService";
import axios from "../../api/api";

const AddMovie = () => {
  const navigate = useNavigate();

  const [genres, setGenres] = useState([]);
  const [countries, setCountries] = useState([]);

  const [form, setForm] = useState({
    TenPhim: "",
    TieuDe: "",
    MoTa: "",
    NamPhatHanh: "",
    DanhGia: "",
    PhanLoai: "Lẻ",
    TinhTrang: "Đang chiếu",
    MaQuocGia: "",
    MaTheLoai: [],
    HinhAnh: "",
    fileImage: null,
    fileBanner: null, // Thêm state cho banner
  });

  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [finalHlsUrl, setFinalHlsUrl] = useState("");

  const [useFile, setUseFile] = useState(false);
  const [useBannerFile, setUseBannerFile] = useState(true); // Mặc định upload file cho banner
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setGenres(await fetchGenres());
      setCountries(await fetchCountries());
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    
    // Kiểm tra kích thước (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (f.size > maxSize) {
      alert('Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 50MB.');
      e.target.value = '';
      return;
    }
    
    // Kiểm tra định dạng
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(f.type)) {
      alert('Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)!');
      e.target.value = '';
      return;
    }
    
    setForm((p) => ({ ...p, fileImage: f }));
  };

  const handleBannerChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    
    // Kiểm tra kích thước (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (f.size > maxSize) {
      alert('Ảnh banner quá lớn! Vui lòng chọn ảnh nhỏ hơn 50MB.');
      e.target.value = '';
      return;
    }
    
    setForm((p) => ({ ...p, fileBanner: f }));
  };

  const toggleGenre = (id) => {
    setForm((prev) => ({
      ...prev,
      MaTheLoai: prev.MaTheLoai.includes(id)
        ? prev.MaTheLoai.filter((g) => g !== id)
        : [...prev.MaTheLoai, id],
    }));
  };

  // UPLOAD CLOUDFLARE STREAM – QUA PROXY (TRÁNH CORS)
  const uploadVideoToCloudflare = async () => {
    if (!videoFile) return "";

    setUploading(true);
    setUploadProgress(0);

    try {
      const res = await axios.post('/admin/stream-upload-url');
      const { tusEndpoint, hls_url } = res.data;
      
      console.log("=== UPLOAD QUA PROXY ===", { 
        fileSize: `${(videoFile.size/1024/1024).toFixed(2)}MB`
      });

      // UPLOAD QUA LARAVEL PROXY (tránh CORS)
      return await uploadViaProxy(tusEndpoint, hls_url);

    } catch (err) {
      console.error(err);
      setUploading(false);
      alert("Lỗi lấy link upload: " + (err.response?.data?.message || err.message));
      return "";
    }
  };

  // Upload qua Laravel proxy (tránh CORS)
  const uploadViaProxy = async (uploadUrl, hls_url) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('uploadURL', uploadUrl);

      const xhr = new XMLHttpRequest();
      const token = localStorage.getItem('token');

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percent);
          console.log(`Upload: ${percent}% (${(e.loaded/1024/1024).toFixed(1)}MB/${(e.total/1024/1024).toFixed(1)}MB)`);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setFinalHlsUrl(hls_url);
          console.log("✅ Upload SUCCESS");
          alert("✅ Upload thành công! Video đã sẵn sàng.");
          setUploading(false);
          resolve(hls_url);
        } else {
          console.error("❌ Upload failed:", xhr.status, xhr.responseText);
          setUploading(false);
          reject(new Error(`Upload thất bại: ${xhr.status} - ${xhr.responseText}`));
        }
      });

      xhr.addEventListener('error', () => {
        console.error("❌ Network error");
        setUploading(false);
        reject(new Error("Lỗi kết nối mạng"));
      });

      xhr.addEventListener('abort', () => {
        console.log("⚠️ Upload cancelled");
        setUploading(false);
        reject(new Error("Upload bị hủy"));
      });

      xhr.open('POST', 'http://127.0.0.1:8000/api/admin/upload-video-proxy');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
      
      window.currentUpload = xhr;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.TenPhim) return alert("Nhập tên phim ");

    setSubmitting(true);

    try {
      // Upload ảnh lên Cloudflare nếu chọn file
      let imageUrl = form.HinhAnh;
      
      if (useFile && form.fileImage) {
        const formData = new FormData();
        formData.append('poster_file', form.fileImage);
        
        const uploadRes = await axios.post('/admin/upload-poster', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (uploadRes.data.success) {
          imageUrl = uploadRes.data.image_url;
        } else {
          throw new Error('Upload ảnh thất bại');
        }
      }

      // Tạo FormData để gửi lên API createMovie (vì có fileBanner)
      // Lưu ý: API createMovie hiện tại nhận JSON, nhưng để gửi fileBanner ta cần chuyển sang FormData
      // Tuy nhiên, MovieController::store đã được sửa để nhận 'bannerFile'
      // Nhưng hàm createMovie trong movieService có thể đang gửi JSON.
      // Ta sẽ sửa logic ở đây: Gửi FormData trực tiếp thay vì gọi createMovie(payload) nếu có file.
      
      // Nhưng để đơn giản và nhất quán, ta sẽ dùng FormData cho tất cả
      const formData = new FormData();
      formData.append('TenPhim', form.TenPhim);
      if (form.TieuDe) formData.append('TieuDe', form.TieuDe);
      if (form.MoTa) formData.append('MoTa', form.MoTa);
      if (form.NamPhatHanh) formData.append('NamPhatHanh', form.NamPhatHanh);
      if (form.DanhGia) formData.append('DanhGia', form.DanhGia);
      formData.append('PhanLoai', form.PhanLoai);
      formData.append('TinhTrang', form.TinhTrang);
      if (form.MaQuocGia) formData.append('MaQuocGia', form.MaQuocGia);
      
      // MaTheLoai là mảng, cần append từng cái
      form.MaTheLoai.forEach(id => formData.append('MaTheLoai[]', id));
      
      formData.append('HinhAnh', imageUrl); // URL poster (đã upload hoặc nhập tay)
      
      if (form.fileBanner) {
        formData.append('bannerFile', form.fileBanner);
      }

      // Gọi API trực tiếp thay vì qua movieService.createMovie để kiểm soát FormData
      const res = await axios.post('/phim', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newMovie = res.data.movie || res.data.data;
      alert("THÊM PHIM THÀNH CÔNG!");
      
      // Broadcast event to refresh movie list
      window.dispatchEvent(new Event('movieCreated'));
      
      // Extract movie ID and navigate to episodes page
      const movieId = newMovie?.MaPhim || newMovie?.id;
      if (movieId) {
        // Tăng delay để đảm bảo API đã sync dữ liệu
        setTimeout(() => navigate(`/admin/movies/${movieId}/episodes`), 2000);
      } else {
        setTimeout(() => navigate("/admin"), 1000);
      }
    } catch (err) {
      console.error('Lỗi thêm phim:', err);
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-layout">
      <button className="btn-back" onClick={() => navigate("/admin")}>
        ← Quay lại Dashboard
      </button>

      <div className="admin-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <h1 className="admin-title">➕ Thêm Phim Mới</h1>
          <div style={{ fontSize: '0.9rem', color: '#888' }}>
          
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="admin-add-movie-grid">
            {/* LEFT COLUMN */}
            <div className="admin-movie-section">
              <h3 className="section-header">📝 Thông Tin Cơ Bản</h3>
              <div className="form-group">
                <label className="form-label">Tên Phim <span className="required">*</span></label>
                <input name="TenPhim" className="admin-input" placeholder="Nhập tên phim..." onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label className="form-label">Tiêu Đề (Tên gốc)</label>
                <input name="TieuDe" className="admin-input" placeholder="Tên tiếng Anh hoặc tên gốc..." onChange={handleChange} />
              </div>

              <div className="form-group">
                <label className="form-label">Mô Tả</label>
                <textarea name="MoTa" className="admin-input" placeholder="Mô tả nội dung phim..." style={{ minHeight: 100, resize: 'vertical' }} onChange={handleChange} />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Năm Phát Hành</label>
                  <input name="NamPhatHanh" type="number" className="admin-input" placeholder="2024" onChange={handleChange} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Quốc Gia</label>
                  <select name="MaQuocGia" className="admin-input" onChange={handleChange} value={form.MaQuocGia}>
                    <option value="">-- Chọn quốc gia --</option>
                    {(Array.isArray(countries) ? countries : countries?.data || []).map((c) => (
                      <option key={c.MaQuocGia} value={c.MaQuocGia}>{c.TenQuocGia}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Phân Loại</label>
                  <select name="PhanLoai" className="admin-input" onChange={handleChange} value={form.PhanLoai}>
                    <option value="Lẻ">Phim lẻ</option>
                    <option value="Bộ">Phim bộ</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Tình Trạng</label>
                  <select name="TinhTrang" className="admin-input" onChange={handleChange} value={form.TinhTrang}>
                    <option value="Đang chiếu">Đang chiếu</option>
                    <option value="Sắp chiếu">Sắp chiếu</option>
                    <option value="Đã kết thúc">Đã kết thúc</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Thể Loại</label>
                <div className="genre-grid">
                  {(Array.isArray(genres) ? genres : genres?.data || []).map((g) => (
                    <label key={g.MaTheLoai} className="genre-checkbox">
                      <input
                        type="checkbox"
                        checked={form.MaTheLoai.includes(g.MaTheLoai)}
                        onChange={() => toggleGenre(g.MaTheLoai)}
                      />
                      <span>{g.TenTheLoai}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="admin-movie-section">
              <h3 className="section-header">🎬 Media & Upload</h3>
              
              {/* VIDEO UPLOAD */}
              <div className="upload-box video-upload">
                <label className="form-label">
                  <span style={{ color: '#00ff88' }}>🎥</span> Video (Cloudflare Stream)
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files[0])}
                  className="file-input"
                />
                {uploading && (
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${uploadProgress}%` }}>
                        {uploadProgress}%
                      </div>
                    </div>
                    <p className="upload-text">Đang upload video...</p>
                  </div>
                )}
                {finalHlsUrl && (
                  <div className="upload-success">✅ Video đã sẵn sàng!</div>
                )}
              </div>

              {/* POSTER UPLOAD */}
              <div className="upload-box">
                <label className="form-label">
                  <span style={{ color: '#ffd700' }}>🖼️</span> Hình Ảnh Poster
                </label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input type="radio" checked={!useFile} onChange={() => setUseFile(false)} />
                    <span>Nhập URL</span>
                  </label>
                  <label className="radio-label">
                    <input type="radio" checked={useFile} onChange={() => setUseFile(true)} />
                    <span>Upload File</span>
                  </label>
                </div>
                {!useFile ? (
                  <input name="HinhAnh" className="admin-input" placeholder="https://image-url.com/poster.jpg" onChange={handleChange} value={form.HinhAnh} />
                ) : (
                  <input type="file" accept="image/*" onChange={handleFileChange} className="file-input" />
                )}
              </div>

              {/* BANNER UPLOAD */}
              <div className="upload-box">
                <label className="form-label">
                  <span style={{ color: '#00ccff' }}>🎞️</span> Ảnh Banner / Cover
                </label>
                <input type="file" accept="image/*" onChange={handleBannerChange} className="file-input" />
                <p className="hint-text">Khuyên dùng ảnh ngang, độ phân giải 1920x1080 trở lên</p>
              </div>

              {/* ACTIONS */}
              <div className="form-actions">
                <button type="submit" className="admin-btn" disabled={submitting || uploading}>
                  {submitting ? "⏳ Đang lưu..." : "✅ THÊM PHIM"}
                </button>
                <button type="button" className="admin-btn cancel" onClick={() => navigate("/admin")}>
                  ❌ Hủy
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMovie;