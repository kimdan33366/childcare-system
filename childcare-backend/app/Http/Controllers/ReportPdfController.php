<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\ClinicInfo;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportPdfController extends Controller
{
    public function export()
    {
        $report = Report::latest('report_id')->first();

        if (!$report) {
            return response()->json([
                'message' => 'No report found.'
            ], 404);
        }

        $clinic = ClinicInfo::first();

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

        $monthlyDoses = $report->monthlyDoses();

        $pdf = Pdf::loadView('reports.pdf', [
            'report' => $report,
            'clinic' => $clinic,
            'vaccinationStatus' => $vaccinationStatus,
            'vaccineUsage' => $vaccineUsage,
            'appointmentSummary' => $appointmentSummary,
            'monthlyDoses' => $monthlyDoses,
        ]);

        return $pdf->download(
            'vaccination-report-' . $report->report_year . '.pdf'
        );
    }
}