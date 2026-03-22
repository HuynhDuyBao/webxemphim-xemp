import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import './AdminCommon.css'; // Sử dụng lại CSS của trang AddMovie
import {
  fetchGenres,
  fetchCountries,
  getMovie,      // API lấy chi tiết
  updateMovie,   // API cập nhật
} from "../../api/movieService";
import axios from "../../api/api";
import { getImageUrl } from "../../utils/imageUrl";

const EditMovie = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State dữ liệu dropdown
  const [genres, setGenres] = useState([]);
  const [countries, setCountries] = useState([]);

  // State Form
  const [form, setForm] = useState({
    TenPhim: "",
    TieuDe: "",
    MoTa: "",
    NamPhatHanh: "",
    PhanLoai: "Lẻ",
    TinhTrang: "Đang chiếu",
    MaQuocGia: "",
    MaTheLoai: [], // Mảng ID thể loại [1, 2, 3]
    HinhAnh: "",
    HinhAnhBanner: "", // Thêm trường banner
    fileImage: null,
    fileBanner: null, // Thêm file banner
  });

  const [useFile, setUseFile] = useState(false);
  const [useBannerFile, setUseBannerFile] = useState(true); // Mặc định upload file cho banner
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 1. LOAD DỮ LIỆU BAN ĐẦU
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [genreRes, countryRes, movieRes] = await Promise.all([
          fetchGenres(),
          fetchCountries(),
          getMovie(id)
        ]);

        // Xử lý danh sách thể loại và quốc gia
        // API của bạn trả về mảng trực tiếp hoặc object {data: [...]}
        const genreList = Array.isArray(genreRes) ? genreRes : (genreRes.data || []);
        const countryList = Array.isArray(countryRes) ? countryRes : (countryRes.data || []);
        
        setGenres(genreList);
        setCountries(countryList);

        // Đổ dữ liệu phim vào Form
        if (movieRes) {
            // Xử lý danh sách thể loại của phim (API thường trả về mảng object)
            const selectedGenres = movieRes.theloai 
                ? movieRes.theloai.map(g => g.MaTheLoai) 
                : [];

            setForm({
                TenPhim: movieRes.TenPhim || "",
                TieuDe: movieRes.TieuDe || "",
                MoTa: movieRes.MoTa || "",
                NamPhatHanh: movieRes.NamPhatHanh || "",
                PhanLoai: movieRes.PhanLoai || "Lẻ",
                TinhTrang: movieRes.TinhTrang || "Đang chiếu",
                MaQuocGia: movieRes.MaQuocGia || "",
                HinhAnh: movieRes.HinhAnh || "",
                HinhAnhBanner: movieRes.HinhAnhBanner || "", // Load banner cũ
                MaTheLoai: selectedGenres,
                fileImage: null,
                fileBanner: null
            });
            
            // Tự động chọn chế độ nhập URL nếu ảnh cũ là link online
            if (movieRes.HinhAnh && movieRes.HinhAnh.startsWith('http')) {
                setUseFile(false);
            }
        }
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
        alert("Không thể tải thông tin phim!");
        navigate('/admin');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    
    // Kiểm tra kích thước (2MB)
    const maxSize = 2 * 1024 * 1024;
    if (f.size > maxSize) {
      alert('Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 2MB.');
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

  // Toggle chọn thể loại
  const toggleGenre = (genreId) => {
    setForm((prev) => {
        const currentGenres = prev.MaTheLoai;
        if (currentGenres.includes(genreId)) {
            return { ...prev, MaTheLoai: currentGenres.filter(id => id !== genreId) };
        } else {
            return { ...prev, MaTheLoai: [...currentGenres, genreId] };
        }
    });
  };

  // 2. XỬ LÝ UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Upload ảnh mới lên Cloudflare nếu chọn file
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

      // Chuyển sang FormData để gửi cả fileBanner (nếu có)
      // API updateMovie nhận JSON, nhưng ta cần gửi FormData nếu có file.
      // Ta sẽ gọi axios.post với _method=PUT hoặc axios.post('/phim/{id}?_method=PUT') 
      // hoặc axios.post('/phim/{id}') nếu route hỗ trợ POST update (Laravel resource route thường là PUT/PATCH)
      // Tuy nhiên, để gửi file qua PUT method trong Laravel/PHP thường gặp vấn đề.
      // Cách tốt nhất là dùng POST với _method = PUT trong FormData.

      const formData = new FormData();
      formData.append('_method', 'PUT'); // Trick để Laravel hiểu là PUT request
      
      formData.append('TenPhim', form.TenPhim);
      if (form.TieuDe) formData.append('TieuDe', form.TieuDe);
      if (form.MoTa) formData.append('MoTa', form.MoTa);
      if (form.NamPhatHanh) formData.append('NamPhatHanh', form.NamPhatHanh);
      if (form.PhanLoai) formData.append('PhanLoai', form.PhanLoai);
      if (form.TinhTrang) formData.append('TinhTrang', form.TinhTrang);
      if (form.MaQuocGia) formData.append('MaQuocGia', form.MaQuocGia);
      
      // MaTheLoai
      form.MaTheLoai.forEach(id => formData.append('MaTheLoai[]', id));
      
      // Ảnh Poster
      formData.append('HinhAnh', imageUrl);

      // Ảnh Banner (nếu có file mới)
      if (form.fileBanner) {
        formData.append('bannerFile', form.fileBanner);
      } else if (form.HinhAnhBanner) {
         // Nếu không đổi file, gửi lại đường dẫn cũ (hoặc không gửi cũng được, tùy backend)
         formData.append('HinhAnhBanner', form.HinhAnhBanner);
      }

      // Gọi API update trực tiếp
      await axios.post(`/phim/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert("CẬP NHẬT PHIM THÀNH CÔNG!");
      navigate("/admin"); 
      
    } catch (err) {
      console.error(err);
      alert("Lỗi cập nhật: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="admin-layout">Đang tải dữ liệu...</div>;

  return (
    <div className="admin-layout">
      <button className="btn-back" onClick={() => navigate("/admin")}>
        Quay lại
      </button>

      <div className="admin-content">
        <h1 className="admin-title">Chỉnh Sửa Phim: {form.TenPhim}</h1>

        <form className="admin-form" onSubmit={handleSubmit}>
          {/* Tên và Tiêu đề */}
          <input name="TenPhim" className="admin-input" placeholder="Tên phim" value={form.TenPhim} onChange={handleChange} required />
          <input name="TieuDe" className="admin-input" placeholder="Tiêu đề tiếng Anh" value={form.TieuDe} onChange={handleChange} />
          
          {/* Mô tả */}
          <textarea name="MoTa" className="admin-input" placeholder="Mô tả phim" style={{ minHeight: 100 }} value={form.MoTa} onChange={handleChange} />

          {/* Thông tin phụ */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "10px 0" }}>
            <input name="NamPhatHanh" type="number" className="admin-input" placeholder="Năm PH" value={form.NamPhatHanh} onChange={handleChange} style={{ width: 150 }} />
            
            <select name="PhanLoai" className="admin-input" onChange={handleChange} value={form.PhanLoai}>
              <option value="Lẻ">Phim lẻ</option>
              <option value="Bộ">Phim bộ</option>
            </select>

            <select name="TinhTrang" className="admin-input" onChange={handleChange} value={form.TinhTrang}>
              <option value="Đang chiếu">Đang chiếu</option>
              <option value="Sắp chiếu">Sắp chiếu</option>
              <option value="Đã kết thúc">Đã kết thúc</option>
            </select>

            <select name="MaQuocGia" className="admin-input" onChange={handleChange} value={form.MaQuocGia}>
              <option value="">-- Chọn Quốc gia --</option>
              {countries.map((c) => (
                <option key={c.MaQuocGia} value={c.MaQuocGia}>
                  {c.TenQuocGia}
                </option>
              ))}
            </select>
          </div>

          {/* Chọn Thể loại */}
          <div style={{ marginTop: 10 }}>
            <label style={{ color: "#ffd700", fontWeight: 600 }}>Thể loại</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
              {genres.map((g) => (
                <label key={g.MaTheLoai} style={{ display: "flex", alignItems: "center", gap: 6, color: '#fff', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.MaTheLoai.includes(g.MaTheLoai)}
                    onChange={() => toggleGenre(g.MaTheLoai)}
                  />
                  {g.TenTheLoai}
                </label>
              ))}
            </div>
          </div>

          {/* Ảnh Poster */}
          <div style={{ marginTop: 20 }}>
            <label style={{ color: "#ffd700", fontWeight: 600 }}>Hình ảnh poster</label>
            <div style={{ display: "flex", gap: 20, marginTop: 8, color: '#fff' }}>
              <label><input type="radio" checked={!useFile} onChange={() => setUseFile(false)} /> Dùng URL</label>
              <label><input type="radio" checked={useFile} onChange={() => setUseFile(true)} /> Upload File</label>
            </div>

            {!useFile ? (
              <input name="HinhAnh" className="admin-input" placeholder="Link ảnh (https://...)" onChange={handleChange} value={form.HinhAnh} />
            ) : (
              <input type="file" accept="image/*" onChange={handleFileChange} style={{color: '#fff', marginTop: 5}} />
            )}
            
            {/* Preview ảnh */}
            {form.HinhAnh && !useFile && (
                <div style={{marginTop: 10}}>
                    <img src={getImageUrl(form.HinhAnh)} alt="Preview" style={{height: 150, borderRadius: 5, objectFit: 'cover'}} onError={(e) => e.target.style.display='none'} />
                </div>
            )}
          </div>

          {/* Ảnh Banner / Cover */}
          <div style={{ marginTop: 20, padding: 15, background: '#1e293b', borderRadius: 8, border: '1px solid #334155' }}>
            <label style={{ color: "#38bdf8", fontWeight: 600, fontSize: '16px', display: 'block', marginBottom: 10 }}>
              Ảnh Banner / Cover (Hiển thị Slide & Chi tiết)
            </label>
            
            <div style={{ display: "flex", gap: 20, marginBottom: 10 }}>
               {/* Hiện tại chỉ hỗ trợ upload file cho banner để đơn giản */}
               <span style={{color: '#94a3b8', fontSize: '0.9rem'}}>Khuyên dùng ảnh ngang (Landscape), độ phân giải cao (1920x1080)</span>
            </div>

            <input 
              type="file" 
              accept="image/*" 
              onChange={handleBannerChange} 
              style={{ color: 'white', display: 'block', width: '100%' }} 
            />
            
            {/* Preview Banner */}
            {(form.fileBanner || form.HinhAnhBanner) && (
              <div style={{marginTop: 15}}>
                <p style={{color: '#ccc', marginBottom: 5}}>Preview Banner:</p>
                <img 
                  src={form.fileBanner ? URL.createObjectURL(form.fileBanner) : getImageUrl(form.HinhAnhBanner)} 
                  alt="Banner Preview" 
                  style={{
                    width: '100%', 
                    maxHeight: 300, 
                    objectFit: 'cover', 
                    borderRadius: 8,
                    border: '1px solid #475569'
                  }} 
                  onError={(e) => e.target.style.display='none'}
                />
              </div>
            )}
          </div>

          <div style={{ marginTop: 30 }}>
            <button type="submit" className="admin-btn" disabled={submitting}>
              {submitting ? "Đang lưu..." : "CẬP NHẬT PHIM"}
            </button>
            <button type="button" className="admin-btn cancel" style={{ marginLeft: 10 }} onClick={() => navigate("/admin")}>
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMovie;