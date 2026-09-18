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
        Schema::create('staff_permissions', function (Blueprint $table) {
            $table->id('staff_permission_id');

            $table->unsignedBigInteger('staff_id');

            $table->string('permission');

            $table->timestamps();

            $table->foreign('staff_id')
                ->references('staff_id')
                ->on('staff')
                ->onDelete('cascade');

            $table->unique(['staff_id', 'permission']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_permissions');
    }
};