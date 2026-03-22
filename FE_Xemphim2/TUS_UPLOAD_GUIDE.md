# Hướng dẫn Hybrid Upload System (TUS + XMLHttpRequest)

## Tổng quan
Dự án sử dụng **chiến lược hybrid upload** kết hợp TUS và XMLHttpRequest để tối ưu hóa upload video lên Cloudflare Stream.

## Chiến lược Upload

### 🎯 Tự động chọn phương thức:

- **File < 100MB**: Dùng XMLHttpRequest (nhanh, đơn giản)
- **File > 100MB**: Dùng TUS Protocol (resumable, chịu lỗi tốt)
- **TUS lỗi**: Tự động fallback về XMLHttpRequest

### ✅ Ưu điểm của hệ thống này:

1. **Smart Selection** - Tự động chọn phương thức tối ưu theo kích thước file
2. **Automatic Fallback** - TUS lỗi → tự động chuyển sang XHR
3. **Resumable Upload** - TUS hỗ trợ tiếp tục upload khi bị gián đoạn (file lớn)
4. **Fast Upload** - XHR nhanh hơn cho file nhỏ (< 100MB)
5. **Network Resilience** - Chịu đựng tốt với mạng không ổn định

## Cách hoạt động

### Luồng upload:

```
1. Frontend request upload URL từ backend
   POST /api/admin/stream-upload-url
   → Response: { uploadURL, hls_url, video_uid }

2. TUS client upload file theo chunks
   - Chunk size: 50MB
   - Tự động retry khi lỗi
   - Báo cáo progress realtime

3. Cloudflare Stream xử lý video
   - Transcode sang HLS format
   - Tạo thumbnail tự động
   - Video sẵn sàng phát ngay

4. Frontend lưu hls_url vào database
```

## Cấu hình Hybrid Upload

### File được cập nhật:

1. **AddMovie.jsx** - Upload video khi thêm phim mới
2. **AdminMovieEpisodes.jsx** - Upload video khi thêm tập phim
3. **MovieController.php** - Backend API trả về upload URL

### Logic chọn phương thức:

```javascript
// Tự động chọn dựa trên kích thước file
const fileSizeInMB = videoFile.size / (1024 * 1024);
const useTUS = fileSizeInMB > 100;

if (useTUS) {
  // File lớn → dùng TUS (có retry & resumable)
  await uploadWithTUS(uploadURL, hls_url);
} else {
  // File nhỏ → dùng XHR (nhanh hơn)
  await uploadWithXHR(uploadURL, hls_url);
}
```

### Cấu hình TUS (cho file lớn):

```javascript
const upload = new tus.Upload(videoFile, {
  endpoint: uploadURL,
  retryDelays: [0, 3000, 5000, 10000, 20000],
  chunkSize: 50 * 1024 * 1024, // 50MB
  removeFingerprintOnSuccess: true,
  onError: (error) => {
    // Tự động fallback sang XHR nếu TUS lỗi
    uploadWithXHR(uploadURL, hls_url);
  },
  onProgress: (bytesUploaded, bytesTotal) => { 
    // Update progress bar
  },
  onSuccess: () => { 
    // Upload hoàn tất
  },
});
```

## Test upload

### Test với file lớn:
1. Vào trang admin thêm phim
2. Chọn file video > 100MB
3. Upload và quan sát progress bar
4. Thử ngắt mạng giữa chừng → TUS sẽ tự retry
5. Kết nối lại → Upload tiếp tục từ chỗ cũ

## Xử lý lỗi

### Các lỗi phổ biến:

| Lỗi | Nguyên nhân | Giải pháp |
|-----|------------|-----------|
| "Upload thất bại: Network error" | Mất kết nối internet | TUS tự retry, chờ kết nối ổn định |
| "Lỗi lấy link upload" | Backend không response | Kiểm tra Laravel server đang chạy |
| "Bạn chưa đăng nhập" | Token hết hạn | Đăng nhập lại |
| Progress stuck at 99% | Cloudflare đang transcode | Đợi vài giây, video sẽ sẵn sàng |

## Giới hạn Cloudflare Stream

- **Free tier**: 1000 phút upload/tháng
- **Max file size**: Không giới hạn (nhưng nên < 10GB)
- **Max duration**: 8 giờ (cấu hình trong backend)
- **Supported formats**: MP4, MOV, MKV, AVI, FLV, MPEG-2 TS, MPEG-2 PS, MXF, LXF, GXF, 3GP, WebM, MPG, QuickTime

## Monitoring upload

### Debug trong console:

```javascript
// Xem progress
TUS Upload: 25% (262144000/1048576000)
TUS Upload: 50% (524288000/1048576000)
TUS Upload: 75% (786432000/1048576000)
=== TUS UPLOAD SUCCESS === { hls_url: "...", video_uid: "..." }
```

### Cancel upload (nếu cần):

```javascript
// Trong code có lưu instance
window.currentTusUpload?.abort();
```

## Bảo mật

- Upload URL có thời hạn (1 giờ)
- Chỉ admin đăng nhập mới tạo được upload URL
- Token bearer được gửi trong header
- CORS đã được config cho phép localhost:3000

## Khuyến nghị

1. **File size**: Upload file < 2GB để tối ưu
2. **Format**: Dùng MP4 H.264 để transcode nhanh nhất
3. **Network**: Upload qua WiFi hoặc 4G ổn định
4. **Browser**: Chrome/Edge hoạt động tốt nhất với TUS

## Troubleshooting

### Nếu upload vẫn bị lỗi:

1. Clear browser cache
2. Restart Laravel server: `php artisan serve`
3. Restart React dev server: `npm start`
4. Kiểm tra .env có đầy đủ:
   - CLOUDFLARE_STREAM_ACCOUNT_ID
   - CLOUDFLARE_STREAM_API_TOKEN
   - CLOUDFLARE_STREAM_DOMAIN

## Support

Nếu gặp vấn đề, check log:
- **Frontend**: Console browser (F12)
- **Backend**: `storage/logs/laravel.log`
- **Cloudflare**: Stream dashboard
