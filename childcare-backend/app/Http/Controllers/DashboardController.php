<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Child;
use App\Models\Vaccination;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        // Total children
        $children = Child::count();

        // Vaccination counts
        $overdue = Vaccination::where('status', 'Overdue')->count();

        $dueSoon = Vaccination::where('status', 'Due Soon')->count();

        $dosesGiven = Vaccination::where('status', 'Completed')->count();

        // Monthly doses by vaccine
        $monthlyDoses = DB::table('vaccinations')
            ->join(
                'vaccine',
                'vaccinations.vaccine_id',
                '=',
                'vaccine.vaccine_ID'
            )
            ->whereMonth(
                'vaccinations.vaccination_date',
                now()->month
            )
            ->whereYear(
                'vaccinations.vaccination_date',
                now()->year
            )
            ->where(
                'vaccinations.status',
                'Completed'
            )
            ->select(
                'vaccine.vaccine_name as name',
                DB::raw('COUNT(*) as value')
            )
            ->groupBy('vaccine.vaccine_name')
            ->get();

        // Status breakdown
        $statusBreakdown = Vaccination::select(
                'status as name',
                DB::raw('COUNT(*) as value')
            )
            ->groupBy('status')
            ->get();

        return response()->json([
            'users' => User::count(),
            'children' => $children,
            'overdue' => $overdue,
            'due_soon' => $dueSoon,
            'doses_given' => $dosesGiven,
            'monthly_doses' => $monthlyDoses,
            'status_breakdown' => $statusBreakdown,
        ]);
    }
}