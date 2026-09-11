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
        'vaccine_id',
        'dose_number',
        'date_taken',
        'place',
        'status',
        'provider',
    ];
}