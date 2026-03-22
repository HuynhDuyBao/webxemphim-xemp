import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as tus from "tus-js-client";
import api from "../api/api"; 
import { addEpisode } from "../api/episodeService";
import './AdminMovieEpisodes.css';
import './admin/AdminCommon.css';

export default function AdminMovieEpisodes() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState({});
  const [episodes, setEpisodes] = useState([]);

  const [episode, setEpisode] = useState("");
  const [link, setLink] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMethod, setUploadMethod] = useState("link");

  const loadMovie = async () => {
    try {
      // Thêm timestamp để bypass cache
      const res = await api.get(`/phim/${id}?_=${Date.now()}`);
      console.log("AdminMovieEpisodes - Loaded data:", res.data);
      console.log("Episodes từ API:", res.data.episodes);
      setMovie(res.data);
      setEpisodes(res.data.episodes || []);
    } catch (err) {
      console.error("Lỗi loadMovie:", err);
      alert("Không tải được thông tin phim");
    }
  };

  useEffect(() => {
    loadMovie();
  }, [id]);

  // --------------------- UPLOAD VIDEO CLOUDFLARE (AUTO SELECT METHOD) ---------------------
  const uploadVideoToCloudflare = async () => {
    if (!videoFile) return null;

    const fileSizeMB = videoFile.size / 1024 / 1024;
    
    setUploading(true);
    setUploadProgress(0);
    
    // Chọn phương thức tự động dựa trên file size
    const method = fileSizeMB < 200 ? 'Basic Upload' : 'TUS Protocol (Resumable)';
    
    console.log("=== UPLOAD TO CLOUDFLARE ===", { 
      fileSize: `${fileSizeMB.toFixed(2)}MB`,
      fileName: videoFile.name,
      method: method
    });

    try {
      if (fileSizeMB < 200) {
        // File nhỏ: Basic Upload
        return await uploadSmallFile();
      } else {
        // File lớn: TUS Protocol
        return await uploadLargeFile();
      }
    } catch (err) {
      console.error(err);
      setUploading(false);
      alert("Lỗi upload: " + (err.response?.data?.message || err.message));
      return null;
    }
  };

  // Upload file nhỏ (<200MB) - Basic Upload
  const uploadSmallFile = async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Bạn chưa đăng nhập!");

    const res = await api.post('/admin/stream-upload-url', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const { uploadURL, hls_url, video_uid } = res.data;
    return await uploadBasic(uploadURL, hls_url, video_uid);
  };

  // Upload file lớn (>200MB) - TUS Protocol
  const uploadLargeFile = async () => {
    return new Promise((resolve, reject) => {
      const upload = new tus.Upload(videoFile, {
        // Endpoint để lấy TUS upload URL từ Cloudflare
        endpoint: 'https://api.cloudflare.com/client/v4/accounts/5e1681032cba41a5c9c346162669f996/stream',
        headers: {
          'Authorization': 'Bearer LUPQxSWOGCT-fO4sQoTHzYvDkbg1p_ONVtrl8Jjp'
        },
        chunkSize: 50 * 1024 * 1024, // 50MB chunks
        retryDelays: [0, 1000, 3000, 5000, 10000],
        metadata: {
          name: videoFile.name,
          filetype: videoFile.type || 'video/mp4'
        },
        onError: (error) => {
          console.error("❌ TUS Upload Error:", error);
          setUploading(false);
          reject(new Error(`Upload thất bại: ${error.message}`));
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percent = Math.round((bytesUploaded / bytesTotal) * 100);
          setUploadProgress(percent);
          console.log(`TUS: ${percent}% (${(bytesUploaded/1024/1024).toFixed(1)}MB/${(bytesTotal/1024/1024).toFixed(1)}MB)`);
        },
        onSuccess: () => {
          console.log("✅ TUS Upload SUCCESS");
          
          // Lấy video UID từ upload URL (bỏ query string)
          const uploadUrl = upload.url;
          console.log("Upload URL:", uploadUrl);
          
          // Parse URL đúng cách: https://upload.cloudflarestream.com/{stream-id}/media?tusv2=true
          // hoặc: https://upload.cloudflarestream.com/tus/{video-uid}?tusv2=true
          const urlObj = new URL(uploadUrl);
          const pathParts = urlObj.pathname.split('/').filter(p => p);
          
          // video_uid là phần cuối của path (không có query string)
          let video_uid = pathParts[pathParts.length - 1];
          
          // Nếu path là "tus/{uid}", lấy uid
          if (pathParts[0] === 'tus' && pathParts.length > 1) {
            video_uid = pathParts[pathParts.length - 1];
          }
          
          console.log("Video UID:", video_uid);
          
          const domain = 'customer-mq3bsojkqgoa0nyg.cloudflarestream.com';
          const hls_url = `https://${domain}/${video_uid}/manifest/video.m3u8`;
          
          console.log("HLS URL:", hls_url);
          
          setUploading(false);
          resolve({ hls_url, video_uid });
        }
      });

      upload.start();
      window.currentUpload = upload;
    });
  };

  // Upload trực tiếp lên Cloudflare (Basic POST - hỗ trợ file lớn)
  const uploadBasic = async (uploadUrl, hls_url, video_uid, retryCount = 0) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', videoFile);

      const xhr = new XMLHttpRequest();
      
      // Timeout dài cho file lớn (2 giờ)
      xhr.timeout = 7200000; // 2 hours in milliseconds

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percent);
          const loaded = (e.loaded/1024/1024).toFixed(1);
          const total = (e.total/1024/1024).toFixed(1);
          console.log(`Upload: ${percent}% (${loaded}MB/${total}MB)`);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log("✅ Upload SUCCESS");
          setUploading(false);
          resolve({ hls_url, video_uid });
        } else {
          console.error("❌ Upload failed:", xhr.status, xhr.responseText);
          setUploading(false);
          reject(new Error(`Upload thất bại: HTTP ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', (e) => {
        console.error("❌ Network error:", e);
        
        // Retry logic: thử lại tối đa 3 lần
        if (retryCount < 3) {
          console.log(`🔄 Retry upload (attempt ${retryCount + 1}/3)...`);
          setUploadProgress(0);
          
          setTimeout(() => {
            uploadBasic(uploadUrl, hls_url, video_uid, retryCount + 1)
              .then(resolve)
              .catch(reject);
          }, 3000); // Đợi 3 giây trước khi retry
        } else {
          setUploading(false);
          reject(new Error("Lỗi kết nối mạng sau 3 lần thử. Vui lòng kiểm tra:\n- Kết nối internet\n- File có thể quá lớn (thử file nhỏ hơn)\n- Firewall/Antivirus có block không"));
        }
      });

      xhr.addEventListener('timeout', () => {
        console.error("❌ Upload timeout");
        setUploading(false);
        reject(new Error("Upload quá lâu (timeout). File có thể quá lớn hoặc mạng chậm."));
      });

      xhr.addEventListener('abort', () => {
        console.log("⚠️ Upload cancelled");
        setUploading(false);
        reject(new Error("Upload bị hủy"));
      });

      xhr.open('POST', uploadUrl);
      xhr.send(formData);
      
      window.currentUpload = xhr;
    });
  };



  const handleAddEpisode = async () => {
    if (!episode) return alert("Nhập số tập!");

    let videoLink = link;
    let videoUid = null;

    if (uploadMethod === "upload") {
      if (!videoFile) return alert("Chọn file video!");
      const uploadResult = await uploadVideoToCloudflare();
      if (!uploadResult) return;
      videoLink = uploadResult.hls_url;
      videoUid = uploadResult.video_uid;
      console.log("=== UPLOAD RESULT ===", { videoLink, videoUid });
    } else if (!link) {
      return alert("Nhập link video!");
    }

    try {
      console.log("=== GỬI LÊN API ===", {
        movieId: id,
        episodeName: `Tập ${episode}`,
        videoLink,
        videoUid,
      });

      const res = await addEpisode(id, `Tập ${episode}`, videoLink, { videoUid, hlsUrl: videoLink });
      
      console.log("=== API RESPONSE ===", res);

      setEpisode("");
      setLink("");
      setVideoFile(null);
      setUploadProgress(0);
      
      // Cập nhật dữ liệu từ response nếu có
      if (res.data?.movie) {
        console.log("Cập nhật movie từ response");
        setMovie(res.data.movie);
        setEpisodes(res.data.movie.episodes || []);
      } else {
        // Fallback: nếu response không có movie, thì gọi loadMovie
        setTimeout(() => {
          console.log("=== RELOAD DỮ LIỆU SAU KHI THÊM TẬP ===");
          loadMovie();
        }, 500);
      }

      alert("Thêm tập thành công!");

    } catch (err) {
      console.error(err);
      alert("Lỗi thêm tập: " + (err.response?.data?.message || err.message));
    }
  };

  const deleteEpisode = async (epId) => {
    if (!window.confirm("Xoá tập này?")) return;

    try {
      const token = localStorage.getItem("token");
      await api.delete(`/phim/${id}/tap/${epId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadMovie();
      alert("Xoá tập thành công!");
    } catch (err) {
      console.error(err);
      alert("Lỗi xoá tập!");
    }
  };

  // --------------------- JSX ---------------------
  return (
    <div className="admin-layout">
      <button className="btn-back" onClick={() => navigate("/admin")}>← Quay lại</button>

      <div className="admin-content">
        <h1 className="admin-title">📺 Quản lý tập phim</h1>
        <h2 style={{ color: "#ffd700", marginBottom: "20px" }}>{movie.TenPhim}</h2>

        {/* Chọn phương thức upload */}
        <div style={{ marginBottom: "20px", padding: "15px", background: "#111", borderRadius: "8px", border: "1px solid #333" }}>
          <label style={{ color: "#00ff00", fontWeight: "600", marginRight: "30px" }}>
            <input type="radio" value="link" checked={uploadMethod === "link"} onChange={(e) => setUploadMethod(e.target.value)} /> 📎 Dùng link video
          </label>
          <label style={{ color: "#00ff00", fontWeight: "600" }}>
            <input type="radio" value="upload" checked={uploadMethod === "upload"} onChange={(e) => setUploadMethod(e.target.value)} /> ☁️ Upload Cloudflare
          </label>
        </div>

        {/* Form thêm tập */}
        <div className="admin-form">
          <input type="number" placeholder="Số tập (vd: 1, 2, 3...)" value={episode} onChange={(e) => setEpisode(e.target.value)} className="admin-input" min="1" />

          {uploadMethod === "link" ? (
            <input type="text" placeholder="Link video (HLS .m3u8 hoặc MP4)" value={link} onChange={(e) => setLink(e.target.value)} className="admin-input" />
          ) : (
            <div>
              <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files[0])} className="admin-input" />
              {videoFile && (<p style={{ color: "#00ff00", marginTop: "8px", fontSize: "12px" }}>✓ {videoFile.name} ({(videoFile.size/1024/1024).toFixed(2)} MB)</p>)}
              {uploading && (
                <div style={{ marginTop: "15px" }}>
                  <div style={{ background: "#333", borderRadius: "8px", overflow: "hidden", height: "30px" }}>
                    <div style={{ height: "100%", width: `${uploadProgress}%`, background: "linear-gradient(90deg, #00ff00, #00cc00)", transition: "width 0.4s", textAlign: "center", color: "black", fontWeight: "bold", lineHeight: "30px", fontSize: "12px" }}>{uploadProgress}%</div>
                  </div>
                  <p style={{ color: "#aaa", marginTop: "8px", fontSize: "12px" }}>Đang upload... (có thể mất vài phút)</p>
                </div>
              )}
            </div>
          )}

          <button onClick={handleAddEpisode} className="admin-btn" disabled={uploading} style={{ marginTop: "15px" }}>{uploading ? "⏳ Đang upload..." : "➕ Thêm tập"}</button>
        </div>

        {/* Danh sách tập */}
        <h3 className="admin-title" style={{ marginTop: "30px", marginBottom: "15px" }}>📂 Danh sách tập ({episodes.length})</h3>

        <div style={{ display: "grid", gap: "10px" }}>
          {episodes.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", background: "#111", borderRadius: "8px", border: "1px dashed #333", color: "#999" }}>Chưa có tập nào - thêm tập đầu tiên bằng form phía trên</div>
          ) : (
            episodes.map((ep) => (
              <div key={ep.MaTap} style={{ padding: "15px", background: "#111", borderRadius: "8px", border: "1px solid #333", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ color: "#ffd700", fontSize: "16px" }}>{ep.TenTap}</strong>
                  <div style={{ marginTop: "8px", display: "flex", gap: "10px", alignItems: "center" }}>
                    <a href={ep.Link} target="_blank" rel="noopener noreferrer" style={{ color: "#00ff00", textDecoration: "none", fontSize: "12px", display: "inline-block", padding: "5px 10px", background: "rgba(0,255,0,0.1)", borderRadius: "4px" }}>
                      {ep.Link && ep.Link.includes('.m3u8') ? '📺 HLS Stream' : '🎬 Video Link'}
                    </a>
                    {ep.video_uid && (
                      <span style={{ color: "#666", fontSize: "11px", padding: "4px 8px", background: "rgba(102, 126, 234, 0.15)", borderRadius: "4px" }}>
                        ☁️ {ep.video_uid.substring(0, 8)}...
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {ep.video_uid && (
                    <button 
                      className="admin-btn" 
                      onClick={() => navigate(`/admin/movies/${id}/episodes/${ep.MaTap}/subtitles`, {
                        state: {
                          episodeName: ep.TenTap,
                          videoUid: ep.video_uid,
                          movieName: movie.TenPhim
                        }
                      })}
                      style={{ padding: "8px 12px", background: "#667eea", border: "none" }}
                    >
                      📝 Phụ đề
                    </button>
                  )}
                  <button className="admin-btn" onClick={() => deleteEpisode(ep.MaTap)} style={{ padding: "8px 12px", background: "#c41e3a", border: "none" }}>🗑 Xóa tập</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
