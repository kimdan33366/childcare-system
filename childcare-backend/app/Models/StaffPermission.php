<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StaffPermission extends Model
{
    protected $table = 'staff_permissions';

    protected $primaryKey = 'staff_permission_id';

    protected $fillable = [
        'staff_id',
        'permission',
    ];

    public function staff()
    {
        return $this->belongsTo(
            Staff::class,
            'staff_id',
            'staff_id'
        );
    }
}