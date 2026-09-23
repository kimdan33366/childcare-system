<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'Admin_name',
    'Admin_email',
    'Admin_password',
    'Admin_role',
])]
class Admin extends Model
{
    protected $table = 'admin';

    protected $primaryKey = 'Admin_id';

    public $timestamps = false;

    protected $hidden = [
        'Admin_password',
    ];

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