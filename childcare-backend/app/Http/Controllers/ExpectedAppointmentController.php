<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\ExpectedAppointment;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ExpectedAppointmentController extends Controller
{
    public function generate(): JsonResponse
    {
        $appointments = Appointment::with('children')
            ->where('status', 'Completed')
            ->where('appointment_type', 'Vaccination')
            ->get();

        $created = 0;

        foreach ($appointments as $appointment) {
            $expectedDate = Carbon::parse($appointment->appointment_date)
                ->addDays(28)->toDateString();

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

    
public function index(): JsonResponse
{
    $expectedAppointments = ExpectedAppointment::with([
        'child.user',
        'sourceAppointment.vaccines.vaccine',
    ])
        ->where('status', 'Awaiting Confirmation')
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
                'source_appointment_id' => $first->source_appointment_id,
                'expected_date' => $first->expected_date->format('Y-m-d'),
                'expected_time' => $first->expected_time,
                'status' => 'Awaiting Confirmation',
                'source_appointment' => $first->sourceAppointment,
                'expected_appointment_ids' => $group->pluck('expected_appointment_id')->values(),
                'children' => $group->map(function ($expected) {
                    return [
                        'expected_appointment_id' => $expected->expected_appointment_id,
                        'child_id' => $expected->child_id,
                        'child' => $expected->child,
                    ];
                })->values(),
            ];
        })
        ->values();

    return response()->json($groupedAppointments);
}


    /**
     * Reschedule only the expected rows selected in one visible group.
     * No actual appointment is created and vaccine stock is not touched.
     */
    public function reschedule(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'expected_appointment_ids' => 'required|array|min:1',
            'expected_appointment_ids.*' => 'required|integer|distinct|exists:expected_appointments,expected_appointment_id',
            'expected_date' => 'required|date_format:Y-m-d|after_or_equal:today',
            'expected_time' => 'required|date_format:H:i',
        ]);

        $updated = DB::transaction(function () use ($validated) {
            $ids = $validated['expected_appointment_ids'];
            $records = ExpectedAppointment::whereIn('expected_appointment_id', $ids)
                ->orderBy('expected_appointment_id')
                ->lockForUpdate()
                ->get();

            if ($records->count() !== count($ids)) {
                throw ValidationException::withMessages([
                    'expected_appointment_ids' => ['Some expected appointments no longer exist.'],
                ]);
            }

            if ($records->contains(fn ($record) => $record->status !== 'Awaiting Confirmation')) {
                throw ValidationException::withMessages([
                    'expected_appointment_ids' => ['One or more expected appointments are already confirmed. Refresh the page.'],
                ]);
            }

            $sourceIds = $records->pluck('source_appointment_id')->unique();
            $dates = $records->map(fn ($record) => Carbon::parse($record->expected_date)->toDateString())->unique();
            $times = $records->pluck('expected_time')->map(fn ($time) => substr((string) $time, 0, 5))->unique();
            if ($sourceIds->count() !== 1 || $dates->count() !== 1 || $times->count() !== 1) {
                throw ValidationException::withMessages([
                    'expected_appointment_ids' => ['Selected expected appointments must belong to the same group.'],
                ]);
            }

            foreach ($records as $record) {
                $record->expected_date = $validated['expected_date'];
                $record->expected_time = $validated['expected_time'];
                $record->save();
            }

            return $records->count();
        });

        return response()->json([
            'message' => 'Expected appointment group rescheduled successfully.',
            'updated' => $updated,
        ]);
    }

    /** Preview vaccine history; suggestions are NOT clinical eligibility decisions. */
    public function preview(Request $request): JsonResponse
    {
        $ids = array_values(array_unique(array_filter(array_map('intval', explode(',', (string) $request->query('ids', ''))))));
        if (!$ids) return response()->json(['message' => 'Select an expected appointment.'], 422);
        $records = ExpectedAppointment::with('child')->whereIn('expected_appointment_id', $ids)->get();
        if ($records->count() !== count($ids) || $records->contains(fn ($r) => $r->status !== 'Awaiting Confirmation')) {
            return response()->json(['message' => 'Expected appointments have changed. Refresh the page.'], 409);
        }
        $vaccines = \App\Models\Vaccine::all();
        $children = $records->map(function ($record) use ($vaccines) {
            $history = \App\Models\PatientRecord::where('child_id', $record->child_id)
                ->where('status', 'Completed')->whereNotNull('vaccine_id')->get();
            $pending = \App\Models\Appointment::where('status', 'Pending')
                ->whereHas('children', fn ($q) => $q->where('children.child_id', $record->child_id))
                ->with('vaccines')->get()->flatMap(fn ($a) => $a->vaccines);
            return [
                'child_id' => $record->child_id,
                'vaccines' => $vaccines->map(function ($vaccine) use ($history, $pending) {
                    $completed = $history->where('vaccine_id', $vaccine->vaccine_ID);
                    $next = ((int) $completed->max('dose_number')) + 1;
                    return [
                        'vaccine_id' => $vaccine->vaccine_ID,
                        'vaccine_name' => $vaccine->vaccine_name,
                        'next_dose' => $next,
                        'stock_quantity' => (int) $vaccine->stock_quantity,
                        'expired' => $vaccine->expiration_date && Carbon::parse($vaccine->expiration_date)->startOfDay()->lt(Carbon::today()),
                        'already_completed' => $completed->contains(fn ($r) => (int) $r->dose_number === $next),
                        'already_pending' => $pending->contains(fn ($r) => (int) $r->vaccine_id === (int) $vaccine->vaccine_ID && (int) $r->dose_number === $next),
                    ];
                })->values(),
            ];
        })->values();
        return response()->json(['children' => $children]);
    }

    /** Atomically create one Pending appointment per child and mark expected rows Confirmed. */
    public function confirm(Request $request): JsonResponse
    {
        $data = $request->validate([
            'expected_appointment_ids' => 'required|array|min:1',
            'expected_appointment_ids.*' => 'required|integer|distinct|exists:expected_appointments,expected_appointment_id',
            'selections' => 'required|array|min:1',
            'selections.*.child_id' => 'required|integer|distinct|exists:children,child_id',
            'selections.*.vaccines' => 'required|array|min:1',
            'selections.*.vaccines.*.vaccine_id' => 'required|integer|exists:vaccine,vaccine_ID',
            'selections.*.vaccines.*.dose_number' => 'required|integer|min:1',
        ]);
        $createdIds = DB::transaction(function () use ($data, $request) {
            $records = ExpectedAppointment::whereIn('expected_appointment_id', $data['expected_appointment_ids'])
                ->orderBy('expected_appointment_id')->lockForUpdate()->get();
            if ($records->count() !== count($data['expected_appointment_ids']) ||
                $records->contains(fn ($r) => $r->status !== 'Awaiting Confirmation' || $r->confirmed_appointment_id !== null)) {
                throw ValidationException::withMessages(['expected_appointment_ids' => ['Expected appointments were already processed. Refresh the page.']]);
            }
            if ($records->pluck('source_appointment_id')->unique()->count() !== 1 ||
                $records->pluck('expected_date')->map(fn ($d) => Carbon::parse($d)->toDateString())->unique()->count() !== 1 ||
                $records->pluck('expected_time')->unique()->count() !== 1) {
                throw ValidationException::withMessages(['expected_appointment_ids' => ['The selected rows are not in the same group.']]);
            }
            $selections = collect($data['selections'])->keyBy('child_id');
            if ($selections->count() !== $records->count() || $records->contains(fn ($r) => !$selections->has($r->child_id))) {
                throw ValidationException::withMessages(['selections' => ['Select vaccines for every child in this expected group.']]);
            }
            $source = Appointment::findOrFail($records->first()->source_appointment_id);
            if ($source->status !== 'Completed') {
                throw ValidationException::withMessages(['expected_appointment_ids' => ['The original appointment is no longer Completed.']]);
            }
            $adminId = $request->user()?->Admin_id ?? $source->admin_id;
            $created = [];
            foreach ($records as $record) {
                if ($record->child?->status !== 'Continuing') {
                    throw ValidationException::withMessages(['selections' => ['One of the children is no longer Continuing.']]);
                }
                $selected = $selections->get($record->child_id)['vaccines'];
                $unique = collect($selected)->pluck('vaccine_id')->unique();
                if ($unique->count() !== count($selected)) {
                    throw ValidationException::withMessages(['selections' => ['Select each vaccine only once per child.']]);
                }
                foreach ($selected as $entry) {
                    $vaccineId = (int) $entry['vaccine_id'];
                    $dose = (int) $entry['dose_number'];
                    $alreadyDone = \App\Models\PatientRecord::where('child_id', $record->child_id)
                        ->where('vaccine_id', $vaccineId)->where('dose_number', $dose)
                        ->where('status', 'Completed')->exists();
                    if ($alreadyDone) throw ValidationException::withMessages(['selections' => ['A selected dose is already Completed.']]);
                    $pending = Appointment::where('status', 'Pending')
                        ->whereHas('children', fn ($q) => $q->where('children.child_id', $record->child_id))
                        ->whereHas('vaccines', fn ($q) => $q->where('vaccine_id', $vaccineId)->where('dose_number', $dose))->exists();
                    if ($pending) throw ValidationException::withMessages(['selections' => ['A selected dose is already in a Pending appointment.']]);
                    $vaccine = \App\Models\Vaccine::where('vaccine_ID', $vaccineId)->lockForUpdate()->firstOrFail();
                    if ($vaccine->expiration_date && Carbon::parse($vaccine->expiration_date)->startOfDay()->lt(Carbon::today())) {
                        throw ValidationException::withMessages(['selections' => ["{$vaccine->vaccine_name} is expired."]]);
                    }
                    if ((int) $vaccine->stock_quantity < 1) {
                        throw ValidationException::withMessages(['selections' => ["{$vaccine->vaccine_name} is out of stock."]]);
                    }
                    $vaccine->stock_quantity -= 1;
                    $vaccine->status = $vaccine->stock_quantity <= 0 ? 'Out of Stock' : 'Available';
                    $vaccine->save();
                }
                $appointment = Appointment::create([
                    'admin_id' => $adminId,
                    'staff_id' => $source->staff_id,
                    'appointment_date' => Carbon::parse($record->expected_date)->toDateString(),
                    'appointment_time' => $record->expected_time,
                    'address' => $source->address,
                    'appointment_type' => 'Vaccination',
                    'status' => 'Pending',
                ]);
                $appointment->children()->attach($record->child_id);
                foreach ($selected as $entry) {
                    $appointment->vaccines()->create(['vaccine_id' => $entry['vaccine_id'], 'dose_number' => $entry['dose_number']]);
                }
                $record->status = 'Confirmed';
                $record->confirmed_appointment_id = $appointment->appointment_id;
                $record->save();
                $created[] = $appointment->appointment_id;
            }
            return $created;
        });
        return response()->json(['message' => 'Confirmed and moved to Pending appointments.', 'appointment_ids' => $createdIds], 201);
    }

}
