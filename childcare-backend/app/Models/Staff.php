<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Staff extends Model
{
    protected $table = 'staff';

    protected $primaryKey = 'staff_id';

    protected $fillable = [
        'staff_name',
        'staff_email',
        'staff_phone',
        'staff_password',
        'status',
    ];

    protected $hidden = [
        'staff_password',
    ];

    public function permissions()
    {
        return $this->hasMany(
            StaffPermission::class,
            'staff_id',
            'staff_id'
        );
    }
}