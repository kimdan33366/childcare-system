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
    // Creates a parent and the parent's first child.
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
            'child_address' => 'nullable|string|max:255',
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

                // If no separate child address is provided,
                // use the parent's address.
                'address' => $request->child_address
                    ?: $request->address,

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
            'user_fullname' => 'required|string|max:255',
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

            // ==========================================
            // PARENT DEACTIVATED
            // ==========================================
            // Temporarily deactivate all children.
            if (
                $oldStatus !== 'Inactive' &&
                $newStatus === 'Inactive'
            ) {
                $user->children()->update([
                    'status' => 'Inactive'
                ]);
            }

            // ==========================================
            // PARENT REACTIVATED
            // ==========================================
            // Restore each child's status based on
            // their vaccination records.
            if (
                $oldStatus === 'Inactive' &&
                $newStatus === 'Active'
            ) {
                $children = $user->children()
                    ->with('patientRecords')
                    ->get();

                foreach ($children as $child) {

                    $records = $child->patientRecords;

                    if ($records->isEmpty()) {
                        $restoredStatus = 'Continuing';
                    } elseif (
                        $records->contains(function ($record) {
                            return in_array(
                                $record->status,
                                ['Continuing', 'Missed']
                            );
                        })
                    ) {
                        $restoredStatus = 'Continuing';
                    } elseif (
                        $records->every(function ($record) {
                            return $record->status === 'Completed';
                        })
                    ) {
                        $restoredStatus = 'Completed';
                    } else {
                        $restoredStatus = 'Continuing';
                    }

                    $child->update([
                        'status' => $restoredStatus
                    ]);
                }
            }
        });

        return response()->json(
            $user->fresh()->load([
                'children',
                'children.patientRecords',
                'children.appointments',
                'children.growthRecords',
            ])
        );
    }

    // POST /api/users/login
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (
            !$user ||
            !Hash::check($request->password, $user->password)
        ) {
            return response()->json([
                'message' => 'Invalid email or password.'
            ], 401);
        }

        if ($user->status !== 'Active') {
            return response()->json([
                'message' => 'Your account is inactive.'
            ], 403);
        }

        return response()->json([
            'message' => 'Login successful.',
            'user' => $user->load('children'),
        ]);
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