<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vaccine extends Model
{
    protected $table = 'vaccine';

    protected $primaryKey = 'vaccine_ID';

    public $timestamps = false;

    protected $fillable = [
        'vaccine_name',
        'date_stored',
        'expiration_date',
        'stock_quantity',
        'status',
    ];
}