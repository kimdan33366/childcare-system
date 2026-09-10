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
        Schema::create('notifications', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('child_id')->nullable();
    $table->string('child_name')->nullable();
    $table->string('parent')->nullable();
    $table->string('phone')->nullable();
    $table->text('message');
    $table->string('status')->default('Pending');
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
