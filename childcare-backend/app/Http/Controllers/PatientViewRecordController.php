<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\PatientRecord;
use App\Models\Vaccine;

class PatientViewRecordController extends Controller
{
    // GET vaccination records for a child
    public function getRecords($child_id)
    {
        $records = PatientRecord::with([
            'vaccine',
            'appointment',
            'admin',
            'staff',
        ])
        ->where('child_id', $child_id)
        ->get();

        $records->transform(function ($record) {
            return [
                'patient_recordID' => $record->patient_recordID,
                'child_id' => $record->child_id,
                'appointment_id' => $record->appointment_id,
                'vaccine_id' => $record->vaccine_id,
                'vaccine' => $record->vaccine
                    ? $record->vaccine->vaccine_name
                    : 'Unknown Vaccine',
                'dose' => $record->dose_number,
                'date' => $record->date_taken,
                'status' => $record->status,
                'place' => $record->place,
                'provider' => $record->provider,
                'admin_id' => $record->admin_id,
                'staff_id' => $record->staff_id,
            ];
        });

        return response()->json($records);
    }


    // ADD VACCINATION
    public function store(Request $request)
    {
        $request->validate([
            'child_id' => 'required|integer|exists:children,child_id',
            'appointment_id' => 'nullable|integer|exists:appointments,appointment_id',
            'vaccine_id' => 'required|integer|exists:vaccine,vaccine_ID',
            'dose_number' => 'required|integer|min:1',
            'date_taken' => 'required|date',
            'place' => 'nullable|string|max:255',
            'status' => 'required|in:Continuing,Completed,Missed',
            'provider' => 'nullable|string|max:255',
            'admin_id' => 'nullable|integer|exists:admin,Admin_id',
            'staff_id' => 'nullable|integer|exists:staff,staff_id',
        ]);

        return DB::transaction(function () use ($request) {

            $vaccine = Vaccine::where(
                'vaccine_ID',
                $request->vaccine_id
            )->lockForUpdate()->first();

            if (!$vaccine) {
                return response()->json([
                    'message' => 'Vaccine not found'
                ], 404);
            }

            // Deduct one dose only when vaccination is completed
            if ($request->status === 'Completed') {

                if ($vaccine->stock_quantity <= 0) {
                    return response()->json([
                        'message' => 'This vaccine is out of stock.'
                    ], 400);
                }

                $vaccine->stock_quantity -= 1;
                $vaccine->save();
            }

            $record = PatientRecord::create([
                'child_id' => $request->child_id,
                'appointment_id' => $request->appointment_id,
                'vaccine_id' => $request->vaccine_id,
                'dose_number' => $request->dose_number,
                'date_taken' => $request->date_taken,
                'place' => $request->place,
                'status' => $request->status,
                'provider' => $request->provider,
                'admin_id' => $request->admin_id,
                'staff_id' => $request->staff_id,
            ]);

            return response()->json([
                'message' => 'Vaccination record added successfully',
                'record' => $record->load([
                    'vaccine',
                    'appointment',
                    'admin',
                    'staff',
                ])
            ], 201);
        });
    }


    // UPDATE STATUS ONLY
    public function updateStatus($patient_recordID, Request $request)
    {
        $request->validate([
            'status' => 'required|in:Continuing,Completed,Missed',
        ]);

        return DB::transaction(function () use (
            $patient_recordID,
            $request
        ) {

            $record = PatientRecord::find($patient_recordID);

            if (!$record) {
                return response()->json([
                    'message' => 'Patient record not found'
                ], 404);
            }

            $oldStatus = $record->status;
            $newStatus = $request->status;

            if ($oldStatus === $newStatus) {
                return response()->json([
                    'message' => 'Status unchanged',
                    'record' => $record
                ]);
            }

            $vaccine = Vaccine::where(
                'vaccine_ID',
                $record->vaccine_id
            )->lockForUpdate()->first();

            if (!$vaccine) {
                return response()->json([
                    'message' => 'Vaccine not found'
                ], 404);
            }

            // Continuing/Missed -> Completed
            if (
                $oldStatus !== 'Completed' &&
                $newStatus === 'Completed'
            ) {

                if ($vaccine->stock_quantity <= 0) {
                    return response()->json([
                        'message' => 'This vaccine is out of stock.'
                    ], 400);
                }

                $vaccine->stock_quantity -= 1;
                $vaccine->save();
            }

            // Completed -> Continuing/Missed
            elseif (
                $oldStatus === 'Completed' &&
                $newStatus !== 'Completed'
            ) {

                $vaccine->stock_quantity += 1;
                $vaccine->save();
            }

            $record->status = $newStatus;
            $record->save();

            return response()->json([
                'message' => 'Status updated successfully',
                'record' => $record
            ]);
        });
    }


