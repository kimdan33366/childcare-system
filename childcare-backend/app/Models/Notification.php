<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'child_id',
        'appointment_id',
        'child_name',
        'parent',
        'phone',
        'email',
        'type',
        'message',
        'status',
    ];

    public function appointment()
    {
        return $this->belongsTo(
            Appointment::class,
            'appointment_id',
            'appointment_id'
        );
    }
}