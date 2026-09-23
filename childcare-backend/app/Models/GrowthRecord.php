<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GrowthRecord extends Model
{
    protected $table = 'growth_records';

    protected $primaryKey = 'growth_id';

    protected $fillable = [
        'child_id',
        'appointment_id',
        'date',
        'weight_kg',
        'height_cm',
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
}