<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppointmentVaccine extends Model
{
    protected $table = 'appointment_vaccines';

    protected $primaryKey = 'id';

    protected $fillable = [
        'appointment_id',
        'vaccine_id',
        'dose_number',
    ];

    public function appointment()
    {
        return $this->belongsTo(
            Appointment::class,
            'appointment_id',
            'appointment_id'
        );
    }

    public function vaccine()
    {
        return $this->belongsTo(
            Vaccine::class,
            'vaccine_id',
            'vaccine_ID'
        );
    }
}