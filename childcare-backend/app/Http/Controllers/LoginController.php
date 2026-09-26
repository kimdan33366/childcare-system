<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Staff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        /*
        |--------------------------------------------------------------------------
        | CHECK ADMIN ACCOUNT
        |--------------------------------------------------------------------------
        */

        $admin = Admin::where('Admin_name', $request->username)
            ->orWhere('Admin_email', $request->username)
            ->first();

        if ($admin) {
            if (!Hash::check($request->password, $admin->Admin_password)) {
                return response()->json([
                    'message' => 'Invalid username or password.'
                ], 401);
            }

            return response()->json([
                'message' => 'Login successful.',
                'user_type' => 'Admin',
                'admin' => [
                    'Admin_id' => $admin->Admin_id,
                    'Admin_email' => $admin->Admin_email,
                    'Admin_name' => $admin->Admin_name,
                    'Admin_role' => $admin->Admin_role,
                ],
            ], 200);
        }

        /*
        |--------------------------------------------------------------------------
        | CHECK STAFF ACCOUNT
        |--------------------------------------------------------------------------
        */

        $staff = Staff::where('staff_email', $request->username)
            ->orWhere('staff_name', $request->username)
            ->first();

        if ($staff) {
            if (!Hash::check($request->password, $staff->staff_password)) {
                return response()->json([
                    'message' => 'Invalid username or password.'
                ], 401);
            }

            if ($staff->status !== 'Active') {
                return response()->json([
                    'message' => 'This staff account is inactive.'
                ], 403);
            }

            return response()->json([
                'message' => 'Login successful.',
                'user_type' => 'Staff',
                'staff' => [
                    'staff_id' => $staff->staff_id,
                    'staff_name' => $staff->staff_name,
                    'staff_email' => $staff->staff_email,
                    'staff_phone' => $staff->staff_phone,
                    'status' => $staff->status,
                ],
            ], 200);
        }

        /*
        |--------------------------------------------------------------------------
        | ACCOUNT NOT FOUND
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'message' => 'Invalid username or password.'
        ], 401);
    }
}