<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    protected $table = 'user';

    protected $primaryKey = 'user_id';

    public $timestamps = false;

    protected $fillable = [
        'user_fullname',
        'date_of_birth',
        'gender',
        'address',
        'mobile_number',
        'password',
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'password' => 'hashed',
        ];
    }
}