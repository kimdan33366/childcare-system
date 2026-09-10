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
        'age_months',
        'birthdate',
        'gender',
        'address',
    ];
}
