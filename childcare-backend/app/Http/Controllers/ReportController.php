<?php

namespace App\Http\Controllers;

use App\Models\Report;

class ReportController extends Controller
{
    public function index()
    {
        $report = Report::latest('report_id')->first();

        if (!$report) {
            return response()->json([
                'message' => 'No report found.'
            ], 404);
        }

        return response()->json([
            'overall_coverage' => $report->overall_coverage,
            'complete_series' => $report->complete_series,
            'total_dose_q2' => $report->total_dose_q2,
            'report_year' => $report->report_year,
            'monthly_doses' => $report->monthlyDoses(),
        ]);
    }
}