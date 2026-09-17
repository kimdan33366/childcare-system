<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Illuminate\Support\Facades\DB;

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

        $children = DB::table('children')
            ->select('child_id')
            ->get();

        $vaccinationStatus = [
            'completed' => 0,
            'continuing' => 0,
            'missed' => 0,
            'not_started' => 0,
        ];

        foreach ($children as $child) {

            $records = DB::table('patient_records')
                ->where('child_id', $child->child_id)
                ->pluck('status');

            if ($records->isEmpty()) {

                $vaccinationStatus['not_started']++;

            } elseif ($records->contains('Missed')) {

                $vaccinationStatus['missed']++;

            } elseif ($records->contains('Continuing')) {

                $vaccinationStatus['continuing']++;

            } elseif ($records->every(
                fn ($status) => $status === 'Completed'
            )) {

                $vaccinationStatus['completed']++;
            }
        }

        $vaccineUsage = DB::table('patient_records')
            ->join(
                'vaccine',
                'patient_records.vaccine_id',
                '=',
                'vaccine.vaccine_ID'
            )
            ->where('patient_records.status', 'Completed')
            ->select(
                'vaccine.vaccine_name',
                DB::raw('COUNT(patient_records.patient_recordID) as dose_count')
            )
            ->groupBy(
                'vaccine.vaccine_ID',
                'vaccine.vaccine_name'
            )
            ->orderBy('vaccine.vaccine_name')
            ->get();

        $appointmentSummary = DB::table('appointments')
            ->select(
                'status',
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('status')
            ->get();

        return response()->json([
            'overall_coverage' => $report->overall_coverage,
            'complete_series' => $report->complete_series,
            'total_dose_q2' => $report->total_dose_q2,
            'report_year' => $report->report_year,
            'monthly_doses' => $report->monthlyDoses(),

            'vaccination_status' => $vaccinationStatus,
            'vaccine_usage' => $vaccineUsage,
            'appointment_summary' => $appointmentSummary,
        ]);
    }
}