<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
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
                'vaccine' => $vaccine ? $vaccine->vaccine_name : 'Unknown Vaccine',
                'dose' => $record->dose_number,
                'date' => $record->date_taken,
                'status' => $record->status,
                'place' => $record->place,
                'provider' => $record->provider,
            ];
        });

        return response()->json($records);
    }

        public function store(Request $request)
{
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
}

    public function updateStatus($patient_recordID, Request $request)
{
    $record = PatientRecord::find($patient_recordID);

    if (!$record) {
        return response()->json([
            'message' => 'Patient record not found'
        ], 404);
    }

    $record->status = $request->status;
    $record->save();

    return response()->json([
        'message' => 'Status updated successfully',
        'record' => $record
    ]);
}
public function update($patient_recordID, Request $request)
{
    $record = PatientRecord::find($patient_recordID);

    if (!$record) {
        return response()->json([
            'message' => 'Patient record not found'
        ], 404);
    }

    $record->update([
        'vaccine_id' => $request->vaccine_id,
        'dose_number' => $request->dose_number,
        'date_taken' => $request->date_taken,
        'status' => $request->status,
        'place' => $request->place,
        'provider' => $request->provider,
    ]);

    return response()->json([
        'message' => 'Vaccination record updated successfully',
        'record' => $record
    ]);
}
}