    // EDIT VACCINATION
    public function update($patient_recordID, Request $request)
    {
        $request->validate([
            'appointment_id' => 'nullable|integer|exists:appointments,appointment_id',
            'vaccine_id' => 'required|integer|exists:vaccine,vaccine_ID',
            'dose_number' => 'required|integer|min:1',
            'date_taken' => 'required|date',
            'status' => 'required|in:Continuing,Completed,Missed',
            'place' => 'nullable|string|max:255',
            'provider' => 'nullable|string|max:255',
            'admin_id' => 'nullable|integer|exists:admin,Admin_id',
            'staff_id' => 'nullable|integer|exists:staff,staff_id',
        ]);

        return DB::transaction(function () use (
            $patient_recordID,
            $request
        ) {

            $record = PatientRecord::find($patient_recordID);

            if (!$record) {
                return response()->json([
                    'message' => 'Patient record not found'
                ], 404);
            }

            $oldVaccineId = $record->vaccine_id;
            $oldStatus = $record->status;

            $newVaccineId = $request->vaccine_id;
            $newStatus = $request->status;

            // Vaccine changed
            if ($oldVaccineId != $newVaccineId) {

                // Return old dose if old record was completed
                if ($oldStatus === 'Completed') {

                    $oldVaccine = Vaccine::where(
                        'vaccine_ID',
                        $oldVaccineId
                    )->lockForUpdate()->first();

                    if ($oldVaccine) {
                        $oldVaccine->stock_quantity += 1;
                        $oldVaccine->save();
                    }
                }

                // Deduct new vaccine if new record is completed
                if ($newStatus === 'Completed') {

                    $newVaccine = Vaccine::where(
                        'vaccine_ID',
                        $newVaccineId
                    )->lockForUpdate()->first();

                    if (!$newVaccine) {
                        return response()->json([
                            'message' => 'New vaccine not found'
                        ], 404);
                    }

                    if ($newVaccine->stock_quantity <= 0) {
                        return response()->json([
                            'message' => 'The new vaccine is out of stock.'
                        ], 400);
                    }

                    $newVaccine->stock_quantity -= 1;
                    $newVaccine->save();
                }
            }

            // Same vaccine, status changed
            else {

                $vaccine = Vaccine::where(
                    'vaccine_ID',
                    $oldVaccineId
                )->lockForUpdate()->first();

                if (!$vaccine) {
                    return response()->json([
                        'message' => 'Vaccine not found'
                    ], 404);
                }

                // Continuing/Missed -> Completed
                if (
                    $oldStatus !== 'Completed' &&
                    $newStatus === 'Completed'
                ) {

                    if ($vaccine->stock_quantity <= 0) {
                        return response()->json([
                            'message' => 'This vaccine is out of stock.'
                        ], 400);
                    }

                    $vaccine->stock_quantity -= 1;
                    $vaccine->save();
                }

                // Completed -> Continuing/Missed
                elseif (
                    $oldStatus === 'Completed' &&
                    $newStatus !== 'Completed'
                ) {

                    $vaccine->stock_quantity += 1;
                    $vaccine->save();
                }
            }

            $record->update([
                'appointment_id' => $request->appointment_id,
                'vaccine_id' => $newVaccineId,
                'dose_number' => $request->dose_number,
                'date_taken' => $request->date_taken,
                'status' => $newStatus,
                'place' => $request->place,
                'provider' => $request->provider,
                'admin_id' => $request->admin_id,
                'staff_id' => $request->staff_id,
            ]);

            return response()->json([
                'message' => 'Vaccination record updated successfully',
                'record' => $record->load([
                    'vaccine',
                    'appointment',
                    'admin',
                    'staff',
                ])
            ]);
        });
    }


    // DELETE VACCINATION RECORD
    public function destroy($patient_recordID)
    {
        return DB::transaction(function () use ($patient_recordID) {

            $record = PatientRecord::find($patient_recordID);

            if (!$record) {
                return response()->json([
                    'message' => 'Patient record not found'
                ], 404);
            }

            // Return stock if completed
            if ($record->status === 'Completed') {

                $vaccine = Vaccine::where(
                    'vaccine_ID',
                    $record->vaccine_id
                )->lockForUpdate()->first();

                if ($vaccine) {
                    $vaccine->stock_quantity += 1;
                    $vaccine->save();
                }
            }

            $record->delete();

            return response()->json([
                'message' => 'Vaccination record deleted successfully'
            ]);
        });
    }
}