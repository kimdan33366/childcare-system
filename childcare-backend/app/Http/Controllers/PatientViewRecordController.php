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
}