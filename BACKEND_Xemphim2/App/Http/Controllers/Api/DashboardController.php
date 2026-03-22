<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Movie;
use App\Models\Rating;
use App\Models\BinhLuan;
use App\Models\YeuThich;

class DashboardController extends Controller
{
    /**
     * Lấy danh sách phim với thống kê
     */
    public function getAllMoviesWithStats(Request $request)
    {
        try {
            $search = $request->get('search', '');
            $sortBy = $request->get('sort_by', 'LuotXem');
            $sortOrder = $request->get('sort_order', 'desc');

            $query = Movie::select('Phim.MaPhim', 'Phim.TenPhim', 'Phim.HinhAnh', 'Phim.LuotXem', 'Phim.NamPhatHanh')
                ->leftJoin('DanhGia', 'Phim.MaPhim', '=', 'DanhGia.MaPhim')
                ->leftJoin('binhluan', 'Phim.MaPhim', '=', 'binhluan.MaPhim')
                ->leftJoin('phim_yeuthich', 'Phim.MaPhim', '=', 'phim_yeuthich.MaPhim')
                ->selectRaw('COUNT(DISTINCT CONCAT(DanhGia.TenDN, "-", DanhGia.MaPhim)) as rating_count')
                ->selectRaw('AVG(DanhGia.SoDiem) as avg_rating')
                ->selectRaw('COUNT(DISTINCT binhluan.MaBinhLuan) as comment_count')
                ->selectRaw('COUNT(DISTINCT phim_yeuthich.id) as favorite_count')
                ->groupBy('Phim.MaPhim', 'Phim.TenPhim', 'Phim.HinhAnh', 'Phim.LuotXem', 'Phim.NamPhatHanh');

            if (!empty($search)) {
                $query->where('Phim.TenPhim', 'LIKE', "%{$search}%");
            }

            if (in_array($sortBy, ['avg_rating', 'comment_count', 'rating_count', 'favorite_count'])) {
                $query->orderBy($sortBy, $sortOrder);
            } else {
                $query->orderBy('Phim.' . $sortBy, $sortOrder);
            }

            $movies = $query->get();

            return response()->json([
                'success' => true,
                'data' => $movies
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy thống kê chi tiết một phim
     */
    public function getMovieDetailStats($id)
    {
        try {
            $movie = Movie::find($id);

            if (!$movie) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy phim'
                ], 404);
            }

            // Lượt xem
            $views = $movie->LuotXem;

            // Đánh giá
            $ratings = Rating::where('MaPhim', $id)->get();
            $ratingCount = $ratings->count();
            $averageRating = $ratingCount > 0 ? round($ratings->avg('SoDiem'), 1) : 0;

            // Phân phối đánh giá
            $ratingDistribution = [];
            for ($i = 1; $i <= 10; $i++) {
                $count = $ratings->where('SoDiem', $i)->count();
                $ratingDistribution[] = [
                    'rating' => $i,
                    'count' => $count,
                    'percentage' => $ratingCount > 0 ? round(($count / $ratingCount) * 100, 1) : 0
                ];
            }

            // Bình luận
            $comments = BinhLuan::where('MaPhim', $id)
                ->with('nguoiDung:ten_dang_nhap,ho_ten,hinh_dai_dien')
                ->orderByDesc('ThoiGian')
                ->limit(10)
                ->get();
            $totalComments = BinhLuan::where('MaPhim', $id)->count();

            // Lượt thích
            $favorites = YeuThich::where('MaPhim', $id)->count();

            // Top người đánh giá
            $topRaters = Rating::where('MaPhim', $id)
                ->join('tai_khoan', 'DanhGia.TenDN', '=', 'tai_khoan.ten_dang_nhap')
                ->select('tai_khoan.ten_dang_nhap', 'tai_khoan.ho_ten', 'DanhGia.SoDiem', 'DanhGia.BinhLuan', 'DanhGia.ThoiGian')
                ->orderByDesc('DanhGia.SoDiem')
                ->limit(5)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'movie' => [
                        'MaPhim' => $movie->MaPhim,
                        'TenPhim' => $movie->TenPhim,
                        'HinhAnh' => $movie->HinhAnh,
                        'MoTa' => $movie->MoTa,
                        'NamPhatHanh' => $movie->NamPhatHanh,
                        'ThoiLuong' => $movie->ThoiLuong,
                    ],
                    'statistics' => [
                        'views' => $views,
                        'favorites' => $favorites,
                        'ratings' => [
                            'count' => $ratingCount,
                            'average' => $averageRating,
                            'distribution' => $ratingDistribution,
                        ],
                        'comments' => [
                            'total' => $totalComments,
                            'recent' => $comments,
                        ],
                    ],
                    'top_raters' => $topRaters,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
