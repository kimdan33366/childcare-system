<?php

namespace App\Http\Controllers;

use App\Models\Child;
use Illuminate\Http\Request;

class ChildController extends Controller
{
    // GET /api/children
    public function index()
    {
        $children = Child::with([
            'user',
            'patientRecords',
            'appointments',
            'growthRecords',
        ])->get();

        return response()->json($children);
    }

    // GET /api/children/{id}
    public function show($id)
    {
        $child = Child::with([
            'user',
            'patientRecords',
            'appointments',
            'growthRecords',
        ])->findOrFail($id);

        return response()->json($child);
    }

    // POST /api/children
    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|integer|exists:user,user_id',
            'child_name' => 'required|string|max:255',
            'birthdate' => 'required|date',
            'gender' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'relationship' => 'required|in:Mother,Father,Guardian',
            'status' => 'nullable|in:Continuing,Completed,Inactive',
        ]);

        // Make sure the selected parent is active.
        $parent = \App\Models\User::findOrFail($request->user_id);

        if ($parent->status !== 'Active') {
            return response()->json([
                'message' => 'Cannot add a child to an inactive parent account.'
            ], 422);
        }

        $child = Child::create([
            'user_id' => $request->user_id,
            'child_name' => $request->child_name,
            'birthdate' => $request->birthdate,
            'gender' => $request->gender,
            'address' => $request->address,
            'relationship' => $request->relationship,

            // New children always begin as Continuing.
            'status' => 'Continuing',
        ]);

        return response()->json([
            'message' => 'Child created successfully.',
            'child' => $child->load('user'),
        ], 201);
    }

    // PUT /api/children/{id}
    public function update(Request $request, $id)
    {
        $child = Child::findOrFail($id);

        $request->validate([
            'user_id' => 'sometimes|integer|exists:user,user_id',
            'child_name' => 'sometimes|string|max:255',
            'birthdate' => 'sometimes|date',
            'gender' => 'sometimes|string|max:255',
            'address' => 'sometimes|string|max:255',
            'relationship' => 'sometimes|in:Mother,Father,Guardian',
            'status' => 'sometimes|in:Continuing,Completed,Inactive',
        ]);

        // If the parent is being changed, make sure the new
        // parent account is active.
        if ($request->has('user_id')) {
            $parent = \App\Models\User::findOrFail($request->user_id);

            if ($parent->status !== 'Active') {
                return response()->json([
                    'message' => 'Cannot assign a child to an inactive parent account.'
                ], 422);
            }
        }

        $child->update($request->only([
            'user_id',
            'child_name',
            'birthdate',
            'gender',
            'address',
            'relationship',
            'status',
        ]));

        return response()->json(
            $child->fresh()->load('user')
        );
    }

    // DELETE /api/children/{id}
    public function destroy($id)
    {
        $child = Child::findOrFail($id);

        return response()->json([
            'message' => 'Children cannot be deleted because vaccination, growth, and appointment history must be preserved. Deactivate the child instead.'
        ], 403);
    }
}