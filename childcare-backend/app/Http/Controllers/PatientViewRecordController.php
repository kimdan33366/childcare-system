<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\PatientRecord;
use App\Models\Vaccine;

class PatientViewRecordController extends Controller
{
    public function getRecords($child_id)
    {
        $records = PatientRecord::where('child_id', $child_id)
            ->get();

        $records->transform(function ($record) {
            $vaccine = Vaccine::where(
                'vaccine_ID',
                $record->vaccine_id
            )->first();

            return [
                'patient_recordID' => $record->patient_recordID,
                'child_id' => $record->child_id,
                'vaccine_id' => $record->vaccine_id,
                'vaccine' => $vaccine
                    ? $vaccine->vaccine_name
                    : 'Unknown Vaccine',
                'dose' => $record->dose_number,
                'date' => $record->date_taken,
                'status' => $record->status,
                'place' => $record->place,
                'provider' => $record->provider,
            ];
        });

        return response()->json($records);
    }


    // ADD VACCINATION
    public function store(Request $request)
    {
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

            // Only Completed vaccinations use one dose
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
                'vaccine_id' => $request->vaccine_id,
                'dose_number' => $request->dose_number,
                'date_taken' => $request->date_taken,
                'place' => $request->place,
                'status' => $request->status,
                'provider' => $request->provider,
            ]);

            return response()->json([
                'message' => 'Vaccination record added successfully',
                'record' => $record
            ], 201);
        });
    }


    // UPDATE STATUS ONLY
    public function updateStatus($patient_recordID, Request $request)
    {
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

            // Nothing changed
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

            /*
             * If the vaccine itself is changed,
             * return the old completed dose to the old vaccine.
             */
            if ($oldVaccineId != $newVaccineId) {

                // Return old dose if old record was Completed
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

                // Deduct new vaccine if new record is Completed
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

            /*
             * Same vaccine, but status changed
             */
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
                'vaccine_id' => $newVaccineId,
                'dose_number' => $request->dose_number,
                'date_taken' => $request->date_taken,
                'status' => $newStatus,
                'place' => $request->place,
                'provider' => $request->provider,
            ]);

            return response()->json([
                'message' => 'Vaccination record updated successfully',
                'record' => $record
            ]);
        });
    }
    public function destroy($patient_recordID)
{
    return DB::transaction(function () use ($patient_recordID) {

        $record = PatientRecord::find($patient_recordID);

        if (!$record) {
            return response()->json([
                'message' => 'Patient record not found'
            ], 404);
        }

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