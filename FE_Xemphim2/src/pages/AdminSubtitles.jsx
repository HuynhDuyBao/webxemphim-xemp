import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { subtitleService, LANGUAGE_CODES, AI_SUPPORTED_LANGUAGES } from "../api/subtitleService";
import './admin/AdminCommon.css';

export default function AdminSubtitles() {
  const { id, episodeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const episodeName = location.state?.episodeName || `Tập ${episodeId}`;
  const videoUid = location.state?.videoUid;
  const movieName = location.state?.movieName;

  const [subtitles, setSubtitles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [subtitleFile, setSubtitleFile] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('vi');
  const [uploadMethod, setUploadMethod] = useState('upload');

  useEffect(() => {
    if (videoUid) {
      loadSubtitles();
    }
  }, [videoUid]);

  const loadSubtitles = async () => {
    if (!videoUid) {
      alert("Tập phim này chưa có video_uid. Cần upload video lên Cloudflare trước.");
      return;
    }

    try {
      setLoading(true);
      const subs = await subtitleService.getSubtitles(videoUid);
      setSubtitles(subs);
    } catch (err) {
      console.error("Load subtitles error:", err);
      alert("Lỗi tải danh sách phụ đề: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubtitle = async () => {
    if (!subtitleFile) {
      alert("Vui lòng chọn file phụ đề (.vtt)");
      return;
    }

    if (!selectedLanguage) {
      alert("Vui lòng chọn ngôn ngữ");
      return;
    }

    try {
      setUploading(true);
      await subtitleService.uploadSubtitle(videoUid, subtitleFile, selectedLanguage);
      alert("Upload phụ đề thành công!");
      setSubtitleFile(null);
      loadSubtitles();
    } catch (err) {
      console.error("Upload subtitle error:", err);
      alert("Lỗi upload phụ đề: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateSubtitle = async () => {
    if (!selectedLanguage) {
      alert("Vui lòng chọn ngôn ngữ");
      return;
    }

    if (!AI_SUPPORTED_LANGUAGES.includes(selectedLanguage)) {
      alert(`Ngôn ngữ "${selectedLanguage}" không hỗ trợ tạo tự động bằng AI.\n\nCác ngôn ngữ hỗ trợ: ${AI_SUPPORTED_LANGUAGES.join(', ')}`);
      return;
    }

    if (!window.confirm(`Tạo phụ đề tự động bằng AI cho ngôn ngữ "${LANGUAGE_CODES[selectedLanguage] || selectedLanguage}"?\n\nQuá trình này có thể mất vài phút.`)) {
      return;
    }

    try {
      setGenerating(true);
      const result = await subtitleService.generateSubtitle(videoUid, selectedLanguage);
      
      if (result.status === 'inprogress') {
        alert("Đang tạo phụ đề... Quá trình này có thể mất vài phút. Vui lòng tải lại trang sau ít phút.");
      } else if (result.status === 'ready') {
        alert("Tạo phụ đề thành công!");
      }
      
      loadSubtitles();
    } catch (err) {
      console.error("Generate subtitle error:", err);
      alert("Lỗi tạo phụ đề: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteSubtitle = async (languageTag) => {
    if (!window.confirm(`Xóa phụ đề "${LANGUAGE_CODES[languageTag] || languageTag}"?`)) {
      return;
    }

    try {
      await subtitleService.deleteSubtitle(videoUid, languageTag);
      alert("Xóa phụ đề thành công!");
      loadSubtitles();
    } catch (err) {
      console.error("Delete subtitle error:", err);
      alert("Lỗi xóa phụ đề: " + err.message);
    }
  };

  const handleDownloadSubtitle = async (languageTag) => {
    try {
      const content = await subtitleService.getSubtitleFile(videoUid, languageTag);
      const blob = new Blob([content], { type: 'text/vtt' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${episodeName}_${languageTag}.vtt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download subtitle error:", err);
      alert("Lỗi tải xuống phụ đề: " + err.message);
    }
  };

  const getStatusBadge = (subtitle) => {
    const statusStyles = {
      ready: { bg: '#00ff00', color: '#000', text: '✓ Sẵn sàng' },
      inprogress: { bg: '#ffa500', color: '#000', text: '⏳ Đang xử lý' },
      error: { bg: '#ff0000', color: '#fff', text: '✗ Lỗi' },
    };

    const style = statusStyles[subtitle.status] || statusStyles.ready;

    return (
      <span style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '600',
        background: style.bg,
        color: style.color,
      }}>
        {style.text}
      </span>
    );
  };

  if (!videoUid) {
    return (
      <div className="admin-layout">
        <button className="btn-back" onClick={() => navigate(`/admin/movies/${id}/episodes`)}>
          ← Quay lại
        </button>
        <div className="admin-content" style={{ textAlign: 'center', padding: '40px' }}>
          <h2 style={{ color: '#ff6b6b', marginBottom: '20px' }}>⚠️ Không thể quản lý phụ đề</h2>
          <p style={{ color: '#aaa', marginBottom: '20px' }}>
            Tập phim này chưa có video_uid (chưa upload lên Cloudflare).
          </p>
          <p style={{ color: '#aaa' }}>
            Vui lòng upload video lên Cloudflare Stream trước khi thêm phụ đề.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <button className="btn-back" onClick={() => navigate(`/admin/movies/${id}/episodes`)}>
        ← Quay lại
      </button>

      <div className="admin-content">
        <h1 className="admin-title">📝 Quản lý phụ đề</h1>
        <h2 style={{ color: "#ffd700", marginBottom: "10px" }}>{movieName}</h2>
        <h3 style={{ color: "#aaa", marginBottom: "20px" }}>{episodeName}</h3>
        <p style={{ color: "#666", fontSize: "12px", marginBottom: "30px" }}>
          Video UID: <code style={{ background: '#222', padding: '2px 6px', borderRadius: '4px' }}>{videoUid}</code>
        </p>

        <div style={{ marginBottom: "25px", padding: "15px", background: "#111", borderRadius: "8px", border: "1px solid #333" }}>
          <label style={{ color: "#00ff00", fontWeight: "600", marginRight: "30px" }}>
            <input 
              type="radio" 
              value="upload" 
              checked={uploadMethod === "upload"} 
              onChange={(e) => setUploadMethod(e.target.value)} 
            /> 
            {' '}📤 Upload file phụ đề
          </label>
          <label style={{ color: "#00ff00", fontWeight: "600" }}>
            <input 
              type="radio" 
              value="generate" 
              checked={uploadMethod === "generate"} 
              onChange={(e) => setUploadMethod(e.target.value)} 
            /> 
            {' '}🤖 Tạo tự động bằng AI
          </label>
        </div>

        <div className="admin-form" style={{ marginBottom: "30px" }}>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', color: '#aaa', marginBottom: '8px', fontSize: '13px' }}>
                Ngôn ngữ phụ đề
              </label>
              <select 
                value={selectedLanguage} 
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="admin-input"
                style={{ width: '100%' }}
              >
                {Object.entries(LANGUAGE_CODES).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name} ({code})
                  </option>
                ))}
              </select>
            </div>

            {uploadMethod === 'upload' ? (
              <>
                <div>
                  <label style={{ display: 'block', color: '#aaa', marginBottom: '8px', fontSize: '13px' }}>
                    File phụ đề (.vtt)
                  </label>
                  <input 
                    type="file" 
                    accept=".vtt" 
                    onChange={(e) => setSubtitleFile(e.target.files[0])}
                    className="admin-input"
                  />
                  {subtitleFile && (
                    <p style={{ color: "#00ff00", marginTop: "8px", fontSize: "12px" }}>
                      ✓ {subtitleFile.name} ({(subtitleFile.size/1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>

                <button 
                  onClick={handleUploadSubtitle} 
                  className="admin-btn" 
                  disabled={uploading}
                >
                  {uploading ? "⏳ Đang upload..." : "📤 Upload phụ đề"}
                </button>
              </>
            ) : (
              <>
                <div style={{ padding: '12px', background: '#1a1a1a', borderRadius: '6px', border: '1px solid #333' }}>
                  <p style={{ color: '#aaa', fontSize: '12px', marginBottom: '8px' }}>
                    🤖 <strong>Tạo phụ đề tự động bằng AI</strong>
                  </p>
                  <p style={{ color: '#666', fontSize: '11px' }}>
                    Các ngôn ngữ hỗ trợ: {AI_SUPPORTED_LANGUAGES.join(', ')}
                  </p>
                </div>

                <button 
                  onClick={handleGenerateSubtitle} 
                  className="admin-btn" 
                  disabled={generating}
                  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                  {generating ? "⏳ Đang tạo..." : "🤖 Tạo phụ đề AI"}
                </button>
              </>
            )}
          </div>
        </div>

        <h3 className="admin-title" style={{ marginTop: "30px", marginBottom: "15px" }}>
          📋 Danh sách phụ đề ({subtitles.length})
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
            Đang tải...
          </div>
        ) : subtitles.length === 0 ? (
          <div style={{ 
            padding: "20px", 
            textAlign: "center", 
            background: "#111", 
            borderRadius: "8px", 
            border: "1px dashed #333", 
            color: "#999" 
          }}>
            Chưa có phụ đề nào - thêm phụ đề đầu tiên bằng form phía trên
          </div>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {subtitles.map((sub) => (
              <div 
                key={sub.language} 
                style={{ 
                  padding: "15px", 
                  background: "#111", 
                  borderRadius: "8px", 
                  border: "1px solid #333",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: "#ffd700", fontSize: "16px" }}>
                      {sub.label || LANGUAGE_CODES[sub.language] || sub.language}
                    </strong>
                    {sub.generated && (
                      <span style={{ 
                        marginLeft: '10px', 
                        color: '#667eea', 
                        fontSize: '11px',
                        padding: '2px 8px',
                        background: 'rgba(102, 126, 234, 0.2)',
                        borderRadius: '4px'
                      }}>
                        🤖 AI Generated
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {getStatusBadge(sub)}
                    <span style={{ color: '#666', fontSize: '12px' }}>
                      Code: {sub.language}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {sub.status === 'ready' && (
                    <button 
                      onClick={() => handleDownloadSubtitle(sub.language)}
                      className="admin-btn" 
                      style={{ 
                        padding: "8px 12px", 
                        background: "#2196F3", 
                        border: "none",
                        fontSize: '12px'
                      }}
                    >
                      💾 Tải xuống
                    </button>
                  )}
                  <button 
                    onClick={() => handleDeleteSubtitle(sub.language)}
                    className="admin-btn" 
                    style={{ 
                      padding: "8px 12px", 
                      background: "#c41e3a", 
                      border: "none",
                      fontSize: '12px'
                    }}
                  >
                    🗑 Xóa phụ đề
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
