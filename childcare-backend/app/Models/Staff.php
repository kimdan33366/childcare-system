<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Staff extends Authenticatable
{
    use HasApiTokens;

    protected $table = 'staff';

    protected $primaryKey = 'staff_id';

    protected $fillable = [
        'staff_name',
        'staff_email',
        'staff_phone',
        'staff_password',
        'status',
    ];

    protected $hidden = [
        'staff_password',
    ];

    public function getAuthPasswordName(): string
    {
        return 'staff_password';
    }

    public function permissions()
    {
        return $this->hasMany(
            StaffPermission::class,
            'staff_id',
            'staff_id'
        );
    }

    public function appointments()
    {
        return $this->hasMany(
            Appointment::class,
            'staff_id',
            'staff_id'
        );
    }

    public function patientRecords()
    {
        return $this->hasMany(
            PatientRecord::class,
            'staff_id',
            'staff_id'
        );
    }
}
