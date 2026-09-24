<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\PatientRecord;
use App\Models\Vaccine;
use App\Models\Child;

class PatientViewRecordController extends Controller
{
    // =========================================================
    // SYNC CHILD STATUS FROM VACCINATION RECORDS
    // =========================================================
    private function syncChildStatus($child_id)
    {
        $child = Child::find($child_id);

        if (!$child) {
            return;
        }

        // If the child is manually inactive, do not override it.
        if ($child->status === 'Inactive') {
            return;
        }

        $records = PatientRecord::where(
            'child_id',
            $child_id
        )->get();

        // No vaccination records = Continuing
        if ($records->isEmpty()) {
            $child->status = 'Continuing';
            $child->save();

            return;
        }

        // Child is Completed ONLY when ALL vaccination
        // records are Completed.
        $allCompleted = $records->every(function ($record) {
            return $record->status === 'Completed';
        });

        if ($allCompleted) {
            $child->status = 'Completed';
        } else {
            // Any Continuing or Missed record means
            // the child is still Continuing.
            $child->status = 'Continuing';
        }

        $child->save();
    }


    // =========================================================
    // GET VACCINATION RECORDS FOR A CHILD
    // =========================================================
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

        return response()
            ->json($records)
            ->header(
                'Cache-Control',
                'no-store, no-cache, must-revalidate, max-age=0'
            )
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }


    // =========================================================
    // ADD VACCINATION
    // =========================================================
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
            )
            ->lockForUpdate()
            ->first();

            if (!$vaccine) {
                return response()->json([
                    'message' => 'Vaccine not found'
                ], 404);
            }

            // Deduct stock only when vaccination is completed
            if ($request->status === 'Completed') {

                if ((int) $vaccine->stock_quantity <= 0) {
                    return response()->json([
                        'message' => 'This vaccine is out of stock.'
                    ], 400);
                }

                $vaccine->stock_quantity =
                    (int) $vaccine->stock_quantity - 1;

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

            // IMPORTANT:
            // Update the child status based on ALL vaccination records.
            $this->syncChildStatus($request->child_id);

            $record->load([
                'vaccine',
                'appointment',
                'admin',
                'staff',
            ]);

            $child = Child::find($request->child_id);

            return response()
                ->json([
                    'message' => 'Vaccination record added successfully',
                    'record' => $record,
                    'child_status' => $child?->status,
                ], 201)
                ->header('Cache-Control', 'no-store');
        });
    }


    // =========================================================
    // UPDATE STATUS ONLY
    // =========================================================
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
                    'message' => 'Patient record not found.'
                ], 404);
            }

            $oldStatus = $record->status;
            $newStatus = $request->status;

            // Nothing to change
            if ($oldStatus === $newStatus) {

                $this->syncChildStatus($record->child_id);

                $record->refresh();

                $child = Child::find($record->child_id);

                return response()
                    ->json([
                        'message' => 'Status unchanged.',
                        'record' => $record,
                        'child_status' => $child?->status,
                    ])
                    ->header('Cache-Control', 'no-store');
            }

            // Lock vaccine row while changing stock
            $vaccine = Vaccine::where(
                'vaccine_ID',
                $record->vaccine_id
            )
            ->lockForUpdate()
            ->first();

            if (!$vaccine) {
                return response()->json([
                    'message' => 'Vaccine not found.'
                ], 404);
            }

            // =====================================================
            // CONTINUING / MISSED -> COMPLETED
            // =====================================================

            if (
                $oldStatus !== 'Completed' &&
                $newStatus === 'Completed'
            ) {

                if ((int) $vaccine->stock_quantity <= 0) {
                    return response()->json([
                        'message' => 'This vaccine is out of stock.'
                    ], 400);
                }

                $vaccine->stock_quantity =
                    (int) $vaccine->stock_quantity - 1;

                $vaccine->save();
            }

            // =====================================================
            // COMPLETED -> CONTINUING / MISSED
            // =====================================================

            if (
                $oldStatus === 'Completed' &&
                $newStatus !== 'Completed'
            ) {

                $vaccine->stock_quantity =
                    (int) $vaccine->stock_quantity + 1;

                $vaccine->save();
            }

            // =====================================================
            // SAVE NEW VACCINATION STATUS
            // =====================================================

            $record->status = $newStatus;
            $record->save();

            // =====================================================
            // IMPORTANT:
            // RECALCULATE CHILD STATUS
            // =====================================================

            $this->syncChildStatus($record->child_id);

            $record->refresh();

            $record->load([
                'vaccine',
                'appointment',
                'admin',
                'staff',
            ]);

            $child = Child::find($record->child_id);

            return response()
                ->json([
                    'message' => 'Status updated successfully.',
                    'record' => $record,
                    'child_status' => $child?->status,
                ])
                ->header(
                    'Cache-Control',
                    'no-store, no-cache, must-revalidate, max-age=0'
                )
                ->header('Pragma', 'no-cache')
                ->header('Expires', '0');
        });
    }


    // =========================================================
    // EDIT FULL VACCINATION RECORD
    // =========================================================
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
                    'message' => 'Patient record not found.'
                ], 404);
            }

            $oldChildId = $record->child_id;
            $oldVaccineId = $record->vaccine_id;
            $oldStatus = $record->status;

            $newVaccineId = $request->vaccine_id;
            $newStatus = $request->status;

            // =====================================================
            // VACCINE CHANGED
            // =====================================================

            if ($oldVaccineId != $newVaccineId) {

                // Return old stock if old record was completed
                if ($oldStatus === 'Completed') {

                    $oldVaccine = Vaccine::where(
                        'vaccine_ID',
                        $oldVaccineId
                    )
                    ->lockForUpdate()
                    ->first();

                    if ($oldVaccine) {
                        $oldVaccine->stock_quantity =
                            (int) $oldVaccine->stock_quantity + 1;

                        $oldVaccine->save();
                    }
                }

                // Deduct new stock if new record is completed
                if ($newStatus === 'Completed') {

                    $newVaccine = Vaccine::where(
                        'vaccine_ID',
                        $newVaccineId
                    )
                    ->lockForUpdate()
                    ->first();

                    if (!$newVaccine) {
                        return response()->json([
                            'message' => 'New vaccine not found.'
                        ], 404);
                    }

                    if ((int) $newVaccine->stock_quantity <= 0) {
                        return response()->json([
                            'message' => 'The new vaccine is out of stock.'
                        ], 400);
                    }

                    $newVaccine->stock_quantity =
                        (int) $newVaccine->stock_quantity - 1;

                    $newVaccine->save();
                }
            }

            // =====================================================
            // SAME VACCINE, STATUS CHANGED
            // =====================================================

            else {

                $vaccine = Vaccine::where(
                    'vaccine_ID',
                    $oldVaccineId
                )
                ->lockForUpdate()
                ->first();

                if (!$vaccine) {
                    return response()->json([
                        'message' => 'Vaccine not found.'
                    ], 404);
                }

                // Continuing / Missed -> Completed
                if (
                    $oldStatus !== 'Completed' &&
                    $newStatus === 'Completed'
                ) {

                    if ((int) $vaccine->stock_quantity <= 0) {
                        return response()->json([
                            'message' => 'This vaccine is out of stock.'
                        ], 400);
                    }

                    $vaccine->stock_quantity =
                        (int) $vaccine->stock_quantity - 1;

                    $vaccine->save();
                }

                // Completed -> Continuing / Missed
                elseif (
                    $oldStatus === 'Completed' &&
                    $newStatus !== 'Completed'
                ) {

                    $vaccine->stock_quantity =
                        (int) $vaccine->stock_quantity + 1;

                    $vaccine->save();
                }
            }

            // =====================================================
            // SAVE RECORD
            // =====================================================

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

            // =====================================================
            // RECALCULATE CHILD STATUS
            // =====================================================

            $this->syncChildStatus($oldChildId);

            $record->refresh();

            $record->load([
                'vaccine',
                'appointment',
                'admin',
                'staff',
            ]);

            $child = Child::find($oldChildId);

            return response()
                ->json([
                    'message' => 'Vaccination record updated successfully.',
                    'record' => $record,
                    'child_status' => $child?->status,
                ])
                ->header('Cache-Control', 'no-store');
        });
    }


    // =========================================================
    // DELETE VACCINATION RECORD
    // =========================================================
    public function destroy($patient_recordID)
    {
        return DB::transaction(function () use ($patient_recordID) {

            $record = PatientRecord::find($patient_recordID);

            if (!$record) {
                return response()->json([
                    'message' => 'Patient record not found.'
                ], 404);
            }

            $childId = $record->child_id;

            // Return stock if completed
            if ($record->status === 'Completed') {

                $vaccine = Vaccine::where(
                    'vaccine_ID',
                    $record->vaccine_id
                )
                ->lockForUpdate()
                ->first();

                if ($vaccine) {

                    $vaccine->stock_quantity =
                        (int) $vaccine->stock_quantity + 1;

                    $vaccine->save();
                }
            }

            $record->delete();

            // Recalculate child status after deletion.
            // If there are remaining records and all are completed,
            // child becomes Completed.
            // Otherwise child becomes Continuing.
            $this->syncChildStatus($childId);

            $child = Child::find($childId);

            return response()
                ->json([
                    'message' => 'Vaccination record deleted successfully.',
                    'child_status' => $child?->status,
                ])
                ->header('Cache-Control', 'no-store');
        });
    }
}