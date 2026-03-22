<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\PhimViewLog;
use App\Models\Movie;
use App\Models\TaiKhoan;
use App\Models\PhimYeuThich;
use App\Models\TheLoai;

class StatisticController extends Controller
{

    public function store(Request $request)
{
    $log = \App\Models\PhimViewLog::create([
        'ten_dang_nhap'  => auth()->user()->ten_dang_nhap ?? $request->ten_dang_nhap,
        'MaPhim'         => $request->MaPhim,
        'MaTap'          => $request->MaTap,
        'watched_seconds'=> $request->watched_seconds,
        'action'         => 'watch',
        'device'         => $request->device ?? $request->header('User-Agent'),
        'ip'             => $request->ip(),
    ]);

    return response()->json(['status' => 'ok']);
}

    // --- Hàm hỗ trợ lấy khoảng thời gian ---
    private function getDateRange($range)
    {
        $now = Carbon::now();
        switch ($range) {
            case 'today':
                return [$now->startOfDay(), $now->endOfDay()];
            case 'yesterday':
                return [$now->subDay()->startOfDay(), $now->subDay()->endOfDay()];
            case 'week':
                return [$now->startOfWeek(), $now->endOfWeek()];
            case 'month':
                return [$now->startOfMonth(), $now->endOfMonth()];
            case 'year':
                return [$now->startOfYear(), $now->endOfYear()];
            default:
                return [Carbon::create(2000,1,1), $now];
        }
    }

    /**
     * GET /api/admin/stats/dashboard
     * Lấy số liệu tổng quan
     */
    public function dashboard(Request $request)
    {
        $range = $request->get('range', 'month');
        [$start, $end] = $this->getDateRange($range);

        // Active Users (có ít nhất 1 view)
        $activeUsers = PhimViewLog::whereBetween('created_at', [$start, $end])
            ->distinct('ten_dang_nhap')
            ->count('ten_dang_nhap');

        // New Signups
        $newSignups = TaiKhoan::whereBetween('ngay_tao', [$start, $end])->count();

        // Tổng thời gian xem (giờ)
        $totalSeconds = PhimViewLog::whereBetween('created_at', [$start, $end])
            ->sum('watched_seconds');
        $totalHours = round($totalSeconds / 3600, 2);

        // Tổng lượt xem
        $totalViews = PhimViewLog::whereBetween('created_at', [$start, $end])->count();

        return response()->json([
            'success' => true,
            'range' => $range,
            'data' => [
                'active_users' => $activeUsers,
                'new_signups' => $newSignups,
                'watch_hours' => $totalHours,
                'views_count' => $totalViews,
            ]
        ]);
    }

    /**
     * GET /api/admin/stats/top-trending
     */
    public function topTrending(Request $request)
    {
        $limit = $request->get('limit', 10);

        $topMovies = PhimViewLog::select('MaPhim', DB::raw('COUNT(*) as views'))
            ->groupBy('MaPhim')
            ->orderByDesc('views')
            ->limit($limit)
            ->get()
            ->map(function($item) {
                $movie = Movie::find($item->MaPhim);
                return [
                    'MaPhim' => $movie->MaPhim,
                    'TenPhim' => $movie->TenPhim,
                    'HinhAnh' => $movie->HinhAnh,
                    'DanhGia' => $movie->DanhGia,
                    'views' => $item->views,
                ];
            });

        return response()->json($topMovies);
    }

    /**
     * GET /api/admin/stats/favorite-rate
     */
    public function favoriteRate()
    {
        $totalFavorites = PhimYeuThich::count();
        $totalViews = PhimViewLog::count();

        $rate = $totalViews > 0 ? round($totalFavorites / $totalViews * 100, 2) : 0;

        $topFavMovies = DB::table('phim_yeuthich')
            ->join('phim', 'phim_yeuthich.MaPhim', '=', 'phim.MaPhim')
            ->select('phim.TenPhim', DB::raw('COUNT(*) as total_fav'))
            ->groupBy('phim.MaPhim', 'phim.TenPhim')
            ->orderByDesc('total_fav')
            ->limit(5)
            ->get();

        return response()->json([
            'global_rate' => $rate . '%',
            'total_favorites' => $totalFavorites,
            'top_favorited_movies' => $topFavMovies,
        ]);
    }

    /**
     * GET /api/admin/stats/genres
     */
    public function genreAnalytics()
    {
        $stats = DB::table('phim_view_logs as pv')
            ->join('phim_theloai as pt', 'pv.MaPhim', '=', 'pt.MaPhim')
            ->join('theloai as tl', 'pt.MaTheLoai', '=', 'tl.MaTheLoai')
            ->select('tl.TenTheLoai', DB::raw('COUNT(pv.id) as view_count'))
            ->groupBy('tl.MaTheLoai', 'tl.TenTheLoai')
            ->orderByDesc('view_count')
            ->get();

        return response()->json($stats);
    }

    /**
     * GET /api/admin/stats/user-growth
     */
    public function userGrowth()
    {
        $growth = TaiKhoan::select(
            DB::raw('YEAR(ngay_tao) as year'),
            DB::raw('MONTH(ngay_tao) as month'),
            DB::raw('COUNT(*) as count')
        )
        ->where('ngay_tao', '>=', Carbon::now()->subYear())
        ->groupBy('year', 'month')
        ->orderBy('year')
        ->orderBy('month')
        ->get();

        return response()->json($growth);
    }
}
