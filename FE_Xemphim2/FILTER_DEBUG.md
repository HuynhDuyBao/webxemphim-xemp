# 🐛 Debug Guide - Filter Thể Loại

## Cách Test Filter

### 1. Mở DevTools (F12)
- Vào tab **Network**
- Filter: `phim`

### 2. Test từng bước:

#### A. Test Filter Thể Loại từ Header
```
1. Click "Thể Loại" → Chọn "Hành động" (ID: 1)
2. Xem Network tab:
   - Request URL phải có: ?genres=1
   - Response phải trả về phim có thể loại Hành động
```

#### B. Test Filter Sidebar
```
1. Vào trang /search
2. Chọn nhiều thể loại: Hành động + Phiêu lưu
3. Click "Lọc kết quả"
4. Xem URL: ?genres=1,2
5. Check response có đúng phim không
```

#### C. Test Console Logs
Mở Console và xem logs:
```javascript
// Fetching movies with params: page=1&limit=50&genres=1,2
```

### 3. Kiểm tra Backend

#### Test API trực tiếp:
```bash
# Test 1: Lọc 1 thể loại
curl "http://localhost/api/phim?genres=1"

# Test 2: Lọc nhiều thể loại
curl "http://localhost/api/phim?genres=1,2,3"

# Test 3: Filter tổng hợp
curl "http://localhost/api/phim?genres=1,2&country=1&year=2024&type=Lẻ"
```

### 4. Các Lỗi Thường Gặp

#### ❌ Lỗi 1: Trả về tất cả phim thay vì filter
**Nguyên nhân:** Backend không nhận được params
**Giải pháp:** Check console.log params trong movieService.jsx

#### ❌ Lỗi 2: URL không có genres param
**Nguyên nhân:** FilterSidebar không apply filter
**Giải pháp:** Check handleApplyFilters() trong FilterSidebar.jsx

#### ❌ Lỗi 3: Selected genres không hiển thị
**Nguyên nhân:** Type conversion sai (string vs number)
**Giải pháp:** Đã fix bằng `map(String).includes(String(id))`

### 5. Debug Steps

#### Bước 1: Check Frontend State
```javascript
// Trong FilterSidebar.jsx, thêm:
console.log('Selected Genres:', selectedGenres);
console.log('Genres Param:', genreParams);
```

#### Bước 2: Check API Request
```javascript
// Trong movieService.jsx, line đã có:
console.log('Fetching movies with params:', params.toString());
```

#### Bước 3: Check Backend
```php
// Trong MovieController.php, thêm vào index():
Log::info('Genres Param:', ['genres' => $genreIds]);
Log::info('Query Result Count:', ['count' => $movies->count()]);
```

### 6. Expected Results

#### Input:
```
Selected: Hành động (1), Phiêu lưu (2)
```

#### URL:
```
/search?genres=1,2
```

#### API Request:
```
GET /api/phim?page=1&limit=50&genres=1,2
```

#### Backend Query:
```sql
SELECT * FROM Phim
WHERE EXISTS (
  SELECT * FROM Phim_TheLoai
  WHERE Phim_TheLoai.MaPhim = Phim.MaPhim
  AND MaTheLoai IN (1, 2)
)
```

---

## ✅ Checklist Đã Sửa

- [x] Fix default props trong FilterSidebar
- [x] Fix type conversion (string/number)
- [x] Fix API service để gửi genres dạng string comma-separated
- [x] Fix dependency array trong useEffect
- [x] Add console.log để debug
- [x] Fix SearchResults props handling

---

## 🔧 Files Changed

1. **FilterSidebar.jsx**
   - Added default props
   - Fixed toggleGenre type conversion
   - Fixed genre tag active state check

2. **SearchResults.jsx**
   - Added safe defaults for genres/countries
   - Fixed genreParams parsing
   - Fixed useEffect dependencies

3. **movieService.jsx**
   - Fixed genres param format (comma-separated string)
   - Added debug console.log

---

## 📞 Nếu Vẫn Lỗi

Gửi cho tôi:
1. Screenshot Network tab (request URL)
2. Console logs
3. Response data từ API
