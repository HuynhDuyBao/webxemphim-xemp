<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Movie;
use App\Models\Episode;
use App\Models\TheLoai;
use App\Models\LichSu;
use App\Models\QuocGia;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class MovieController extends Controller
{
    use AuthorizesRequests;

    // === CÁC HÀM CŨ GIỮ NGUYÊN ===
    public function index(Request $request)
    {
        $query = $request->get('q', '');
        $genreIds = $request->get('genres', []); // Array thể loại: ?genres=1,3,5
        $countryId = $request->get('country', '');
        $status = $request->get('status', '');
        $year = $request->get('year', '');
        $type = $request->get('type', ''); // Lẻ/Bộ

        // DEBUG LOG
        Log::info('Filter Request', [
            'query' => $query,
            'genres' => $genreIds,
            'country' => $countryId,
            'year' => $year,
            'status' => $status,
            'type' => $type
        ]);

        $movies = Movie::with(['quocgia', 'theloai', 'episodes'])
            // 1. Lọc theo từ khóa
            ->when($query, function ($q) use ($query) {
                $q->where('TenPhim', 'LIKE', "%{$query}%")
                  ->orWhere('TieuDe', 'LIKE', "%{$query}%");
            })
            // 2. Lọc theo thể loại (sử dụng whereHas) - FIX: Thêm check empty
            ->when(!empty($genreIds), function ($q) use ($genreIds) {
                // Đảm bảo $genreIds là mảng
                $genreArray = is_string($genreIds) ? explode(',', $genreIds) : (array) $genreIds;
                $genreArray = array_filter($genreArray); // Loại bỏ giá trị rỗng
                
                Log::info('Filtering by genres', ['genreArray' => $genreArray]);
                
                if (!empty($genreArray)) {
                    $q->whereHas('theloai', function ($sub) use ($genreArray) {
                        $sub->whereIn('TheLoai.MaTheLoai', $genreArray);
                    });
                }
            })
            // 3. Lọc theo quốc gia
            ->when($countryId, function ($q) use ($countryId) {
                $q->where('MaQuocGia', $countryId);
            })
            // 4. Lọc theo năm phát hành
            ->when($year, function ($q) use ($year) {
                $q->where('NamPhatHanh', $year);
            })
            // 5. Lọc theo tình trạng
            ->when($status, function ($q) use ($status) {
                $q->where('TinhTrang', $status);
            })
            // 6. Lọc theo loại phim (Lẻ/Bộ)
            ->when($type, function ($q) use ($type) {
                $q->where('PhanLoai', $type);
            })
            ->orderBy('MaPhim', 'desc')
            ->get();

        Log::info('Movies found', ['count' => $movies->count()]);

        // FIX LỖI EPISODES NULL
        $movies->each(function ($movie) {
            if (!$movie->relationLoaded('episodes')) {
                $movie->setRelation('episodes', collect([]));
            }
        });

        return response()->json($movies);
    }


public function show($id)
{
    $movie = Movie::with(['quocgia', 'theloai', 'episodes', 'videos'])->findOrFail($id);


    if (!$movie->relationLoaded('episodes') || is_null($movie->episodes)) {
        $movie->setRelation('episodes', collect([]));
    }
    
    if (!$movie->relationLoaded('videos') || is_null($movie->videos)) {
        $movie->setRelation('videos', collect([]));
    }

    return response()->json($movie);
}
    // ================== HELPER: UPLOAD ẢNH LÊN CLOUDFLARE ==================
    private function uploadImageToCloudflare($file)
    {
        $accountId = env('CLOUDFLARE_ACCOUNT_ID');
        $apiToken = env('CLOUDFLARE_API_TOKEN');
        $accountHash = env('CLOUDFLARE_ACCOUNT_HASH');

        if (!$accountId || !$apiToken || !$accountHash) {
            throw new \Exception("Chưa cấu hình Cloudflare Images (ACCOUNT_ID, API_TOKEN, ACCOUNT_HASH)");
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $apiToken
        ])->attach(
            'file',
            file_get_contents($file),
            $file->getClientOriginalName()
        )->post("https://api.cloudflare.com/client/v4/accounts/{$accountId}/images/v1");

        $result = $response->json();

        if (!$result['success']) {
            Log::error('Cloudflare Image Upload Failed', ['error' => $result]);
            throw new \Exception("Lỗi upload ảnh lên Cloudflare: " . ($result['errors'][0]['message'] ?? 'Unknown error'));
        }

        $imageId = $result['result']['id'];
        return "https://imagedelivery.net/{$accountHash}/{$imageId}/public";
    }

    public function store(Request $request)
    {
        // Validate input
        $validated = $request->validate([
            'TenPhim'       => 'required|string|max:255',
            'TieuDe'        => 'nullable|string|max:255',
            'MoTa'          => 'nullable|string',
            'NamPhatHanh'   => 'nullable|integer|min:1900|max:' . date('Y'),
            'DanhGia'       => 'nullable|numeric|min:0|max:10',
            'PhanLoai'      => 'required|in:Lẻ,Bộ',
            'TinhTrang'     => 'required|in:Đang chiếu,Sắp chiếu,Đã kết thúc',
            'MaQuocGia'     => 'nullable|exists:QuocGia,MaQuocGia',
            'MaTheLoai'     => 'nullable|array',
            'MaTheLoai.*'   => 'exists:TheLoai,MaTheLoai',
            'Link'          => 'nullable|string',
            'HinhAnh'       => 'nullable|string',
            'HinhAnhBanner' => 'nullable|string',
            'imageFile'     => 'nullable|image|max:51200', // 50MB max
            'bannerFile'    => 'nullable|image|max:51200', // 50MB max
        ]);

        try {
            // Handle image upload if provided (Poster)
            if ($request->hasFile('imageFile')) {
                // Upload lên Cloudflare thay vì local
                $validated['HinhAnh'] = $this->uploadImageToCloudflare($request->file('imageFile'));
            } else if (!empty($validated['HinhAnh'])) {
                $validated['HinhAnh'] = $validated['HinhAnh'];
            }

            // Handle banner upload if provided (Banner)
            if ($request->hasFile('bannerFile')) {
                // Upload lên Cloudflare thay vì local
                $validated['HinhAnhBanner'] = $this->uploadImageToCloudflare($request->file('bannerFile'));
            } else if (!empty($validated['HinhAnhBanner'])) {
                $validated['HinhAnhBanner'] = $validated['HinhAnhBanner'];
            }

            // Create the movie
            $movie = Movie::create($validated);

            // Attach genres (many-to-many)
            if (!empty($validated['MaTheLoai'])) {
                $movie->theloai()->attach($validated['MaTheLoai']);
            }

            // Load relationships for response
            $movie->load(['quocgia', 'theloai', 'episodes']);

            // Ensure episodes is always an array
            if (!$movie->relationLoaded('episodes') || is_null($movie->episodes)) {
                $movie->setRelation('episodes', collect([]));
            }

            return response()->json([
                'success' => true,
                'message' => 'Phim đã được thêm thành công!',
                'movie'   => $movie,
                'data'    => $movie // Also return as 'data' for compatibility
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi thêm phim: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $movie = Movie::findOrFail($id);

        $validated = $request->validate([
            'TenPhim'       => 'sometimes|required|string|max:255',
            'TieuDe'        => 'nullable|string|max:255',
            'MoTa'          => 'nullable|string',
            'NamPhatHanh'   => 'nullable|integer|min:1900|max:' . date('Y'),
            'DanhGia'       => 'nullable|numeric|min:0|max:10',
            'PhanLoai'      => 'sometimes|required|in:Lẻ,Bộ',
            'TinhTrang'     => 'sometimes|required|in:Đang chiếu,Sắp chiếu,Đã kết thúc',
            'MaQuocGia'     => 'nullable|exists:QuocGia,MaQuocGia',
            'MaTheLoai'     => 'nullable|array',
            'MaTheLoai.*'   => 'exists:TheLoai,MaTheLoai',
            'Link'          => 'nullable|string',
            'HinhAnh'       => 'nullable|string',
            'HinhAnhBanner' => 'nullable|string',
            'imageFile'     => 'nullable|image|max:51200',
            'bannerFile'    => 'nullable|image|max:51200',
        ]);

        try {
            if ($request->hasFile('imageFile')) {
                // Upload lên Cloudflare
                $validated['HinhAnh'] = $this->uploadImageToCloudflare($request->file('imageFile'));
            }

            if ($request->hasFile('bannerFile')) {
                // Upload lên Cloudflare
                $validated['HinhAnhBanner'] = $this->uploadImageToCloudflare($request->file('bannerFile'));
            }

            $movie->update($validated);

            if (!empty($validated['MaTheLoai'])) {
                $movie->theloai()->sync($validated['MaTheLoai']);
            }

            $movie->load(['quocgia', 'theloai', 'episodes']);
            if (!$movie->relationLoaded('episodes') || is_null($movie->episodes)) {
                $movie->setRelation('episodes', collect([]));
            }

            return response()->json([
                'success' => true,
                'message' => 'Phim đã được cập nhật thành công!',
                'movie'   => $movie
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật phim: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getTopViewedMovies(Request $request)
    {
        $limit = 10;
        
        // 1. Lấy Top 10 phim xem nhiều nhất
        $topMovies = Movie::with(['quocgia', 'theloai'])
                        ->orderByDesc('LuotXem')
                        ->take($limit)
                        ->get();

        $count = $topMovies->count();
        $user = $request->user('sanctum');

        // 2. Nếu đủ phim hoặc không có user, trả về luôn
        if ($count >= $limit || !$user) {
            return response()->json($topMovies);
        }

        // 3. Nếu thiếu phim: Tìm thể loại user hay xem nhất
        $needed = $limit - $count;
        $existingIds = $topMovies->pluck('MaPhim');

        // Tìm 3 thể loại user xem nhiều nhất
        $favGenreIds = LichSu::where('TenDN', $user->ten_dang_nhap)
            ->join('Phim_TheLoai', 'LichSu.MaPhim', '=', 'Phim_TheLoai.MaPhim')
            ->select('Phim_TheLoai.MaTheLoai', DB::raw('COUNT(*) as cnt'))
            ->groupBy('Phim_TheLoai.MaTheLoai')
            ->orderByDesc('cnt')
            ->take(3)
            ->pluck('MaTheLoai');

        if ($favGenreIds->isEmpty()) {
            return response()->json($topMovies);
        }

        // 4. Lấy phim bù vào từ thể loại yêu thích (ngẫu nhiên)
        $fallback = Movie::with(['quocgia', 'theloai'])
            ->whereHas('theloai', function ($q) use ($favGenreIds) {
                $q->whereIn('TheLoai.MaTheLoai', $favGenreIds);
            })
            ->whereNotIn('MaPhim', $existingIds)
            ->inRandomOrder()
            ->take($needed)
            ->get();

        return response()->json($topMovies->concat($fallback));
    }
    public function search(Request $request)
    {
        $query = $request->get('q', '');

        if (empty($query)) {
             return response()->json([], 200); // Trả về mảng rỗng nếu không có từ khóa
        }

        $movies = Movie::with(['quocgia', 'theloai'])
            ->where('TenPhim', 'LIKE', "%{$query}%")
            ->orWhere('TieuDe', 'LIKE', "%{$query}%")
            ->orderBy('MaPhim', 'desc')
            ->get();

        return response()->json($movies);
    }


  
    public function searchWithFilters(Request $request)
    {
        $query = $request->get('q', '');
        $genreIds = $request->get('genres', []); // Array thể loại: ?genres=1,3,5
        $countryId = $request->get('country', '');
        $status = $request->get('status', '');
        $year = $request->get('year', '');
        $type = $request->get('type', ''); // Lẻ/Bộ

        $movies = Movie::with(['quocgia', 'theloai'])
            // 1. Lọc theo từ khóa
            ->when($query, function ($q) use ($query) {
                $q->where('TenPhim', 'LIKE', "%{$query}%")
                  ->orWhere('TieuDe', 'LIKE', "%{$query}%");
            })
            // 2. Lọc theo thể loại (sử dụng whereHas)
            ->when($genreIds, function ($q) use ($genreIds) {
                // Đảm bảo $genreIds là mảng
                $genreArray = is_string($genreIds) ? explode(',', $genreIds) : (array) $genreIds;
                $q->whereHas('theloai', function ($sub) use ($genreArray) {
                    $sub->whereIn('MaTheLoai', $genreArray);
                });
            })
            // 3. Lọc theo quốc gia
            ->when($countryId, function ($q) use ($countryId) {
                $q->where('MaQuocGia', $countryId);
            })
            // 4. Lọc theo năm phát hành
            ->when($year, function ($q) use ($year) {
                $q->where('NamPhatHanh', $year);
            })
            // 5. Lọc theo tình trạng
            ->when($status, function ($q) use ($status) {
                $q->where('TinhTrang', $status);
            })
            // 6. Lọc theo loại phim (Lẻ/Bộ)
            ->when($type, function ($q) use ($type) {
                $q->where('PhanLoai', $type);
            })
            ->orderBy('MaPhim', 'desc')
            ->get();

        return response()->json($movies);
    }


public function destroy($id)
{
    try {
        // 1. Tìm phim và load kèm danh sách tập (để lấy video ID)
        $movie = Movie::with('episodes')->findOrFail($id);

        // 2. Lấy cấu hình Cloudflare từ .env
        // Ưu tiên lấy từ config, nếu không có thì lấy trực tiếp env
        $accountId = config('services.cloudflare.account_id', env('CLOUDFLARE_STREAM_ACCOUNT_ID'));
        $token     = config('services.cloudflare.api_token', env('CLOUDFLARE_STREAM_API_TOKEN'));

        // 3. XÓA VIDEO TRÊN CLOUDFLARE (Quan trọng)
        if ($accountId && $token) {
            foreach ($movie->episodes as $episode) {
                // Lấy ID video (kiểm tra cả 2 trường cho chắc chắn)
                $videoUid = $episode->cloudflare_uid ?? $episode->video_uid;

                if ($videoUid) {
                    // Gọi API xóa của Cloudflare
                    $response = Http::withToken($token)->delete(
                        "https://api.cloudflare.com/client/v4/accounts/{$accountId}/stream/{$videoUid}"
                    );
                    
                    if ($response->successful()) {
                        Log::info("Đã xóa video Cloudflare ID: " . $videoUid);
                    } else {
                        Log::warning("Không thể xóa video Cloudflare ID: $videoUid. Lỗi: " . $response->body());
                    }
                }
            }
        }

        // 4. XÓA ẢNH POSTER (Nếu ảnh được lưu trên server local)
        // Kiểm tra nếu link ảnh chứa '/storage/' tức là ảnh local
        if ($movie->HinhAnh && strpos($movie->HinhAnh, '/storage/') !== false) {
            // Cắt bỏ phần '/storage/' để lấy đường dẫn thực trong folder 'public'
            // Ví dụ URL: http://localhost/storage/phim/abc.jpg -> Path: phim/abc.jpg
            $relativePath = str_replace('/storage/', '', parse_url($movie->HinhAnh, PHP_URL_PATH));
            
            if (Storage::disk('public')->exists($relativePath)) {
                Storage::disk('public')->delete($relativePath);
                Log::info("Đã xóa ảnh poster: " . $relativePath);
            }
        }

        // 5. XÓA DỮ LIỆU TRONG DATABASE
        // Xóa các tập phim trước (để tránh lỗi khóa ngoại nếu chưa set cascade)
        $movie->episodes()->delete(); 
        // Xóa phim
        $movie->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa phim, ảnh và toàn bộ video trên Cloudflare thành công!'
        ], 200);

    } catch (\Exception $e) {
        Log::error("Lỗi khi xóa phim: " . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Lỗi khi xóa phim: ' . $e->getMessage()
        ], 500);
    }
}

    // ================== CLOUDFLARE STREAM UPLOAD URL - TUS DIRECT ==================
   public function getCloudflareUploadUrl(Request $request)
{
    $accountId = config('services.cloudflare.account_id', env('CLOUDFLARE_STREAM_ACCOUNT_ID'));
    $token     = config('services.cloudflare.api_token', env('CLOUDFLARE_STREAM_API_TOKEN'));
    $domain    = config('services.cloudflare.stream_domain', env('CLOUDFLARE_STREAM_DOMAIN'));

    if (empty($accountId) || empty($token) || empty($domain)) {
        Log::error('Cloudflare Config Missing', [
            'accountId' => $accountId ? 'exists' : 'missing',
            'token' => $token ? 'exists' : 'missing',
            'domain' => $domain ? 'exists' : 'missing',
        ]);
        
        return response()->json([
            'success' => false,
            'message' => 'Chưa cấu hình Cloudflare Stream trong .env',
            'debug' => [
                'accountId' => !empty($accountId),
                'token' => !empty($token),
                'domain' => !empty($domain)
            ]
        ], 500)->header('Content-Type', 'application/json');
    }

    // TẠO DIRECT UPLOAD URL cho basic upload (<200MB)
    $response = Http::withToken($token)->post(
        "https://api.cloudflare.com/client/v4/accounts/{$accountId}/stream/direct_upload",
        [
            'maxDurationSeconds' => 28800,
            'requireSignedURLs'  => false,
            'meta' => [
                'name' => 'Upload from Movie App'
            ]
        ]
    );

    if ($response->failed()) {
        Log::error('Cloudflare API Error', [
            'status' => $response->status(),
            'body' => $response->body()
        ]);
        
        return response()->json([
            'success' => false,
            'message' => 'Lỗi kết nối Cloudflare Stream',
            'error'   => $response->json(),
            'debug'   => $response->body()
        ], 500)->header('Content-Type', 'application/json');
    }

    $data = $response->json()['result'];
    $videoUid = $data['uid'];
    $uploadURL = $data['uploadURL'];

    // TRẢ VỀ UPLOAD URL cho Basic Upload
    return response()->json([
        'success'      => true,
        'uploadURL'    => $uploadURL,
        'video_uid'    => $videoUid,
        'hls_url'      => "https://{$domain}/{$videoUid}/manifest/video.m3u8",
        'thumbnail'    => "https://customer-" . substr($videoUid, 0, 32) . ".cloudflarestream.com/{$videoUid}/thumbnails/thumbnail.jpg?time=10s&height=480",
    ], 200)->header('Content-Type', 'application/json');
}

    // ================== TẠO TUS UPLOAD URL (MỌI FILE SIZE) ==================
    public function getTusUploadUrl(Request $request)
    {
        $accountId = config('services.cloudflare.account_id');
        $token = config('services.cloudflare.api_token');
        $domain = config('services.cloudflare.stream_domain');

        if (!$accountId || !$token) {
            return response()->json([
                'success' => false,
                'message' => 'Cloudflare chưa được cấu hình'
            ], 500);
        }

        // Lấy metadata từ TUS client
        $uploadLength = $request->header('Upload-Length');
        $uploadMetadata = $request->header('Upload-Metadata');

        Log::info('Creating TUS endpoint', [
            'uploadLength' => $uploadLength,
            'uploadMetadata' => $uploadMetadata
        ]);

        // Tạo TUS upload endpoint (Cloudflare Stream)
        $response = Http::withHeaders([
            'Authorization' => "Bearer {$token}",
            'Tus-Resumable' => '1.0.0',
            'Upload-Length' => $uploadLength,
            'Upload-Metadata' => $uploadMetadata,
        ])->post("https://api.cloudflare.com/client/v4/accounts/{$accountId}/stream?direct_user=true");

        if ($response->failed()) {
            Log::error('TUS Endpoint Error', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Không thể tạo TUS endpoint',
                'error' => $response->body()
            ], 500);
        }

        // TUS endpoint trả về Location header
        $tusUploadUrl = $response->header('Location');
        
        // Lấy video UID từ upload URL
        $video_uid = basename(parse_url($tusUploadUrl, PHP_URL_PATH));
        $hls_url = "https://{$domain}/{$video_uid}/manifest/video.m3u8";

        Log::info('TUS endpoint created', [
            'location' => $tusUploadUrl,
            'video_uid' => $video_uid
        ]);

        // Trả về response với CORS headers
        return response()->json([
            'uploadURL' => $tusUploadUrl,
            'video_uid' => $video_uid,
            'hls_url' => $hls_url
        ], 200, [
            'Access-Control-Expose-Headers' => 'Location',
            'Access-Control-Allow-Headers' => '*',
            'Access-Control-Allow-Origin' => '*',
            'Location' => $tusUploadUrl
        ]);
}

    // ================== UPLOAD VIDEO QUA PROXY (BYPASS CORS) ==================
    public function uploadVideoProxy(Request $request)
    {
        $request->validate([
            'video' => 'required|file|mimes:mp4,mov,avi,mkv,webm,flv|max:10240000', // Max 10GB
            'uploadURL' => 'required|url',
        ]);

        try {
            $videoFile = $request->file('video');
            $uploadURL = $request->input('uploadURL');

            $fileSize = $videoFile->getSize();
            $fileName = $videoFile->getClientOriginalName();

            Log::info('Uploading to Cloudflare', [
                'uploadURL' => $uploadURL,
                'fileSize' => $fileSize,
                'fileName' => $fileName
            ]);

            // Sử dụng stream thay vì đọc toàn bộ file vào memory
            // Điều này giúp xử lý file lớn (>1GB) mà không gặp lỗi memory
            $stream = fopen($videoFile->getRealPath(), 'r');

            // Upload file lên Cloudflare Stream bằng POST với multipart streaming
            $response = Http::timeout(7200) // 2 giờ timeout cho file lớn
                ->attach('file', $stream, $fileName)
                ->post($uploadURL);
            
            // Đóng stream sau khi upload
            if (is_resource($stream)) {
                fclose($stream);
            }

            if ($response->successful()) {
                Log::info('Cloudflare Upload Success');
                return response()->json([
                    'success' => true,
                    'message' => 'Upload thành công!'
                ], 200);
            } else {
                // Log error để debug
                Log::error('Cloudflare Upload Error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Upload thất bại',
                    'error' => $response->body()
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Upload Exception', ['error' => $e->getMessage()]);
            
            return response()->json([
                'success' => false,
                'message' => 'Lỗi upload: ' . $e->getMessage()
            ], 500);
        }
    }

    // ================== THÊM TẬP PHIM MỚI (CLOUDFLARE STREAM) ==================
    public function addEpisode(Request $request, $MaPhim)
    {
        // Accept either a cloudflare upload (video_uid + hls_url) or a direct link (Link)
        $request->validate([
            'TenTap'     => 'required|string|max:100',
            'video_uid'  => 'nullable|string',
            'hls_url'    => 'nullable|url',
            'Link'       => 'nullable|url',
        ]);

        $movie = Movie::findOrFail($MaPhim);

        // Determine final play URL (hls_url preferred, otherwise Link)
        $playUrl = $request->hls_url ?? $request->Link ?? null;
        if (!$playUrl) {
            return response()->json(['message' => 'Thiếu đường dẫn video (hls_url hoặc Link)'], 422);
        }

        $episode = $movie->episodes()->create([
            'TenTap'         => $request->TenTap,
            'Link'           => $playUrl,
            'cloudflare_uid' => $request->video_uid ?? null,
            'video_uid'      => $request->video_uid ?? null, // Lưu video_uid cho subtitle
            'hls_url'        => $playUrl,
            'status'         => $request->video_uid ? 'ready' : 'ready',
            'original_file'  => null,
            'r2_folder'      => null,
        ]);

        // Reload movie với tất cả episodes để trả về response đầy đủ
        $movie->load('episodes');

        return response()->json([
            'message'   => 'Thêm tập thành công! Video đã sẵn sàng phát!',
            'episode'   => $episode,
            'play_url'  => $playUrl,
            'movie'     => $movie,
        ], 201);
    }

    // ================== XÓA TẬP PHIM + XÓA VIDEO TRÊN CLOUDFLARE ==================
    public function deleteEpisode($MaPhim, $MaTap)
    {
        $episode = Episode::where('MaPhim', $MaPhim)
                          ->where('MaTap', $MaTap)
                          ->firstOrFail();

        // XÓA VIDEO TRÊN CLOUDFLARE
        if ($episode->cloudflare_uid) {
            $accountId = env('CLOUDFLARE_STREAM_ACCOUNT_ID');
            $token = env('CLOUDFLARE_STREAM_API_TOKEN');

            if ($accountId && $token) {
                Http::withToken($token)->delete(
                    "https://api.cloudflare.com/client/v4/accounts/{$accountId}/stream/{$episode->cloudflare_uid}"
                );
            }
        }

        $episode->delete();

        return response()->json(['message' => 'Xóa tập thành công + video đã xóa khỏi Cloudflare']);
    }

    // ================== TRẠNG THÁI TẬP PHIM (TƯƠNG THÍCH CŨ) ==================
    public function episodeStatus($MaPhim, $MaTap)
    {
        $episode = Episode::where('MaPhim', $MaPhim)
                               ->where('MaTap', $MaTap)
                               ->firstOrFail();

        return response()->json([
            'status'   => $episode->status,
            'hls_url'  => $episode->status === 'ready' ? $episode->hls_url : null,
            'message'  => $episode->status === 'ready' ? 'Sẵn sàng phát!' : 'Đang xử lý...'
        ]);
    }
    public function getGenres()
    {
        $genres = TheLoai::select('MaTheLoai', 'TenTheLoai')->get();
        return response()->json($genres);
    }

    public function getCountries()
    {
        $countries = QuocGia::select('MaQuocGia', 'TenQuocGia')->get();
        return response()->json($countries);
    }

    // ================== TĂNG LƯỢT XEM ==================
    public function incrementView($id)
    {
        try {
            $movie = Movie::findOrFail($id);
            $movie->increment('LuotXem');
            
            return response()->json([
                'success' => true,
                'message' => 'Đã tăng lượt xem',
                'LuotXem' => $movie->LuotXem
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi tăng lượt xem: ' . $e->getMessage()
            ], 500);
        }
    }

    // DEBUG ENDPOINT - Test filter
    public function testFilter(Request $request)
    {
        $genreIds = $request->get('genres', '');
        
        return response()->json([
            'raw_input' => $genreIds,
            'type' => gettype($genreIds),
            'is_string' => is_string($genreIds),
            'exploded' => is_string($genreIds) ? explode(',', $genreIds) : $genreIds,
            'all_params' => $request->all(),
            'query_params' => $request->query(),
        ]);
    }

    // ================== UPLOAD POSTER LÊN CLOUDFLARE IMAGES ==================
    public function uploadPoster(Request $request)
    {
        $request->validate([
            'poster_file' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048'
        ]);

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . env('CLOUDFLARE_API_TOKEN')
            ])->attach(
                'file',
                file_get_contents($request->file('poster_file')),
                $request->file('poster_file')->getClientOriginalName()
            )->post("https://api.cloudflare.com/client/v4/accounts/" . env('CLOUDFLARE_ACCOUNT_ID') . "/images/v1");

            $result = $response->json();

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Upload ảnh thất bại',
                    'error' => $result
                ], 500);
            }

            // Trả về URL ảnh từ Cloudflare
            $imageId = $result['result']['id'];
            $imageUrl = "https://imagedelivery.net/" . env('CLOUDFLARE_ACCOUNT_HASH') . "/{$imageId}/public";

            return response()->json([
                'success' => true,
                'message' => 'Upload ảnh thành công',
                'image_id' => $imageId,
                'image_url' => $imageUrl
            ], 200);

        } catch (\Exception $e) {
            Log::error('Upload poster error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi upload ảnh: ' . $e->getMessage()
            ], 500);
        }
    }
}