<?php

namespace App\Http\Controllers;

use App\Models\Staff;
use App\Models\StaffPermission;
use Illuminate\Http\Request;

class StaffPermissionController extends Controller
{
    public function index($staffId)
    {
        $staff = Staff::find($staffId);

        if (!$staff) {
            return response()->json([
                'message' => 'Staff not found.'
            ], 404);
        }

        $permissions = $staff->permissions()
            ->pluck('permission');

        return response()->json([
            'staff_id' => $staff->staff_id,
            'permissions' => $permissions,
        ]);
    }

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
            'permissions.*' => 'string|max:100',
        ]);

        StaffPermission::where('staff_id', $staffId)->delete();

        foreach ($request->permissions as $permission) {
            StaffPermission::create([
                'staff_id' => $staffId,
                'permission' => $permission,
            ]);
        }

        return response()->json([
            'message' => 'Staff permissions updated successfully.',
            'staff_id' => $staffId,
            'permissions' => $request->permissions,
        ]);
    }
}