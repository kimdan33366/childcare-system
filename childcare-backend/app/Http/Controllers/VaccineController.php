<?php

namespace App\Http\Controllers;

use App\Models\Vaccine;
use Illuminate\Http\Request;

class VaccineController extends Controller
{
    // GET /api/vaccines
    public function index()
    {
        $vaccines = Vaccine::orderBy('vaccine_name')->get();

        return response()->json($vaccines);
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
        $validated = $request->validate([
            'vaccine_name' => 'required|string|max:255',
            'date_stored' => 'required|date',
            'expiration_date' => 'required|date|after_or_equal:date_stored',
            'stock_quantity' => 'required|integer|min:0',
        ]);

        $validated['status'] = $this->calculateStatus(
            $validated['expiration_date'],
            $validated['stock_quantity']
        );

        $vaccine = Vaccine::create($validated);

        return response()->json([
            'message' => 'Vaccine added successfully.',
            'vaccine' => $vaccine
        ], 201);
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

        $validated = $request->validate([
            'vaccine_name' => 'required|string|max:255',
            'date_stored' => 'required|date',
            'expiration_date' => 'required|date|after_or_equal:date_stored',
            'stock_quantity' => 'required|integer|min:0',
        ]);

        $validated['status'] = $this->calculateStatus(
            $validated['expiration_date'],
            $validated['stock_quantity']
        );

        $vaccine->update($validated);

        return response()->json([
            'message' => 'Vaccine updated successfully.',
            'vaccine' => $vaccine->fresh()
        ]);
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
        // Expired vaccines take priority over stock status.
        if (strtotime($expirationDate) < strtotime(date('Y-m-d'))) {
            return 'Expired';
        }

        if ((int) $stockQuantity <= 0) {
            return 'Out of Stock';
        }

        return 'Available';
    }
}