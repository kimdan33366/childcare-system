<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExpectedAppointment extends Model
{
    protected $table = 'expected_appointments';

    protected $primaryKey = 'expected_appointment_id';

    protected $fillable = [
        'source_appointment_id',
        'child_id',
        'expected_date',
        'expected_time',
        'status',
        'confirmed_appointment_id',
    ];

    protected $casts = [
        'expected_date' => 'date:Y-m-d',
    ];

    public function sourceAppointment()
    {
        return $this->belongsTo(
            Appointment::class,
            'source_appointment_id',
            'appointment_id'
        );
    }

    public function child()
    {
        return $this->belongsTo(
            Child::class,
            'child_id',
            'child_id'
        );
    }

    public function confirmedAppointment()
    {
        return $this->belongsTo(
            Appointment::class,
            'confirmed_appointment_id',
            'appointment_id'
        );
    }
}
