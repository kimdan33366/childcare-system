<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PatientRecord extends Model
{
    protected $table = 'patient_records';

    protected $primaryKey = 'patient_recordID';

    public $timestamps = false;

    protected $fillable = [
        'child_id',
        'appointment_id',
        'vaccine_id',
        'dose_number',
        'date_taken',
        'place',
        'status',
        'provider',
        'admin_id',
        'staff_id',
    ];

    public function child()
    {
        return $this->belongsTo(
            Child::class,
            'child_id',
            'child_id'
        );
    }

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

    public function admin()
    {
        return $this->belongsTo(
            Admin::class,
            'admin_id',
            'Admin_id'
        );
    }

    public function staff()
    {
        return $this->belongsTo(
            Staff::class,
            'staff_id',
            'staff_id'
        );
    }
}