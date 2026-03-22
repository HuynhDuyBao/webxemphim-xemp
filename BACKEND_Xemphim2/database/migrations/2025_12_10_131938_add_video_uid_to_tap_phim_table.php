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
        Schema::table('TapPhim', function (Blueprint $table) {
            // Add video_uid column after cloudflare_uid
            $table->string('video_uid', 255)->nullable()->after('cloudflare_uid');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('TapPhim', function (Blueprint $table) {
            $table->dropColumn('video_uid');
        });
    }
};
