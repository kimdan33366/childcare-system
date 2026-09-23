<?php

namespace App\Http\Controllers;

use App\Models\Vaccine;
use Illuminate\Http\Request;

class VaccineController extends Controller
{
    // GET /api/vaccines
    public function index()
    {
        return response()->json(
            Vaccine::orderBy('vaccine_name')->get()
        );
    }

    // GET /api/vaccines/{id}
    public function show($id)
    {
        $vaccine = Vaccine::find($id);

        if (!$vaccine) {
            return response()->json([
                'message' => 'Vaccine not found.'
            ], 404);
        }

        return response()->json($vaccine);
    }

    // POST /api/vaccines
    public function store(Request $request)
    {
        $request->validate([
            'vaccine_name' => 'required|string|max:255',
            'date_stored' => 'required|date',
            'expiration_date' => 'required|date|after_or_equal:date_stored',
            'stock_quantity' => 'required|integer|min:0',
            'status' => 'nullable|in:Available,Out of Stock,Expired',
        ]);

        $status = $this->calculateStatus(
            $request->expiration_date,
            $request->stock_quantity
        );

        $vaccine = Vaccine::create([
            'vaccine_name' => $request->vaccine_name,
            'date_stored' => $request->date_stored,
            'expiration_date' => $request->expiration_date,
            'stock_quantity' => $request->stock_quantity,
            'status' => $status,
        ]);

        return response()->json($vaccine, 201);
    }

    // PUT /api/vaccines/{id}
    public function update(Request $request, $id)
    {
        $vaccine = Vaccine::find($id);

        if (!$vaccine) {
            return response()->json([
                'message' => 'Vaccine not found.'
            ], 404);
        }

        $request->validate([
            'vaccine_name' => 'required|string|max:255',
            'date_stored' => 'required|date',
            'expiration_date' => 'required|date|after_or_equal:date_stored',
            'stock_quantity' => 'required|integer|min:0',
        ]);

        $status = $this->calculateStatus(
            $request->expiration_date,
            $request->stock_quantity
        );

        $vaccine->update([
            'vaccine_name' => $request->vaccine_name,
            'date_stored' => $request->date_stored,
            'expiration_date' => $request->expiration_date,
            'stock_quantity' => $request->stock_quantity,
            'status' => $status,
        ]);

        return response()->json($vaccine);
    }

    // DELETE /api/vaccines/{id}
    public function destroy($id)
    {
        $vaccine = Vaccine::find($id);

        if (!$vaccine) {
            return response()->json([
                'message' => 'Vaccine not found.'
            ], 404);
        }

        return response()->json([
            'message' => 'Vaccines cannot be deleted because vaccination and appointment history must be preserved. Set the stock to 0 instead.'
        ], 403);
    }

    // Automatically determine vaccine status
    private function calculateStatus($expirationDate, $stockQuantity)
    {
        if (strtotime($expirationDate) < strtotime(date('Y-m-d'))) {
            return 'Expired';
        }

        if ((int) $stockQuantity <= 0) {
            return 'Out of Stock';
        }

        return 'Available';
    }
}