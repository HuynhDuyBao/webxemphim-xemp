<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tai_khoan', function (Blueprint $table) {
            // Thêm google_id (VARCHAR 255, cho phép NULL, và duy nhất)
            // $table->string('google_id', 255)->nullable()->unique()->after('email');
            
            // Thêm facebook_id (VARCHAR 255, cho phép NULL, và duy nhất)
            // $table->string('facebook_id', 255)->nullable()->unique()->after('google_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tai_khoan', function (Blueprint $table) {
            // Xóa chỉ mục duy nhất trước khi xóa cột
            $table->dropUnique(['google_id']);
            $table->dropColumn('google_id');
            
            $table->dropUnique(['facebook_id']);
            $table->dropColumn('facebook_id');
        });
    }
};
