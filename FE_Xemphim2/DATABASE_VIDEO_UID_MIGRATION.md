# ✅ Database Migration - video_uid Column

## Vấn đề đã giải quyết

Database thiếu cột `video_uid` trong bảng `TapPhim` để lưu trữ Cloudflare Stream Video UID, cần thiết cho tính năng subtitle.

## Giải pháp đã thực hiện

### 1. Migration Database ✅

**File**: `database/migrations/2025_12_10_131938_add_video_uid_to_tap_phim_table.php`

```php
Schema::table('TapPhim', function (Blueprint $table) {
    $table->string('video_uid', 255)->nullable()->after('cloudflare_uid');
});
```

**Kết quả**: Cột `video_uid` đã được thêm vào bảng `TapPhim`

### 2. Update Model ✅

**File**: `App/Models/Episode.php`

Cột `video_uid` đã có trong `$fillable`:
```php
protected $fillable = [
    'MaPhim','TenTap','Link',
    'original_file','hls_url','r2_folder','status','duration',
    'cloudflare_uid','video_uid'
];
```

### 3. Update Controller ✅

**File**: `App/Http/Controllers/Api/MovieController.php`

Function `addEpisode()` đã được cập nhật để lưu `video_uid`:

```php
$episode = $movie->episodes()->create([
    'TenTap'         => $request->TenTap,
    'Link'           => $playUrl,
    'cloudflare_uid' => $request->video_uid ?? null,
    'video_uid'      => $request->video_uid ?? null, // ✅ NEW
    'hls_url'        => $playUrl,
    'status'         => $request->video_uid ? 'ready' : 'ready',
    'original_file'  => null,
    'r2_folder'      => null,
]);
```

### 4. Migrate Existing Data ✅

**12 episodes** đã có sẵn đã được cập nhật:
```sql
UPDATE TapPhim 
SET video_uid = cloudflare_uid 
WHERE cloudflare_uid IS NOT NULL
```

**Kết quả**: 12 tập phim đã có `video_uid`

### 5. Verify Data ✅

Test thành công - Dữ liệu mẫu:
```json
{
    "MaTap": 57,
    "TenTap": "Tập 1",
    "Link": "https://customer-mq3bsojkqgoa0nyg.cloudflarestream.com/82506b7fe5c52efdf1f975232f4ca268/manifest/video.m3u8",
    "video_uid": "82506b7fe5c52efdf1f975232f4ca268"
}
```

## Cấu trúc Database hiện tại

### Bảng TapPhim

| Column | Type | Description |
|--------|------|-------------|
| MaTap | int | Primary Key |
| MaPhim | int | Foreign Key to Phim |
| TenTap | varchar | Episode name |
| Link | text | HLS URL for playback |
| cloudflare_uid | varchar(255) | Cloudflare video UID (legacy) |
| **video_uid** | **varchar(255)** | **✅ NEW - For subtitle management** |
| hls_url | text | HLS streaming URL |
| r2_folder | varchar | R2 storage folder |
| status | varchar | ready/processing/error |
| duration | int | Video duration in seconds |

## API Response Format

Khi gọi API `/api/phim/{id}`, response sẽ bao gồm `video_uid`:

```json
{
  "MaPhim": 1,
  "TenPhim": "Example Movie",
  "episodes": [
    {
      "MaTap": 57,
      "TenTap": "Tập 1",
      "Link": "https://customer-mq3bsojkqgoa0nyg.cloudflarestream.com/.../manifest/video.m3u8",
      "video_uid": "82506b7fe5c52efdf1f975232f4ca268",
      "status": "ready"
    }
  ]
}
```

## Integration với Subtitle Feature

Với `video_uid` đã có trong database và API response:

### 1. Frontend VideoPlayer
```jsx
<VideoPlayer 
  url={selectedEpisode.Link}
  videoUid={selectedEpisode.video_uid}  // ✅ Passed from API
  onProgress={saveProgressToHistory}
  onEnded={handleEnded}
/>
```

### 2. Subtitle Service
```javascript
// subtitleService.jsx sử dụng video_uid
const subtitles = await subtitleService.getSubtitles(videoUid);
```

### 3. Admin Subtitle Management
```jsx
// AdminSubtitles.jsx nhận video_uid từ route state
const { videoUid } = location.state;
await subtitleService.uploadSubtitle(videoUid, file, 'vi');
```

## Flow hoàn chỉnh

```
1. Upload Video → Cloudflare Stream
   ↓
2. Nhận video_uid từ Cloudflare
   ↓
3. Lưu video_uid vào database (TapPhim.video_uid)
   ↓
4. API trả về video_uid trong response
   ↓
5. Frontend nhận video_uid
   ↓
6. Admin có thể manage subtitles với video_uid
   ↓
7. User xem video với subtitle options
```

## Testing Checklist

- [x] Migration chạy thành công
- [x] Cột video_uid tồn tại trong database
- [x] Model Episode có video_uid trong fillable
- [x] Controller lưu video_uid khi thêm episode
- [x] Existing episodes được migrate (12 episodes)
- [x] API response bao gồm video_uid
- [x] Frontend components sẵn sàng sử dụng video_uid

## Kết luận

✅ **Database đã hoàn toàn sẵn sàng** cho tính năng subtitle!

- Cột `video_uid` đã được thêm vào bảng `TapPhim`
- 12 episodes hiện có đã có `video_uid`
- API đã được cập nhật để lưu và trả về `video_uid`
- Tất cả components subtitle (đã implement trước đó) giờ có thể hoạt động đầy đủ

## Các file đã tạo/sửa

### Backend
1. ✅ `database/migrations/2025_12_10_131938_add_video_uid_to_tap_phim_table.php` - NEW
2. ✅ `App/Http/Controllers/Api/MovieController.php` - UPDATED (addEpisode function)
3. ✅ `test_video_uid.php` - NEW (test script)

### Frontend (đã có từ trước)
1. ✅ `src/api/subtitleService.jsx`
2. ✅ `src/pages/AdminSubtitles.jsx`
3. ✅ `src/components/VideoPlayer.jsx`
4. ✅ `src/pages/AdminMovieEpisodes.jsx`
5. ✅ `src/routes/AppRoutes.jsx`

## Hướng dẫn sử dụng

### Khi upload video mới:
```javascript
// Frontend tự động gửi video_uid
const res = await addEpisode(id, `Tập ${episode}`, videoLink, { 
  videoUid: uploadResult.video_uid,  // ✅ Được lưu vào database
  hlsUrl: videoLink 
});
```

### Khi quản lý subtitle:
1. Click nút **📝 Phụ đề** trong episode list
2. System tự động lấy `video_uid` từ episode
3. Upload/Generate subtitle với Cloudflare API
4. Subtitle hiển thị trong video player

**Tất cả đã sẵn sàng hoạt động!** 🎉
