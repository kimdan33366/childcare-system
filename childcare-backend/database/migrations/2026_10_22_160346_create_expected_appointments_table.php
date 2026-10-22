
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expected_appointments', function (Blueprint $table) {
            $table->id('expected_appointment_id');

            $table->foreignId('source_appointment_id');
            $table->foreignId('child_id');

            $table->date('expected_date');
            $table->time('expected_time')->nullable();

            $table->string('status')->default('Awaiting Confirmation');

            $table->unsignedBigInteger('confirmed_appointment_id')->nullable();

            $table->timestamps();

            $table->unique(
                ['source_appointment_id', 'child_id'],
                'expected_source_child_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expected_appointments');
    }
};
