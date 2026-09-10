<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    // Get all appointments
    public function index()
    {
        return response()->json(
            Appointment::all()
        );
    }

    // Create an appointment
    public function store(Request $request)
    {
        $request->validate([
            'admin_id' => 'nullable|integer',
            'child_id' => 'nullable|integer',
            'user_id' => 'nullable|integer',
            'appointment_date' => 'required|date',
            'appointment_time' => 'required',
            'address' => 'nullable|string|max:255',
            'subject' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:255',
        ]);

        $appointment = Appointment::create([
            'admin_id' => $request->admin_id,
            'child_id' => $request->child_id,
            'user_id' => $request->user_id,
            'appointment_date' => $request->appointment_date,
            'appointment_time' => $request->appointment_time,
            'address' => $request->address,
            'subject' => $request->subject,
            'status' => $request->status,
        ]);

        return response()->json($appointment, 201);
    }

    // Get one appointment
    public function show($id)
    {
        $appointment = Appointment::find($id);

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

        $appointment->update($request->only([
            'admin_id',
            'child_id',
            'user_id',
            'appointment_date',
            'appointment_time',
            'address',
            'subject',
            'status',
        ]));

        return response()->json($appointment);
    }

    // Delete an appointment
    public function destroy($id)
    {
        $appointment = Appointment::find($id);

        if (!$appointment) {
            return response()->json([
                'message' => 'Appointment not found'
            ], 404);
        }

        $appointment->delete();

        return response()->json([
            'message' => 'Appointment deleted successfully'
        ]);
    }
}