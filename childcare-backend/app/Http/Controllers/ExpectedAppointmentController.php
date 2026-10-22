<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\ExpectedAppointment;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class ExpectedAppointmentController extends Controller
{
    // Generate expected follow-ups from completed appointments.
    public function generate(): JsonResponse
    {
        $appointments = Appointment::with('children')
            ->where('status', 'Completed')
            ->where('appointment_type', 'Vaccination')
            ->get();

        $created = 0;

        foreach ($appointments as $appointment) {
            $expectedDate = Carbon::parse(
                $appointment->appointment_date
            )->addDays(28)->toDateString();

            foreach ($appointment->children as $child) {
                if ($child->status !== 'Continuing') {
                    continue;
                }

                $expected = ExpectedAppointment::firstOrCreate(
                    [
                        'source_appointment_id' => $appointment->appointment_id,
                        'child_id' => $child->child_id,
                    ],
                    [
                        'expected_date' => $expectedDate,
                        'expected_time' => $appointment->appointment_time,
                        'status' => 'Awaiting Confirmation',
                    ]
                );

                if ($expected->wasRecentlyCreated) {
                    $created++;
                }
            }
        }

        return response()->json([
            'message' => 'Expected appointments synchronized.',
            'created' => $created,
        ]);
    }

    // Show expected appointments starting one day before their date.
    // They remain visible until confirmed.
   
public function index(): JsonResponse
{
    $visibleUntil = Carbon::today()
        ->addDay()
        ->toDateString();

    $expectedAppointments = ExpectedAppointment::with([
        'child.user',
        'sourceAppointment.vaccines.vaccine',
    ])
        ->where('status', 'Awaiting Confirmation')
        ->whereDate('expected_date', '<=', $visibleUntil)
        ->orderBy('expected_date')
        ->orderBy('expected_time')
        ->get();

    $groupedAppointments = $expectedAppointments
        ->groupBy(function ($expected) {
            return implode('|', [
                $expected->source_appointment_id,
                $expected->expected_date->format('Y-m-d'),
                $expected->expected_time,
            ]);
        })
        ->map(function ($group) {
            $first = $group->first();

            return [
                'source_appointment_id' =>
                    $first->source_appointment_id,

                'expected_date' =>
                    $first->expected_date->format('Y-m-d'),

                'expected_time' =>
                    $first->expected_time,

                'status' => 'Awaiting Confirmation',

                'source_appointment' =>
                    $first->sourceAppointment,

                'expected_appointment_ids' =>
                    $group->pluck('expected_appointment_id')->values(),

                'children' => $group->map(function ($expected) {
                    return [
                        'expected_appointment_id' =>
                            $expected->expected_appointment_id,

                        'child_id' =>
                            $expected->child_id,

                        'child' =>
                            $expected->child,
                    ];
                })->values(),
            ];
        })
        ->values();

    return response()->json($groupedAppointments);
}

}
