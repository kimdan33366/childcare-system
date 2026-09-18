<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    // GET /api/users
    public function index()
{
    return response()->json(
        User::withCount('children')
            ->orderBy('user_fullname')
            ->get()
    );
}

    // GET /api/users/{id}
    public function show($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'message' => 'User not found'
            ], 404);
        }

        return response()->json($user);
    }

    // POST /api/users
    public function store(Request $request)
{
    $request->validate([
        'user_fullname' => 'required|string|max:255',
        'email' => 'nullable|email|max:255|unique:user,email',
        'mobile_number' => 'required|string|max:20',
        'password' => 'required|string|min:6',
        'status' => 'required|in:Active,Inactive',
    ]);

    $user = User::create([
        'user_fullname' => $request->user_fullname,
        'email' => $request->email,
        'mobile_number' => $request->mobile_number,
        'password' => $request->password,
        'status' => $request->status,
    ]);

    return response()->json($user, 201);
}

    // PUT /api/users/{id}
    public function update(Request $request, $id)
{
    $user = User::find($id);

    if (!$user) {
        return response()->json([
            'message' => 'User not found'
        ], 404);
    }

    $request->validate([
        'user_fullname' => 'required|string|max:255',
        'email' => 'nullable|email|max:255|unique:user,email,' . $id . ',user_id',
        'mobile_number' => 'required|string|max:20',
        'status' => 'required|in:Active,Inactive',
    ]);

    $user->update([
        'user_fullname' => $request->user_fullname,
        'email' => $request->email,
        'mobile_number' => $request->mobile_number,
        'status' => $request->status,
    ]);

    return response()->json($user);
}

    // DELETE /api/users/{id}
    public function destroy($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'message' => 'User not found'
            ], 404);
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully'
        ]);
    }
}