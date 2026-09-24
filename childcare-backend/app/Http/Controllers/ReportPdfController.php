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
        // ==========================================
        // LATEST REPORT INFORMATION
        // ==========================================

        $report = Report::latest('report_id')->first();

        // If no saved report exists, use default values
        // so the PDF can still be generated.
        if (!$report) {
            $report = new Report([
                'overall_coverage' => 0,
                'complete_series' => 0,
                'total_dose_q2' => 0,
                'report_year' => now()->year,
            ]);
        }


        // ==========================================
        // CLINIC INFORMATION
        // ==========================================

        $clinic = ClinicInfo::first();


        // ==========================================
        // ACTIVE CHILDREN
        // ==========================================

        $children = DB::table('children')
            ->where('status', '!=', 'Inactive')
            ->select('child_id')
            ->get();


        // ==========================================
        // VACCINATION STATUS
        // ==========================================

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

            // No vaccination records
            if ($records->isEmpty()) {
                $vaccinationStatus['not_started']++;
                continue;
            }

            // Any missed vaccination
            if ($records->contains('Missed')) {
                $vaccinationStatus['missed']++;
                continue;
            }

            // Any continuing vaccination
            if ($records->contains('Continuing')) {
                $vaccinationStatus['continuing']++;
                continue;
            }

            // All vaccinations completed
            if ($records->every(function ($status) {
                return $status === 'Completed';
            })) {
                $vaccinationStatus['completed']++;
            }
        }


        // ==========================================
        // VACCINE USAGE
        // ==========================================

        $vaccineUsage = DB::table('patient_records')
            ->join(
                'vaccine',
                'patient_records.vaccine_id',
                '=',
                'vaccine.vaccine_ID'
            )
            ->join(
                'children',
                'patient_records.child_id',
                '=',
                'children.child_id'
            )
            ->where('patient_records.status', 'Completed')
            ->where('children.status', '!=', 'Inactive')
            ->select(
                'vaccine.vaccine_name',
                DB::raw(
                    'COUNT(patient_records.patient_recordID) as dose_count'
                )
            )
            ->groupBy(
                'vaccine.vaccine_ID',
                'vaccine.vaccine_name'
            )
            ->orderBy('vaccine.vaccine_name')
            ->get();


        // ==========================================
        // APPOINTMENT SUMMARY
        // ==========================================

        $appointmentSummary = DB::table('appointments')
            ->select(
                'status',
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('status')
            ->get();


        // ==========================================
        // MONTHLY DOSES
        // ==========================================

        $monthlyDoses = $report->monthlyDoses();


        // ==========================================
        // GENERATE PDF
        // ==========================================

        $pdf = Pdf::loadView('reports.pdf', [
            'report' => $report,
            'clinic' => $clinic,
            'vaccinationStatus' => $vaccinationStatus,
            'vaccineUsage' => $vaccineUsage,
            'appointmentSummary' => $appointmentSummary,
            'monthlyDoses' => $monthlyDoses,
        ]);


        // ==========================================
        // DOWNLOAD
        // ==========================================

        return $pdf->download(
            'vaccination-report-' . $report->report_year . '.pdf'
        );
    }
}