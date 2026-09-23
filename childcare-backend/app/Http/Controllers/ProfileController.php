<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function update(Request $request, $id)
    {
        $admin = Admin::find($id);

        if (!$admin) {
            return response()->json([
                'message' => 'Admin not found'
            ], 404);
        }

        $request->validate([
            'Admin_name' => 'required|string|max:255',
            'Admin_email' => 'required|email|max:255|unique:admin,Admin_email,' . $id . ',Admin_id',
        ]);

        $admin->update([
            'Admin_name' => $request->Admin_name,
            'Admin_email' => $request->Admin_email,
        ]);

        return response()->json([
            'message' => 'Profile updated successfully',
            'admin' => [
                'Admin_id' => $admin->Admin_id,
                'Admin_name' => $admin->Admin_name,
                'Admin_email' => $admin->Admin_email,
                'Admin_role' => $admin->Admin_role,
            ]
        ]);
    }
}