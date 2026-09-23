<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    public function index()
    {
        return response()->json(Admin::all());
    }
    public function store(Request $request)
{
    $request->validate([
        'Admin_name' => 'required|string|max:255',
        'Admin_email' => 'required|string|email|max:255|unique:admin,Admin_email',
        'Admin_password' => 'required|string|min:6',
        'Admin_role' => 'required|string|max:50',
    ]);

    $admin = Admin::create([
        'Admin_name' => $request->Admin_name,
        'Admin_email' => $request->Admin_email,
        'Admin_password' => Hash::make($request->Admin_password),
        'Admin_role' => $request->Admin_role,
    ]);

    return response()->json($admin, 201);
}

    public function register(Request $request)
    {
        $request->validate([
            'Admin_name' => 'required|string|max:255',
            'Admin_email' => 'required|string|email|max:255|unique:admin',
            'Admin_password' => 'required|string|min:6',
            'Admin_role' => 'required|string|max:255',
        ]);

        $admin = Admin::create([
            'Admin_name' => $request->Admin_name,
            'Admin_email' => $request->Admin_email,
            'Admin_password' => Hash::make($request->Admin_password),
            'Admin_role' => $request->Admin_role,
        ]);

        return response()->json($admin, 201);
    }

    public function login(Request $request)
    {
        $admin = Admin::where('Admin_name', $request->Admin_name)->first();

        if (!$admin) {
            return response()->json([
                'message' => 'Admin not found'
            ], 401);
        }

        if (!Hash::check($request->Admin_password, $admin->Admin_password)) {
            return response()->json([
                'message' => 'Incorrect password'
            ], 401);
        }

        return response()->json([
            'message' => 'Login successful',
            'admin' => [
                'Admin_id' => $admin->Admin_id,
                'Admin_email' => $admin->Admin_email,
                'Admin_name' => $admin->Admin_name,
                'Admin_role' => $admin->Admin_role
            ]
        ], 200);
    }
    public function updateProfile(Request $request, $id)
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

    $admin->Admin_name = $request->Admin_name;
    $admin->Admin_email = $request->Admin_email;

    $admin->save();

    return response()->json([
        'message' => 'Profile updated successfully',
        'admin' => [
            'Admin_id' => $admin->Admin_id,
            'Admin_name' => $admin->Admin_name,
            'Admin_email' => $admin->Admin_email,
            'Admin_role' => $admin->Admin_role
        ]
    ]);
}
}