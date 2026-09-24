<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Child;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        // ==========================================
        // TOTAL ACTIVE USERS
        // ==========================================

        $activeUsers = User::where('status', 'Active')->count();


        // ==========================================
        // TOTAL ACTIVE CHILDREN
        // ==========================================

        $children = Child::where('status', '!=', 'Inactive')->count();


        // ==========================================
        // VACCINATION STATUS
        // ==========================================

        $vaccinationStatus = [
            'completed' => 0,
            'continuing' => 0,
            'missed' => 0,
            'not_started' => 0,
        ];

        $allChildren = Child::where('status', '!=', 'Inactive')
            ->with('patientRecords')
            ->get();

        foreach ($allChildren as $child) {

            $records = $child->patientRecords;

            // No vaccination records
            if ($records->isEmpty()) {
                $vaccinationStatus['not_started']++;
                continue;
            }

            // Any missed vaccination
            if ($records->contains(function ($record) {
                return $record->status === 'Missed';
            })) {
                $vaccinationStatus['missed']++;
                continue;
            }

            // Any continuing vaccination
            if ($records->contains(function ($record) {
                return $record->status === 'Continuing';
            })) {
                $vaccinationStatus['continuing']++;
                continue;
            }

            // All vaccination records completed
            if ($records->every(function ($record) {
                return $record->status === 'Completed';
            })) {
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
        // APPOINTMENT STATUS
        // ==========================================

        $pendingAppointments = DB::table('appointments')
            ->where('status', 'Pending')
            ->count();

        $completedAppointments = DB::table('appointments')
            ->where('status', 'Completed')
            ->count();

        $missedAppointments = DB::table('appointments')
            ->where('status', 'Missed')
            ->count();


        // ==========================================
        // OVERDUE APPOINTMENTS
        // ==========================================
        // A pending appointment is considered overdue
        // when its scheduled date and time have already passed.

        $now = Carbon::now();

        $overdue = DB::table('appointments')
            ->where('status', 'Pending')
            ->where(function ($query) use ($now) {
                $query->whereDate(
                    'appointment_date',
                    '<',
                    $now->toDateString()
                )->orWhere(function ($query) use ($now) {
                    $query->whereDate(
                        'appointment_date',
                        '=',
                        $now->toDateString()
                    )->whereTime(
                        'appointment_time',
                        '<',
                        $now->toTimeString()
                    );
                });
            })
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
            'users' => $activeUsers,

            'children' => $children,

            'overdue' => $overdue,

            'active_user' => $activeUsers,

            'doses_given' => $dosesGiven,

            'pending_appointments' => $pendingAppointments,

            'completed_appointments' => $completedAppointments,

            'missed_appointments' => $missedAppointments,

            'monthly_doses' => $monthlyDoses,

            'status_breakdown' => $statusBreakdown,
        ]);
    }
}