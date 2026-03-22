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
        Schema::table('Phim', function (Blueprint $table) {
            $table->string('HinhAnhBanner')->nullable()->after('HinhAnh');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('Phim', function (Blueprint $table) {
            $table->dropColumn('HinhAnhBanner');
        });
    }
};
