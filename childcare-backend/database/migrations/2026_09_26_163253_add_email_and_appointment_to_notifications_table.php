<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // appointment_id, email, and type were already added
        // before the previous migration failed.
        // We only need to fix the appointment_id type
        // and then create the foreign key.

        Schema::table('notifications', function (Blueprint $table) {
            $table->integer('appointment_id')
                ->nullable()
                ->change();
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->foreign('appointment_id')
                ->references('appointment_id')
                ->on('appointments')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign(['appointment_id']);
        });

        // The columns were originally created before this migration
        // was partially completed, so they are intentionally not removed here.
    }
};