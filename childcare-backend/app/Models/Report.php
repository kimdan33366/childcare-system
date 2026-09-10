<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Report extends Model
{
    protected $table = 'reports';

    protected $primaryKey = 'report_id';

    public $timestamps = false;

    protected $fillable = [
        'overall_coverage',
        'complete_series',
        'total_dose_q2',
        'report_year',
    ];
    public function monthlyDoses(){
        return DB::table('report_monthly_doses')
            ->where('report_year', $this->report_year)
            ->get();
    }
}
