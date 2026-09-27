<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\PatientRecord;
use App\Models\Vaccine;
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
            'children.user',
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
            $status = $request->status ?? 'Pending';

            $childIds = $request->child_ids ?? [];
            $vaccines = $request->vaccines ?? [];

            /*
             * A Pending or Completed appointment reserves stock.
             *
             * Each selected vaccine is required once for every
             * selected child.
             */
            if (in_array($status, ['Pending', 'Completed'])) {
                $this->reserveVaccineStock(
                    $vaccines,
                    count($childIds)
                );
            }

            $appointment = Appointment::create([
                'admin_id' => $request->admin_id,
                'staff_id' => $request->staff_id,
                'appointment_date' => $request->appointment_date,
                'appointment_time' => $request->appointment_time,
                'address' => $request->address,
                'appointment_type' => $request->appointment_type,
                'status' => $status,
            ]);

            // Attach children
            if (!empty($childIds)) {
                $appointment->children()->sync($childIds);
            }

            // Attach vaccines and doses
            if (!empty($vaccines)) {
                foreach ($vaccines as $vaccine) {
                    $appointment->vaccines()->create([
                        'vaccine_id' => $vaccine['vaccine_id'],
                        'dose_number' => $vaccine['dose_number'],
                    ]);
                }
            }

            /*
             * If an appointment is created directly as Completed,
             * generate the corresponding patient vaccination records.
             */
            if ($status === 'Completed') {
                $this->createPatientRecordsFromAppointment($appointment);
            }

            DB::commit();

            return response()->json(
                $appointment->fresh()->load([
                    'admin',
                    'staff',
                    'children.user',
                    'vaccines.vaccine',
                    'patientRecords',
                ]),
                201
            );

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    // Get one appointment
    public function show($id)
    {
        $appointment = Appointment::with([
            'admin',
            'staff',
            'children.user',
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
            $oldStatus = $appointment->status;

            $newStatus = $request->has('status')
                ? $request->status
                : $oldStatus;

            /*
             * Completed appointments are historical records.
             *
             * Do not allow their children or vaccines to be changed.
             */
            if (
                $oldStatus === 'Completed' &&
                (
                    $request->has('child_ids') ||
                    $request->has('vaccines')
                )
            ) {
                throw new \Exception(
                    'Completed appointments cannot have their children or vaccines changed.'
                );
            }

            /*
             * Load the old appointment relationships before changing them.
             */
            $appointment->load([
                'children',
                'vaccines',
            ]);

            $oldChildCount = $appointment->children->count();

            $oldVaccines = $appointment->vaccines->map(function ($item) {
                return [
                    'vaccine_id' => $item->vaccine_id,
                    'dose_number' => $item->dose_number,
                ];
            })->toArray();

            /*
             * Determine the new children.
             */
            $newChildIds = $request->has('child_ids')
                ? ($request->child_ids ?? [])
                : $appointment->children->pluck('child_id')->toArray();

            /*
             * Determine the new vaccines.
             */
            $newVaccines = $request->has('vaccines')
                ? ($request->vaccines ?? [])
                : $oldVaccines;

            /*
             * Determine stock reservation states.
             */
            $oldReservesStock = in_array(
                $oldStatus,
                ['Pending', 'Completed']
            );

            $newReservesStock = in_array(
                $newStatus,
                ['Pending', 'Completed']
            );

            /*
             * Determine whether children or vaccines changed.
             */
            $configurationChanged =
                $request->has('child_ids') ||
                $request->has('vaccines');

            /*
             * If changing children/vaccines while still reserving stock,
             * release the old reservation first.
             */
            if ($oldReservesStock && $configurationChanged) {
                $this->releaseVaccineStock(
                    $oldVaccines,
                    $oldChildCount
                );
            }

            /*
             * If the appointment changes from a reserving status
             * to Missed/Cancelled, release the reservation.
             */
            if ($oldReservesStock && !$newReservesStock) {
                $this->releaseVaccineStock(
                    $oldVaccines,
                    $oldChildCount
                );
            }

            /*
             * If the appointment changes from Missed/Cancelled
             * to Pending/Completed, reserve the new stock.
             */
            if (!$oldReservesStock && $newReservesStock) {
                $this->reserveVaccineStock(
                    $newVaccines,
                    count($newChildIds)
                );
            }

            /*
             * If the appointment remains Pending/Completed but its
             * children or vaccines changed, reserve the new configuration.
             */
            if (
                $oldReservesStock &&
                $newReservesStock &&
                $configurationChanged
            ) {
                $this->reserveVaccineStock(
                    $newVaccines,
                    count($newChildIds)
                );
            }

            /*
             * Update appointment information.
             */
            $appointment->update($request->only([
                'admin_id',
                'staff_id',
                'appointment_date',
                'appointment_time',
                'address',
                'appointment_type',
                'status',
            ]));

            /*
             * Update children only when child_ids are provided.
             */
            if ($request->has('child_ids')) {
                $appointment->children()->sync($newChildIds);
            }

            /*
             * Update vaccines only when vaccines are provided.
             */
            if ($request->has('vaccines')) {
                $appointment->vaccines()->delete();

                foreach ($newVaccines as $vaccine) {
                    $appointment->vaccines()->create([
                        'vaccine_id' => $vaccine['vaccine_id'],
                        'dose_number' => $vaccine['dose_number'],
                    ]);
                }
            }

            /*
             * Generate patient records only when the appointment
             * changes into Completed.
             */
            if (
                $oldStatus !== 'Completed' &&
                $newStatus === 'Completed'
            ) {
                $appointment->refresh();

                $this->createPatientRecordsFromAppointment($appointment);
            }

            DB::commit();

            return response()->json(
                $appointment->fresh()->load([
                    'admin',
                    'staff',
                    'children.user',
                    'vaccines.vaccine',
                    'patientRecords',
                ])
            );

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Reserve vaccine stock.
     *
     * Each selected vaccine requires one dose for every selected child.
     */
    private function reserveVaccineStock(
        array $vaccines,
        int $childCount
    ) {
        if ($childCount <= 0 || empty($vaccines)) {
            return;
        }

        /*
         * If the same vaccine appears more than once,
         * combine it so stock is checked/deducted only once.
         */
        $vaccineIds = collect($vaccines)
            ->pluck('vaccine_id')
            ->unique()
            ->values();

        foreach ($vaccineIds as $vaccineId) {
            $vaccine = Vaccine::where(
                'vaccine_ID',
                $vaccineId
            )
                ->lockForUpdate()
                ->first();

            if (!$vaccine) {
                throw new \Exception(
                    "Vaccine ID {$vaccineId} was not found."
                );
            }

            $requiredStock = $childCount;
            $availableStock = (int) $vaccine->stock_quantity;

            if ($availableStock < $requiredStock) {
                throw new \Exception(
                    "{$vaccine->vaccine_name} does not have enough stock. " .
                    "Required: {$requiredStock}, Available: {$availableStock}."
                );
            }

            $newStock = $availableStock - $requiredStock;

            $vaccine->stock_quantity = $newStock;

            $vaccine->status = $this->calculateVaccineStatus(
                $vaccine->expiration_date,
                $newStock
            );

            $vaccine->save();
        }
    }

    /**
     * Release previously reserved vaccine stock.
     *
     * Each selected vaccine returns one dose for every child.
     */
    private function releaseVaccineStock(
        array $vaccines,
        int $childCount
    ) {
        if ($childCount <= 0 || empty($vaccines)) {
            return;
        }

        $vaccineIds = collect($vaccines)
            ->pluck('vaccine_id')
            ->unique()
            ->values();

        foreach ($vaccineIds as $vaccineId) {
            $vaccine = Vaccine::where(
                'vaccine_ID',
                $vaccineId
            )
                ->lockForUpdate()
                ->first();

            if (!$vaccine) {
                continue;
            }

            $newStock =
                (int) $vaccine->stock_quantity + $childCount;

            $vaccine->stock_quantity = $newStock;

            $vaccine->status = $this->calculateVaccineStatus(
                $vaccine->expiration_date,
                $newStock
            );

            $vaccine->save();
        }
    }

    /**
     * Calculate the current vaccine status.
     */
    private function calculateVaccineStatus(
        $expirationDate,
        int $stockQuantity
    ) {
        if (
            $expirationDate &&
            strtotime($expirationDate) < strtotime(date('Y-m-d'))
        ) {
            return 'Expired';
        }

        if ($stockQuantity <= 0) {
            return 'Out of Stock';
        }

        return 'Available';
    }

    /**
     * Create vaccination patient records from a completed appointment.
     *
     * Every selected vaccine/dose is recorded for every selected child.
     *
     * Stock is NOT deducted here because the appointment already
     * reserved/deducted the stock when it was created.
     */
    private function createPatientRecordsFromAppointment(
        Appointment $appointment
    ) {
        $appointment->load([
            'children',
            'vaccines.vaccine',
            'staff',
            'admin',
        ]);

        $children = $appointment->children;
        $vaccines = $appointment->vaccines;

        if ($children->isEmpty()) {
            return;
        }

        if ($vaccines->isEmpty()) {
            return;
        }

        /*
         * Determine the provider.
         */
        $provider = null;

        if ($appointment->staff) {
            $provider = $appointment->staff->staff_name;
        } elseif ($appointment->admin) {
            $provider = $appointment->admin->Admin_name;
        }

        /*
         * Create one patient record for every
         * child × vaccine/dose combination.
         */
        foreach ($children as $child) {
            foreach ($vaccines as $appointmentVaccine) {

                /*
                 * Prevent duplicate vaccination records
                 * for the same appointment.
                 */
                $existingRecord = PatientRecord::where(
                    'appointment_id',
                    $appointment->appointment_id
                )
                    ->where(
                        'child_id',
                        $child->child_id
                    )
                    ->where(
                        'vaccine_id',
                        $appointmentVaccine->vaccine_id
                    )
                    ->where(
                        'dose_number',
                        $appointmentVaccine->dose_number
                    )
                    ->first();

                if ($existingRecord) {
                    continue;
                }

                PatientRecord::create([
                    'appointment_id' => $appointment->appointment_id,
                    'child_id' => $child->child_id,
                    'vaccine_id' => $appointmentVaccine->vaccine_id,
                    'dose_number' => $appointmentVaccine->dose_number,
                    'date_taken' => $appointment->appointment_date,
                    'place' => $appointment->address,
                    'status' => 'Completed',
                    'provider' => $provider,
                ]);
            }
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