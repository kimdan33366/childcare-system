<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    protected $table = 'appointments';

    protected $primaryKey = 'appointment_id';

    public $timestamps = false;

    protected $fillable = [
        'admin_id',
        'staff_id',
        'appointment_date',
        'appointment_time',
        'address',
        'appointment_type',
        'status',
    ];

    public function admin()
    {
        return $this->belongsTo(Admin::class, 'admin_id', 'Admin_id');
    }

    public function staff()
    {
        return $this->belongsTo(Staff::class, 'staff_id', 'staff_id');
    }

    public function children()
    {
        return $this->belongsToMany(
            Child::class,
            'appointment_children',
            'appointment_id',
            'child_id'
        )->withTimestamps();
    }

    public function vaccines()
    {
        return $this->hasMany(AppointmentVaccine::class, 'appointment_id', 'appointment_id');
    }

    public function growthRecords()
    {
        return $this->hasMany(GrowthRecord::class, 'appointment_id', 'appointment_id');
    }

    public function patientRecords()
    {
        return $this->hasMany(PatientRecord::class, 'appointment_id', 'appointment_id');
    }
}
