<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\Notification;
use App\Mail\NotificationMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

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
    // Creates a parent and one or more children.
    public function store(Request $request)
    {
        $request->validate([
            // ==============================
            // PARENT INFORMATION
            // ==============================
            'user_fullname' => 'required|string|max:255',
            'email' => 'nullable|email|max:255|unique:user,email',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|max:255',
            'address' => 'required|string|max:255',
            'mobile_number' => 'required|string|max:20',
            'password' => 'required|string|min:6',
            'status' => 'nullable|in:Active,Inactive',

            // ==============================
            // CHILDREN INFORMATION
            // ==============================
            'children' => 'required|array|min:1',

            'children.*.child_name' => 'required|string|max:255',
            'children.*.child_birthdate' => 'required|date',
            'children.*.child_gender' => 'required|string|max:255',
            'children.*.child_address' => 'nullable|string|max:255',
            'children.*.relationship' => 'required|in:Mother,Father,Guardian',
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
            // CREATE CHILDREN
            // ==============================
            $createdChildren = [];

            foreach ($request->children as $childData) {

                $child = $user->children()->create([
                    'child_name' => $childData['child_name'],
                    'birthdate' => $childData['child_birthdate'],
                    'gender' => $childData['child_gender'],

                    // If child address is empty,
                    // use the parent's address.
                    'address' => !empty($childData['child_address'])
                        ? $childData['child_address']
                        : $request->address,

                    'relationship' => $childData['relationship'],

                    // New children always start as Continuing.
                    'status' => 'Continuing',
                ]);

                $createdChildren[] = $child;
            }

            DB::commit();

            return response()->json([
                'message' => 'Parent and children created successfully.',
                'user' => $user->load('children'),
                'children' => $createdChildren,
                'children_count' => count($createdChildren),
            ], 201);

        } catch (\Exception $e) {

            DB::rollBack();

            return response()->json([
                'message' => 'Failed to create parent and children.',
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
   // POST /api/users/login
public function login(Request $request)
{
    $request->validate([
        'username' => 'required|string',
        'password' => 'required|string',
    ]);

    // Accept email as the username
    $username = trim($request->username);

    $user = User::where('email', $username)->first();
    \Log::info('LOGIN USER FOUND', [
    'user_id' => $user?->user_id,
    'password_matches' => $user
        ? Hash::check($request->password, $user->password)
        : false,
]);

    if (
        !$user ||
        !Hash::check($request->password, $user->password)
    ) {
        return response()->json([
            'success' => false,
            'message' => 'Invalid email or password.',
        ], 401);
    }

    if ($user->status !== 'Active') {
        return response()->json([
            'success' => false,
            'message' => 'Your account is inactive.',
        ], 403);
    }

    return response()->json([
    'success' => true,
    'message' => 'Login successful.',
    'user' => [
        'user_id' => $user->user_id,
        'user_fullname' => $user->user_fullname,
        'email' => $user->email,
        'date_of_birth' => $user->date_of_birth,
        'gender' => $user->gender,
        'address' => $user->address,
        'mobile_number' => $user->mobile_number,
        'status' => $user->status,
    ],
], 200);
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
    
public function deactivateWithNotice(Request $request, $id)
{
    $validated = $request->validate([
        'reason' => 'required|string|min:5|max:2000',
    ]);

    // Only authenticated administrators can use this endpoint.
    // Check if the logged-in account is an Admin
$actor = $request->user();

if (!$actor instanceof \App\Models\Admin) {
    return response()->json([
        'message' => 'Only administrators can deactivate accounts.',
    ], 403);
}

    $user = User::with('children')->find($id);

    if (!$user) {
        return response()->json([
            'message' => 'Parent account not found.',
        ], 404);
    }

    if ($user->status !== 'Active') {
        return response()->json([
            'message' => 'This parent account is already inactive.',
        ], 409);
    }

    if (empty($user->email)) {
        return response()->json([
            'message' => 'The parent has no registered email address.',
        ], 422);
    }

    $message =
        "Dear {$user->user_fullname},\n\n" .
        "We are writing to inform you that your Child Care " .
        "Immunization System account is being deactivated.\n\n" .
        "Reason for deactivation:\n" .
        trim($validated['reason']) . "\n\n" .
        "You will no longer be able to access your account. " .
        "If you have questions or believe this is a mistake, " .
        "please contact the clinic.\n\n" .
        "Thank you.";

    $notification = Notification::create([
        'child_id' => null,
        'appointment_id' => null,
        'child_name' => null,
        'parent' => $user->user_fullname,
        'phone' => $user->mobile_number,
        'email' => $user->email,
        'type' => 'Account Deactivation',
        'message' => $message,
        'status' => 'Pending',
    ]);

    try {
        Mail::to($user->email)->send(
            new NotificationMail($notification)
        );

        $notification->update([
            'status' => 'Sent',
        ]);

    } catch (\Throwable $e) {
        $notification->update([
            'status' => 'Failed',
        ]);

        Log::error('Account deactivation email failed', [
            'user_id' => $user->user_id,
            'notification_id' => $notification->getKey(),
            'error' => $e->getMessage(),
        ]);

        return response()->json([
            'message' => 'The email could not be sent. The account remains active.',
        ], 500);
    }

    DB::transaction(function () use ($user) {
        $user->update([
            'status' => 'Inactive',
        ]);

        $user->children()->update([
            'status' => 'Inactive',
        ]);
    });

    return response()->json([
        'message' => 'Notice sent and parent account deactivated successfully.',
        'notification' => $notification->fresh(),
        'user' => $user->fresh()->load('children'),
    ]);
}

}