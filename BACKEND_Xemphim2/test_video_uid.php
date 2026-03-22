<?php
// Test script to verify video_uid is in database and accessible

// Bootstrap Laravel
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Get a sample episode with video_uid
$episode = \App\Models\Episode::whereNotNull('video_uid')->first();

if (!$episode) {
    echo "❌ No episodes with video_uid found\n";
    exit(1);
}

echo "✅ Found episode with video_uid:\n";
echo "   MaTap: {$episode->MaTap}\n";
echo "   TenTap: {$episode->TenTap}\n";
echo "   video_uid: {$episode->video_uid}\n";
echo "   Link: {$episode->Link}\n";

echo "\n📋 JSON Format:\n";
echo json_encode([
    'MaTap' => $episode->MaTap,
    'TenTap' => $episode->TenTap,
    'Link' => $episode->Link,
    'video_uid' => $episode->video_uid,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

echo "\n\n✅ video_uid is accessible from Episode model\n";
