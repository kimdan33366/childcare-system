<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable([
    'Admin_name',
    'Admin_email',
    'Admin_password',
    'Admin_role',
])]
class Admin extends Authenticatable
{
    use HasApiTokens;

    protected $table = 'admin';

    protected $primaryKey = 'Admin_id';

    public $timestamps = false;

    protected $hidden = [
        'Admin_password',
    ];

    public function getAuthPasswordName(): string
    {
        return 'Admin_password';
    }

    public function appointments()
    {
        return $this->hasMany(
            Appointment::class,
            'admin_id',
            'Admin_id'
        );
    }

    public function patientRecords()
    {
        return $this->hasMany(
            PatientRecord::class,
            'admin_id',
            'Admin_id'
        );
    }
}
