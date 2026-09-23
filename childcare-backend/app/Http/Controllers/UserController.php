<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    // GET /api/users
    public function index()
    {
        return response()->json(
            User::withCount('children')
                ->with('children')
                ->orderBy('user_fullname')
                ->get()
        );
    }

    // GET /api/users/{id}
    public function show($id)
    {
        $user = User::with([
            'children',
            'children.patientRecords',
            'children.appointments',
            'children.growthRecords',
        ])->find($id);

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
        // Parent information
        'user_fullname' => 'required|string|max:255',
        'email' => 'nullable|email|max:255|unique:user,email',
        'date_of_birth' => 'nullable|date',
        'gender' => 'nullable|string|max:255',
        'address' => 'required|string|max:255',
        'mobile_number' => 'required|string|max:20',
        'password' => 'required|string|min:6',
        'status' => 'nullable|in:Active,Inactive',

        // First child information
        'child_name' => 'required|string|max:255',
        'child_birthdate' => 'required|date',
        'child_gender' => 'required|string|max:255',
        'child_address' => 'required|string|max:255',
        'relationship' => 'required|in:Mother,Father,Guardian',
    ]);

    DB::beginTransaction();

    try {
        // ==============================
        // CREATE PARENT
        // ==============================
        $user = User::create([
            'user_fullname' => $request->user_fullname,
            'email' => $request->email,
            'date_of_birth' => $request->date_of_birth,
            'gender' => $request->gender,
            'address' => $request->address,
            'mobile_number' => $request->mobile_number,
            'password' => Hash::make($request->password),
            'status' => $request->status ?? 'Active',
        ]);

        // ==============================
        // CREATE FIRST CHILD
        // ==============================
        $child = $user->children()->create([
            'child_name' => $request->child_name,
            'birthdate' => $request->child_birthdate,
            'gender' => $request->child_gender,
            'address' => $request->child_address,
            'relationship' => $request->relationship,
            'status' => 'Continuing',
        ]);

        DB::commit();

        return response()->json([
            'message' => 'Parent and first child created successfully.',
            'user' => $user,
            'child' => $child,
        ], 201);

    } catch (\Exception $e) {

        DB::rollBack();

        return response()->json([
            'message' => 'Failed to create parent and first child.',
            'error' => $e->getMessage(),
        ], 500);
    }
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
            'user_fullname' => 'required|string|max:2550',
            'email' => 'nullable|email|max:255|unique:user,email,' . $id . ',user_id',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|max:255',
            'address' => 'required|string|max:255',
            'mobile_number' => 'required|string|max:20',
            'password' => 'nullable|string|min:6',
            'status' => 'required|in:Active,Inactive',
        ]);

        $data = [
            'user_fullname' => $request->user_fullname,
            'email' => $request->email,
            'date_of_birth' => $request->date_of_birth,
            'gender' => $request->gender,
            'address' => $request->address,
            'mobile_number' => $request->mobile_number,
            'status' => $request->status,
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        DB::transaction(function () use ($user, $data, $request) {

            $oldStatus = $user->status;
            $newStatus = $request->status;

            $user->update($data);

            // Parent deactivated:
            // temporarily deactivate all children
            if (
                $oldStatus !== 'Inactive' &&
                $newStatus === 'Inactive'
            ) {
                $user->children()->update([
                    'status' => 'Inactive'
                ]);
            }

            // Parent reactivated:
            // restore children to Continuing
            if (
                $oldStatus === 'Inactive' &&
                $newStatus === 'Active'
            ) {
                $user->children()->update([
                    'status' => 'Continuing'
                ]);
            }
        });

        return response()->json(
            $user->fresh()->load('children')
        );
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

        return response()->json([
            'message' => 'Parent accounts cannot be deleted because child, vaccination, growth, and appointment history must be preserved. Deactivate the account instead.'
        ], 403);
    }
}