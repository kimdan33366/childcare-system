<?php

namespace App\Http\Controllers;

use App\Models\Staff;
use App\Models\StaffPermission;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StaffPermissionController extends Controller
{
    /**
     * All permissions currently supported by the system.
     */
    private function availablePermissions(): array
    {
        return [
            // Dashboard
            'view_dashboard',

            // Children
            'view_patients',
            'add_patients',
            'edit_patients',

            // Patient Records
            'view_patient_records',
            'add_patient_records',
            'edit_patient_records',

            // Appointments
            'view_appointments',
            'add_appointments',
            'edit_appointments',

            // Vaccines
            'view_vaccines',
            'add_vaccines',
            'edit_vaccines',

            // Users
            'view_users',
            'add_users',
            'edit_users',

            // Reports
            'view_reports',
            'generate_reports',
            'export_reports',

            // Notifications
            'view_notifications',
            'send_notifications',
            'delete_notifications',
        ];
    }

    /**
     * Get permissions assigned to a staff member.
     */
    public function index($staffId)
    {
        $staff = Staff::find($staffId);

        if (!$staff) {
            return response()->json([
                'message' => 'Staff not found.'
            ], 404);
        }

        $permissions = $staff->permissions()
            ->pluck('permission')
            ->values();

        return response()->json([
            'staff_id' => $staff->staff_id,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Update permissions assigned to a staff member.
     */
    public function update(Request $request, $staffId)
    {
        $staff = Staff::find($staffId);

        if (!$staff) {
            return response()->json([
                'message' => 'Staff not found.'
            ], 404);
        }

        $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => [
                'string',
                'max:100',
                Rule::in($this->availablePermissions()),
            ],
        ]);

        $permissions = array_values(
            array_unique($request->permissions)
        );

        StaffPermission::where(
            'staff_id',
            $staffId
        )->delete();

        foreach ($permissions as $permission) {
            StaffPermission::create([
                'staff_id' => $staffId,
                'permission' => $permission,
            ]);
        }

        return response()->json([
            'message' => 'Staff permissions updated successfully.',
            'staff_id' => $staffId,
            'permissions' => $permissions,
        ]);
    }
}