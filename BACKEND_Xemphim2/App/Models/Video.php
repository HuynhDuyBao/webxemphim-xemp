<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Video extends Model
{
    protected $table = 'video'; 
    protected $primaryKey = 'MaVideo'; 
    public $timestamps = false; 

    protected $fillable = [
        'MaPhim',
        'TenVideo', 
        'ChatLuong', 
        'NgonNgu',   
        'Link'       
    ];

    // Quan hệ ngược về Phim
    public function movie()
    {
        return $this->belongsTo(Movie::class, 'MaPhim', 'MaPhim');
    }
}