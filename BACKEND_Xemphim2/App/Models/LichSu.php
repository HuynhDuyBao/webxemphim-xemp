<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LichSu extends Model
{
    protected $table = 'LichSu';
    protected $primaryKey = null; 
    public $incrementing = false;
    public $timestamps = false;
protected $fillable = [
        'TenDN', 
        'MaPhim', 
        'MaTap',     
        'ThoiGian',
        'ThoiGianXem',
        
    ];

    public function phim()
{
    return $this->belongsTo(\App\Models\Movie::class, 'MaPhim', 'MaPhim')
                ->select(['MaPhim', 'TenPhim', 'HinhAnh', 'NamPhatHanh']);
}

    public function user()
    {
        return $this->belongsTo(User::class, 'TenDN', 'ten_dang_nhap');
    }
}