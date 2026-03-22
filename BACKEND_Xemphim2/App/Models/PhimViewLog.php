<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PhimViewLog extends Model
{
    use HasFactory;

    protected $table = 'phim_view_logs';

    protected $fillable = [
        'ten_dang_nhap',
        'MaPhim',
        'MaTap',
        'watched_seconds',
        'action',
        'device',
        'ip'
    ];
}
