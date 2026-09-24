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

        // Do not override a manually inactive child.
        if ($child->status === 'Inactive') {
            return;
        }

        $records = PatientRecord::where(
            'child_id',
            $child_id
        )->get();

        // No vaccination records = Continuing
        if ($records->isEmpty()) {
            $child->update([
                'status' => 'Continuing'
            ]);

            return;
        }

        // Any Missed or Continuing record means
        // the child's vaccination status is Continuing.
        $hasIncompleteRecord = $records->contains(function ($record) {
            return in_array(
                $record->status,
                ['Continuing', 'Missed']
            );
        });

        if ($hasIncompleteRecord) {
            $child->update([
                'status' => 'Continuing'
            ]);

            return;
        }

        // If all vaccination records are Completed,
        // the child is Completed.
        $allCompleted = $records->every(function ($record) {
            return $record->status === 'Completed';
        });

        $child->update([
            'status' => $allCompleted
                ? 'Completed'
                : 'Continuing'
        ]);
    }


    // =========================================================
    // GET VACCINATION RECORDS FOR A CHILD
    // =========================================================
    public function getRecords($child_id)
    {
        $child = Child::find($child_id);

        if (!$child) {
            return response()->json([
                'message' => 'Child not found.'
            ], 404);
        }

        $records = PatientRecord::with([
            'vaccine',
            'appointment',
            'admin',
            'staff',
        ])
            ->where('child_id', $child_id)
            ->orderByDesc('date_taken')
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

            // ==============================================
            // CHECK CHILD
            // ==============================================

            $child = Child::find($request->child_id);

            if (!$child) {
                return response()->json([
                    'message' => 'Child not found.'
                ], 404);
            }

            if ($child->status === 'Inactive') {
                return response()->json([
                    'message' => 'Cannot add a vaccination record to an inactive child.'
                ], 422);
            }


            // ==============================================
            // LOCK VACCINE
            // ==============================================

            $vaccine = Vaccine::where(
                'vaccine_ID',
                $request->vaccine_id
            )
                ->lockForUpdate()
                ->first();

            if (!$vaccine) {
                return response()->json([
                    'message' => 'Vaccine not found.'
                ], 404);
            }


            // ==============================================
            // COMPLETE VACCINATION
            // ==============================================

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


            // ==============================================
            // CREATE RECORD
            // ==============================================

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


            // ==============================================
            // SYNC CHILD STATUS
            // ==============================================

            $this->syncChildStatus($request->child_id);

            $record->load([
                'vaccine',
                'appointment',
                'admin',
                'staff',
            ]);

            $child->refresh();

            return response()
                ->json([
                    'message' => 'Vaccination record added successfully.',
                    'record' => $record,
                    'child_status' => $child->status,
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

            $child = Child::find($record->child_id);

            if (!$child) {
                return response()->json([
                    'message' => 'Child not found.'
                ], 404);
            }

            if ($child->status === 'Inactive') {
                return response()->json([
                    'message' => 'Cannot update vaccination records for an inactive child.'
                ], 422);
            }

            $oldStatus = $record->status;
            $newStatus = $request->status;

            // ==============================================
            // NOTHING CHANGED
            // ==============================================

            if ($oldStatus === $newStatus) {

                $this->syncChildStatus($record->child_id);

                $record->refresh();

                $child->refresh();

                return response()
                    ->json([
                        'message' => 'Status unchanged.',
                        'record' => $record,
                        'child_status' => $child->status,
                    ])
                    ->header('Cache-Control', 'no-store');
            }


            // ==============================================
            // LOCK VACCINE
            // ==============================================

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


            // ==============================================
            // CONTINUING / MISSED -> COMPLETED
            // ==============================================

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


            // ==============================================
            // COMPLETED -> CONTINUING / MISSED
            // ==============================================

            if (
                $oldStatus === 'Completed' &&
                $newStatus !== 'Completed'
            ) {

                $vaccine->stock_quantity =
                    (int) $vaccine->stock_quantity + 1;

                $vaccine->save();
            }


            // ==============================================
            // SAVE STATUS
            // ==============================================

            $record->status = $newStatus;
            $record->save();


            // ==============================================
            // SYNC CHILD STATUS
            // ==============================================

            $this->syncChildStatus($record->child_id);

            $record->refresh();

            $record->load([
                'vaccine',
                'appointment',
                'admin',
                'staff',
            ]);

            $child->refresh();

            return response()
                ->json([
                    'message' => 'Status updated successfully.',
                    'record' => $record,
                    'child_status' => $child->status,
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

            $child = Child::find($record->child_id);

            if (!$child) {
                return response()->json([
                    'message' => 'Child not found.'
                ], 404);
            }

            if ($child->status === 'Inactive') {
                return response()->json([
                    'message' => 'Cannot edit vaccination records for an inactive child.'
                ], 422);
            }

            $oldChildId = $record->child_id;
            $oldVaccineId = $record->vaccine_id;
            $oldStatus = $record->status;

            $newVaccineId = $request->vaccine_id;
            $newStatus = $request->status;


            // ==============================================
            // VACCINE CHANGED
            // ==============================================

            if ($oldVaccineId != $newVaccineId) {

                // ------------------------------------------
                // RETURN OLD STOCK
                // ------------------------------------------

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


                // ------------------------------------------
                // DEDUCT NEW STOCK
                // ------------------------------------------

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


            // ==============================================
            // SAME VACCINE
            // ==============================================

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


                // ------------------------------------------
                // CONTINUING / MISSED -> COMPLETED
                // ------------------------------------------

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


                // ------------------------------------------
                // COMPLETED -> CONTINUING / MISSED
                // ------------------------------------------

                elseif (
                    $oldStatus === 'Completed' &&
                    $newStatus !== 'Completed'
                ) {

                    $vaccine->stock_quantity =
                        (int) $vaccine->stock_quantity + 1;

                    $vaccine->save();
                }
            }


            // ==============================================
            // SAVE RECORD
            // ==============================================

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


            // ==============================================
            // SYNC CHILD STATUS
            // ==============================================

            $this->syncChildStatus($oldChildId);

            $record->refresh();

            $record->load([
                'vaccine',
                'appointment',
                'admin',
                'staff',
            ]);

            $child->refresh();

            return response()
                ->json([
                    'message' => 'Vaccination record updated successfully.',
                    'record' => $record,
                    'child_status' => $child->status,
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


            // ==============================================
            // RETURN STOCK IF COMPLETED
            // ==============================================

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


            // ==============================================
            // DELETE RECORD
            // ==============================================

            $record->delete();


            // ==============================================
            // RECALCULATE CHILD STATUS
            // ==============================================

            $this->syncChildStatus($childId);

            $child = Child::find($childId);

            return response()
                ->json([
                    'message' => 'Vaccination record deleted successfully.',
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
}