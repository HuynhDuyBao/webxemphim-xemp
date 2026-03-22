<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Video;
use Illuminate\Support\Facades\Validator;

class VideoController extends Controller
{
    // 1. Lấy danh sách Trailer của 1 phim (GET /api/videos/phim/{id})
    public function index($maPhim)
    {
        $videos = Video::where('MaPhim', $maPhim)->get();
        return response()->json($videos);
    }

    // 2. Thêm Trailer mới (POST /api/videos)
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'MaPhim'   => 'required|integer|exists:phim,MaPhim',
            'TenVideo' => 'required|string|max:100',
            'Link'     => 'required|url', // Link HLS Cloudflare
            // Các trường khác optional
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $video = Video::create([
            'MaPhim'    => $request->MaPhim,
            'TenVideo'  => $request->TenVideo,
            'Link'      => $request->Link,
            'ChatLuong' => $request->input('ChatLuong', 'HD'),
            'NgonNgu'   => $request->input('NgonNgu', 'Vietsub'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Thêm trailer thành công!',
            'data'    => $video
        ], 201);
    }

    // 3. Xóa Trailer (DELETE /api/videos/{id})
    public function destroy($id)
    {
        $video = Video::find($id);
        if ($video) {
            $video->delete();
            return response()->json(['success' => true, 'message' => 'Đã xóa trailer']);
        }
        return response()->json(['message' => 'Không tìm thấy video'], 404);
    }
}