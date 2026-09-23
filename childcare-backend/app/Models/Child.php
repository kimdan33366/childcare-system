<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Child extends Model
{
    protected $table = 'children';

    protected $primaryKey = 'child_id';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'child_name',
        'birthdate',
        'gender',
        'address',
        'relationship',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(
            User::class,
            'user_id',
            'user_id'
        );
    }

    public function patientRecords()
    {
        return $this->hasMany(
            PatientRecord::class,
            'child_id',
            'child_id'
        );
    }

    public function appointments()
    {
        return $this->belongsToMany(
            Appointment::class,
            'appointment_children',
            'child_id',
            'appointment_id'
        )->withTimestamps();
    }

    public function growthRecords()
    {
        return $this->hasMany(
            GrowthRecord::class,
            'child_id',
            'child_id'
        );
    }
}