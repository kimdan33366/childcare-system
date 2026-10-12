<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function index()
    {
        // ==========================================
        // LATEST REPORT INFORMATION
        // ==========================================

        $report = Report::latest('report_id')->first();

        // ==========================================
        // ACTIVE CHILDREN
        // Exclude inactive children.
        // ==========================================

        $children = DB::table('children')
            ->where('status', '!=', 'Inactive')
            ->select('child_id', 'status')
            ->get();

        $activeChildrenCount = $children->count();

        // ==========================================
        // COMPLETED CHILDREN AND COVERAGE
        // Use the child's saved status.
        // Do not check individual vaccine doses.
        // ==========================================

        $completedChildrenCount = $children
            ->where('status', 'Completed')
            ->count();

        $overallCoverage = $activeChildrenCount > 0
            ? round(
                ($completedChildrenCount / $activeChildrenCount) * 100,
                2
            )
            : 0;

        // ==========================================
        // VACCINATION STATUS
        // Keep the existing record-based calculation.
        // ==========================================

        $requiredVaccines = [
            'BCG Vaccine' => 1,
            'Hepatitis B Vaccine' => 1,
            'Pentavalent Vaccine' => 3,
            'Oral Polio Vaccine' => 3,
            'Inactivated Polio Vaccine' => 2,
            'Pneumococcal Conjugate Vaccine' => 3,
            'Measles, Mumps, Rubella Vaccine' => 2,
            'Vitamin A' => 2,
        ];

        $vaccinationStatus = [
            'completed' => 0,
            'continuing' => 0,
            'missed' => 0,
            'not_started' => 0,
        ];

        $vaccineIds = DB::table('vaccine')
            ->whereIn('vaccine_name', array_keys($requiredVaccines))
            ->pluck('vaccine_ID', 'vaccine_name');

        foreach ($children as $child) {
            $records = DB::table('patient_records')
                ->where('child_id', $child->child_id)
                ->get(['vaccine_id', 'dose_number', 'status']);

            if ($records->isEmpty()) {
                $vaccinationStatus['not_started']++;
                continue;
            }

            $hasMissed = $records->contains(
                fn ($record) => $record->status === 'Missed'
            );

            $hasContinuing = $records->contains(
                fn ($record) => $record->status === 'Continuing'
            );

            if ($hasMissed) {
                $vaccinationStatus['missed']++;
            } elseif ($hasContinuing) {
                $vaccinationStatus['continuing']++;
            }

            $allRequiredDosesCompleted = true;

            foreach ($requiredVaccines as $vaccineName => $requiredDoseCount) {
                $vaccineId = $vaccineIds->get($vaccineName);

                if ($vaccineId === null) {
                    $allRequiredDosesCompleted = false;
                    break;
                }

                for (
                    $doseNumber = 1;
                    $doseNumber <= $requiredDoseCount;
                    $doseNumber++
                ) {
                    $doseCompleted = $records->contains(
                        function ($record) use ($vaccineId, $doseNumber) {
                            return (int) $record->vaccine_id === (int) $vaccineId
                                && (int) $record->dose_number === $doseNumber
                                && $record->status === 'Completed';
                        }
                    );

                    if (!$doseCompleted) {
                        $allRequiredDosesCompleted = false;
                        break;
                    }
                }

                if (!$allRequiredDosesCompleted) {
                    break;
                }
            }

            if ($allRequiredDosesCompleted) {
                $vaccinationStatus['completed']++;
            } elseif (!$hasMissed && !$hasContinuing) {
                $vaccinationStatus['continuing']++;
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
                'vaccine.vaccine_ID as vaccine_id',
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
        // MONTHLY VACCINATION ACTIVITY
        // Always return all 12 months.
        // ==========================================

        $currentYear = now()->year;

        $monthlyTotals = DB::table('patient_records')
            ->join(
                'children',
                'patient_records.child_id',
                '=',
                'children.child_id'
            )
            ->where('patient_records.status', 'Completed')
            ->where('children.status', '!=', 'Inactive')
            ->whereYear('patient_records.date_taken', $currentYear)
            ->selectRaw(
                'MONTH(patient_records.date_taken) as month_number'
            )
            ->selectRaw(
                'COUNT(patient_records.patient_recordID) as dose_count'
            )
            ->groupByRaw('MONTH(patient_records.date_taken)')
            ->pluck('dose_count', 'month_number');

        $monthNames = [
            1 => 'January',
            2 => 'February',
            3 => 'March',
            4 => 'April',
            5 => 'May',
            6 => 'June',
            7 => 'July',
            8 => 'August',
            9 => 'September',
            10 => 'October',
            11 => 'November',
            12 => 'December',
        ];

        $monthlyDoses = [];

        foreach ($monthNames as $monthNumber => $monthName) {
            $monthlyDoses[] = [
                'month_number' => $monthNumber,
                'month' => $monthName,
                'dose_count' => (int) ($monthlyTotals[$monthNumber] ?? 0),
            ];
        }

        // ==========================================
        // RESPONSE
        // ==========================================

        return response()->json([
            // Based on children.status
            'overall_coverage' => $overallCoverage,
            'complete_series' => $completedChildrenCount,

            'total_dose_q2' => $report?->total_dose_q2 ?? 0,

            'report_year' => $currentYear,

            'monthly_doses' => $monthlyDoses,

            'vaccination_status' => $vaccinationStatus,

            'vaccine_usage' => $vaccineUsage,

            'appointment_summary' => $appointmentSummary,
        ]);
    }
}
