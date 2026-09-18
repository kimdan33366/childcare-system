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
         'email',
        'date_of_birth',
        'gender',
        'address',
        'mobile_number',
        'password',
        'status',
       
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
    public function children()
    {
        return $this->hasMany(
            \App\Models\Child::class,
            'user_id',
            'user_id'
        );
    }
}