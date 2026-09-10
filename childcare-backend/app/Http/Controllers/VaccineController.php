<?php

namespace App\Http\Controllers;

use App\Models\Vaccine;
use Illuminate\Http\Request;

class VaccineController extends Controller
{
    // GET /api/vaccines
    public function index()
    {
        return response()->json(Vaccine::all());
    }

    // GET /api/vaccines/{id}
    public function show($id)
    {
        $vaccine = Vaccine::findOrFail($id);

        return response()->json($vaccine);
    }

    // POST /api/vaccines
    public function store(Request $request)
    {
        $vaccine = Vaccine::create([
            'vaccine_name' => $request->vaccine_name,
            'date_stored' => $request->date_stored,
            'expiration_date' => $request->expiration_date,
            'stock_quantity' => $request->stock_quantity,
            'status' => $request->status,
        ]);

        return response()->json($vaccine, 201);
    }

    // PUT /api/vaccines/{id}
    public function update(Request $request, $id)
    {
        $vaccine = Vaccine::findOrFail($id);

        $vaccine->update([
            'vaccine_name' => $request->vaccine_name,
            'date_stored' => $request->date_stored,
            'expiration_date' => $request->expiration_date,
            'stock_quantity' => $request->stock_quantity,
            'status' => $request->status,
        ]);

        return response()->json($vaccine);
    }

    // DELETE /api/vaccines/{id}
    public function destroy($id)
    {
        $vaccine = Vaccine::findOrFail($id);

        $vaccine->delete();

        return response()->json([
            'message' => 'Vaccine deleted successfully'
        ]);
    }
}