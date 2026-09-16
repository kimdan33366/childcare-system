<?php

namespace App\Http\Controllers;

use App\Models\Child;
use Illuminate\Http\Request;

class ChildController extends Controller
{
     public function index()
{
    return response()->json(
        Child::with('patientRecords')->get()
    );
    
}

    // GET /api/children/{id}
    public function show($id)
    {
        $child = Child::findOrFail($id);

        return response()->json($child);
    }

    // POST /api/children
    public function store(Request $request)
    {
        $child = Child::create([
            'user_id' => $request->user_id,
            'child_name' => $request->child_name,
            'age_months' => $request->age_months,
            'birthdate' => $request->birthdate,
            'gender' => $request->gender,
            'mother_name' => $request->mother_name,
            'father_name' => $request->father_name,
            'address' => $request->address,
        ]);

        return response()->json($child, 201);
    }

    // PUT /api/children/{id}
    public function update(Request $request, $id)
    {
        $child = Child::findOrFail($id);

        $child->update([
            'user_id' => $request->user_id,
            'child_name' => $request->child_name,
            'age_months' => $request->age_months,
            'birthdate' => $request->birthdate,
            'gender' => $request->gender,
            'mother_name' => $request->mother_name,
            'father_name' => $request->father_name,
            'address' => $request->address,
        ]);

        return response()->json($child);
    }

    // DELETE /api/children/{id}
    public function destroy($id)
    {
        $child = Child::findOrFail($id);

        $child->delete();

        return response()->json([
            'message' => 'Child deleted successfully'
        ]);
    }
}
