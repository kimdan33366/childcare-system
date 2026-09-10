<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'Admin_name',
    'Admin_email',
    'Admin_password',
    'Admin_role',
    
])]
class Admin extends Model
{
    protected $table = 'admin';

    protected $primaryKey = 'Admin_id';

    public $timestamps = false;
}