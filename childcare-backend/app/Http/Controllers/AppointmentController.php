<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AppointmentController extends Controller
{
    // Get all appointments
    public function index()
    {
        $appointments = Appointment::with([
            'admin',
            'staff',
            'children',
            'vaccines.vaccine',
            'growthRecords',
            'patientRecords',
        ])->get();

        return response()->json($appointments);
    }

    // Create an appointment
    public function store(Request $request)
    {
        $request->validate([
            'admin_id' => 'nullable|integer|exists:admin,Admin_id',
            'staff_id' => 'nullable|integer|exists:staff,staff_id',

            'appointment_date' => 'required|date',
            'appointment_time' => 'required',
            'address' => 'nullable|string|max:255',
            'appointment_type' => 'required|string|max:100',

            'status' => 'nullable|in:Pending,Completed,Missed,Cancelled',

            'child_ids' => 'nullable|array',
            'child_ids.*' => 'integer|exists:children,child_id',

            'vaccines' => 'nullable|array',
            'vaccines.*.vaccine_id' => 'required|integer|exists:vaccine,vaccine_ID',
            'vaccines.*.dose_number' => 'required|integer|min:1',
        ]);

        DB::beginTransaction();

        try {
            $appointment = Appointment::create([
                'admin_id' => $request->admin_id,
                'staff_id' => $request->staff_id,
                'appointment_date' => $request->appointment_date,
                'appointment_time' => $request->appointment_time,
                'address' => $request->address,
                'appointment_type' => $request->appointment_type,
                'status' => $request->status ?? 'Pending',
            ]);

            // Attach children
            if ($request->filled('child_ids')) {
                $appointment->children()->sync($request->child_ids);
            }

            // Attach vaccines and doses
            if ($request->filled('vaccines')) {
                foreach ($request->vaccines as $vaccine) {
                    $appointment->vaccines()->create([
                        'vaccine_id' => $vaccine['vaccine_id'],
                        'dose_number' => $vaccine['dose_number'],
                    ]);
                }
            }

            DB::commit();

            return response()->json(
                $appointment->load([
                    'admin',
                    'staff',
                    'children',
                    'vaccines.vaccine',
                ]),
                201
            );

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to create appointment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // Get one appointment
    public function show($id)
    {
        $appointment = Appointment::with([
            'admin',
            'staff',
            'children',
            'vaccines.vaccine',
            'growthRecords',
            'patientRecords',
        ])->find($id);

        if (!$appointment) {
            return response()->json([
                'message' => 'Appointment not found'
            ], 404);
        }

        return response()->json($appointment);
    }

    // Update an appointment
    public function update(Request $request, $id)
    {
        $appointment = Appointment::find($id);

        if (!$appointment) {
            return response()->json([
                'message' => 'Appointment not found'
            ], 404);
        }

        $request->validate([
            'admin_id' => 'nullable|integer|exists:admin,Admin_id',
            'staff_id' => 'nullable|integer|exists:staff,staff_id',

            'appointment_date' => 'sometimes|date',
            'appointment_time' => 'sometimes',
            'address' => 'nullable|string|max:255',
            'appointment_type' => 'sometimes|string|max:100',

            'status' => 'nullable|in:Pending,Completed,Missed,Cancelled',

            'child_ids' => 'sometimes|array',
            'child_ids.*' => 'integer|exists:children,child_id',

            'vaccines' => 'sometimes|array',
            'vaccines.*.vaccine_id' => 'required|integer|exists:vaccine,vaccine_ID',
            'vaccines.*.dose_number' => 'required|integer|min:1',
        ]);

        DB::beginTransaction();

        try {
            $appointment->update($request->only([
                'admin_id',
                'staff_id',
                'appointment_date',
                'appointment_time',
                'address',
                'appointment_type',
                'status',
            ]));

            // Update children only when child_ids are provided
            if ($request->has('child_ids')) {
                $appointment->children()->sync(
                    $request->child_ids ?? []
                );
            }

            // Update vaccines only when vaccines are provided
            if ($request->has('vaccines')) {
                $appointment->vaccines()->delete();

                foreach ($request->vaccines ?? [] as $vaccine) {
                    $appointment->vaccines()->create([
                        'vaccine_id' => $vaccine['vaccine_id'],
                        'dose_number' => $vaccine['dose_number'],
                    ]);
                }
            }

            DB::commit();

            return response()->json(
                $appointment->load([
                    'admin',
                    'staff',
                    'children',
                    'vaccines.vaccine',
                ])
            );

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to update appointment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // Historical appointments should not be deleted
    public function destroy($id)
    {
        $appointment = Appointment::find($id);

        if (!$appointment) {
            return response()->json([
                'message' => 'Appointment not found'
            ], 404);
        }

        return response()->json([
            'message' => 'Appointments cannot be deleted because appointment history must be preserved.'
        ], 403);
    }
}