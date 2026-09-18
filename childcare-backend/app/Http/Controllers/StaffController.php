<?php

namespace App\Http\Controllers;

use App\Models\Staff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class StaffController extends Controller
{
    // Get all staff
    public function index()
    {
        return response()->json(
            Staff::orderBy('staff_name')->get()
        );
    }

    // Create staff
    public function store(Request $request)
    {
        $request->validate([
            'staff_name' => 'required|string|max:255',
            'staff_email' => 'required|email|max:255|unique:staff,staff_email',
            'staff_phone' => 'nullable|string|max:20',
            'staff_password' => 'required|string|min:6',
            'status' => 'required|in:Active,Inactive',
        ]);

        $staff = Staff::create([
            'staff_name' => $request->staff_name,
            'staff_email' => $request->staff_email,
            'staff_phone' => $request->staff_phone,
            'staff_password' => Hash::make($request->staff_password),
            'status' => $request->status,
        ]);

        return response()->json($staff, 201);
    }

    // Get one staff member
    public function show($id)
    {
        $staff = Staff::find($id);

        if (!$staff) {
            return response()->json([
                'message' => 'Staff not found.'
            ], 404);
        }

        return response()->json($staff);
    }

    // Update staff
    public function update(Request $request, $id)
    {
        $staff = Staff::find($id);

        if (!$staff) {
            return response()->json([
                'message' => 'Staff not found.'
            ], 404);
        }

        $request->validate([
            'staff_name' => 'required|string|max:255',
            'staff_email' => 'required|email|max:255|unique:staff,staff_email,' . $id . ',staff_id',
            'staff_phone' => 'nullable|string|max:20',
            'status' => 'required|in:Active,Inactive',
        ]);

        $staff->update([
            'staff_name' => $request->staff_name,
            'staff_email' => $request->staff_email,
            'staff_phone' => $request->staff_phone,
            'status' => $request->status,
        ]);

        return response()->json($staff);
    }

    // Delete staff
    public function destroy($id)
    {
        $staff = Staff::find($id);

        if (!$staff) {
            return response()->json([
                'message' => 'Staff not found.'
            ], 404);
        }

        $staff->delete();

        return response()->json([
            'message' => 'Staff deleted successfully.'
        ]);
    }
    public function login(Request $request)
{
    $request->validate([
        'staff_email' => 'required|email',
        'staff_password' => 'required|string',
    ]);

    $staff = Staff::where(
        'staff_email',
        $request->staff_email
    )->first();

    if (!$staff) {
        return response()->json([
            'message' => 'Invalid email or password.'
        ], 401);
    }

    if (!Hash::check(
        $request->staff_password,
        $staff->staff_password
    )) {
        return response()->json([
            'message' => 'Invalid email or password.'
        ], 401);
    }

    if ($staff->status !== 'Active') {
        return response()->json([
            'message' => 'This staff account is inactive.'
        ], 403);
    }

    return response()->json([
        'message' => 'Staff login successful.',
        'staff' => [
            'staff_id' => $staff->staff_id,
            'staff_name' => $staff->staff_name,
            'staff_email' => $staff->staff_email,
            'staff_phone' => $staff->staff_phone,
            'status' => $staff->status,
        ],
    ]);
}
}