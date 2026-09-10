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
        'child_id',
        'user_id',
        'appointment_date',
        'appointment_time',
        'address',
        'subject',
        'status',
    ];
}
