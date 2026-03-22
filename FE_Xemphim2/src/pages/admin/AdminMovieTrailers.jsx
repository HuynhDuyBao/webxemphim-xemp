import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as tus from "tus-js-client";
import axios from "../../api/api"; 
import { videoService } from "../../api/videoService"; // Service mới
import { getMovie } from "../../api/movieService";
import { toast } from "react-toastify";
import './AdminCommon.css';

const AdminMovieTrailers = () => {
  const { id } = useParams(); // ID Phim
  const navigate = useNavigate();
  
  const [movie, setMovie] = useState(null);
  const [trailers, setTrailers] = useState([]); // Danh sách trailer từ DB
  
  // Form State
  const [tenVideo, setTenVideo] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Load dữ liệu
  const loadData = async () => {
    try {
      const [movieRes, videoRes] = await Promise.all([
        getMovie(id),
        videoService.getVideosByMovie(id) // Lấy danh sách từ bảng video
      ]);
      
      setMovie(movieRes);
      setTrailers(videoRes.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi tải dữ liệu!");
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

const handleUploadTus = () => {
  return new Promise((resolve, reject) => {
    if (!videoFile) return reject("NO_FILE");

    setUploading(true);
    setProgress(0);

    const upload = new tus.Upload(videoFile, {
      endpoint: "https://api.cloudflare.com/client/v4/accounts/5e1681032cba41a5c9c346162669f996/stream",
      headers: {
        Authorization: "Bearer LUPQxSWOGCT-fO4sQoTHzYvDkbg1p_ONVtrl8Jjp"
      },
      chunkSize: 50 * 1024 * 1024, // 50MB
      retryDelays: [0, 1000, 3000, 5000, 10000],

      metadata: {
        name: videoFile.name,
        filetype: videoFile.type || "video/mp4",
      },

      onError: (err) => {
        setUploading(false);
        console.error("❌ TUS Upload Error:", err);
        reject(err);
      },

      onProgress: (bytesUploaded, bytesTotal) => {
        const percent = Math.round((bytesUploaded / bytesTotal) * 100);
        setProgress(percent);
      },

      onSuccess: () => {
        const uploadUrl = upload.url;
        const urlObj = new URL(uploadUrl);
        const parts = urlObj.pathname.split("/").filter(Boolean);

        let video_uid = parts[parts.length - 1];

        // Nếu dạng: /tus/{uid}
        if (parts[0] === "tus" && parts.length > 1) {
          video_uid = parts[1];
        }

        const domain = "customer-mq3bsojkqgoa0nyg.cloudflarestream.com";
        const hls_url = `https://${domain}/${video_uid}/manifest/video.m3u8`;

        console.log("Cloudflare UID:", video_uid);
        console.log("HLS:", hls_url);

        setUploading(false);
        resolve(hls_url);
      },
    });

    upload.start();
    window.currentUpload = upload;
  });
};

  // Lưu Trailer vào DB
 const handleAddTrailer = async () => {
  if (!tenVideo) return toast.warn("Nhập tên Trailer!");
  if (!videoFile) return toast.warn("Chọn file video!");

  try {
    // Upload TUS Cloudflare Stream
    const linkHLS = await handleUploadTus();

    // Lưu vào DB
    await videoService.addVideo({
      MaPhim: id,
      TenVideo: tenVideo,
      Link: linkHLS,
      ChatLuong: "HD",
      NgonNgu: "Vietsub"
    });

    toast.success("Thêm Trailer thành công!");
    setTenVideo("");
    setVideoFile(null);
    setProgress(0);
    loadData();
  } catch (err) {
    toast.error("Lỗi thêm trailer!");
    console.error(err);
  }
};


  // Xóa Trailer
  const handleDelete = async (videoId) => {
    if (!window.confirm("Xóa trailer này?")) return;
    try {
        await videoService.deleteVideo(videoId);
        toast.success("Đã xóa.");
        loadData();
    } catch (error) {
        toast.error("Lỗi xóa!");
    }
  };

  if (!movie) return <div className="admin-layout">Đang tải...</div>;

  return (
    <div className="admin-layout">
      <button className="btn-back" onClick={() => navigate("/admin/movies")}>← Quay lại</button>

      <div className="admin-content">
        <h1 className="admin-title">🎬 Quản lý Trailer: {movie.TenPhim}</h1>

        {/* FORM THÊM */}
        <div className="admin-form">
            <label style={{color:'#00ff00'}}>Thêm Trailer Mới</label>
            <input 
                className="admin-input" 
                placeholder="Tên Trailer (vd: Trailer Chính)" 
                value={tenVideo} 
                onChange={e => setTenVideo(e.target.value)} 
            />
            <input 
                type="file" 
                accept="video/*" 
                onChange={e => setVideoFile(e.target.files[0])} 
                style={{color:'#fff', marginTop:10}}
                disabled={uploading}
            />
            
            {uploading && <div style={{color:'#ffd700', marginTop:5}}>Đang upload: {progress}%</div>}

            <button className="admin-btn" onClick={handleAddTrailer} disabled={uploading} style={{marginTop:15}}>
                {uploading ? "⏳ Đang xử lý..." : "➕ LƯU TRAILER"}
            </button>
        </div>

        {/* DANH SÁCH */}
        <h3 className="admin-title" style={{marginTop:30}}>Danh sách Trailer ({trailers.length})</h3>
        <div style={{display:'grid', gap:10}}>
            {trailers.map(vid => (
                <div key={vid.MaVideo} style={{padding:15, background:'#1a1a1a', borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div>
                        <strong style={{color:'#fff', fontSize:16}}>{vid.TenVideo}</strong>
                        <div style={{fontSize:12, color:'#aaa'}}>{vid.Link}</div>
                    </div>
                    <button className="admin-btn delete small" onClick={() => handleDelete(vid.MaVideo)}>🗑 Xóa</button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AdminMovieTrailers;