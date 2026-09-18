<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Child;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        // ==========================================
        // TOTAL CHILDREN
        // ==========================================

        $children = Child::count();


        // ==========================================
        // VACCINATION STATUS
        // ==========================================

        $vaccinationStatus = [
            'completed' => 0,
            'continuing' => 0,
            'missed' => 0,
            'not_started' => 0,
        ];

        $allChildren = Child::select('child_id')->get();

        foreach ($allChildren as $child) {

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


        // ==========================================
        // DOSES GIVEN
        // ==========================================

        $dosesGiven = DB::table('patient_records')
            ->where('status', 'Completed')
            ->count();


        // ==========================================
        // MONTHLY DOSES
        // ==========================================

        $monthlyDoses = DB::table('patient_records')
            ->join(
                'vaccine',
                'patient_records.vaccine_id',
                '=',
                'vaccine.vaccine_ID'
            )
            ->where('patient_records.status', 'Completed')
            ->whereMonth(
                'patient_records.date_taken',
                now()->month
            )
            ->whereYear(
                'patient_records.date_taken',
                now()->year
            )
            ->select(
                'vaccine.vaccine_name as name',
                DB::raw('COUNT(*) as value')
            )
            ->groupBy(
                'vaccine.vaccine_ID',
                'vaccine.vaccine_name'
            )
            ->get();


        // ==========================================
        // STATUS BREAKDOWN
        // ==========================================

        $statusBreakdown = [
            [
                'name' => 'Completed',
                'value' => $vaccinationStatus['completed'],
            ],
            [
                'name' => 'Continuing',
                'value' => $vaccinationStatus['continuing'],
            ],
            [
                'name' => 'Missed',
                'value' => $vaccinationStatus['missed'],
            ],
            [
                'name' => 'Not Started',
                'value' => $vaccinationStatus['not_started'],
            ],
        ];


        // ==========================================
        // RESPONSE
        // ==========================================

        return response()->json([
            'users' => User::count(),

            'children' => $children,

            'overdue' => 0,
            'active_user'=>User::where('status','Active')->count(),

            'doses_given' => $dosesGiven,

            'monthly_doses' => $monthlyDoses,

            'status_breakdown' => $statusBreakdown,
        ]);
    }
}