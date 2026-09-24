<?php

namespace App\Http\Controllers;

use App\Models\GrowthRecord;
use App\Models\Child;
use App\Models\Appointment;
use Illuminate\Http\Request;

class GrowthRecordController extends Controller
{
    public function index($child_id)
    {
        $child = Child::find($child_id);

        if (!$child) {
            return response()->json([
                'message' => 'Child not found.'
            ], 404);
        }

        $records = GrowthRecord::with('appointment')
            ->where('child_id', $child_id)
            ->orderBy('date', 'desc')
            ->get();

        return response()->json($records);
    }

    public function store(Request $request)
    {
        $request->validate([
            'child_id' => 'required|integer|exists:children,child_id',
            'appointment_id' => 'nullable|integer|exists:appointments,appointment_id',
            'date' => 'required|date',
            'weight_kg' => 'required|numeric|min:0|max:999.99',
            'height_cm' => 'required|numeric|min:0|max:999.99',
        ]);

        $growthRecord = GrowthRecord::create([
            'child_id' => $request->child_id,
            'appointment_id' => $request->appointment_id,
            'date' => $request->date,
            'weight_kg' => $request->weight_kg,
            'height_cm' => $request->height_cm,
        ]);

        return response()->json([
            'message' => 'Growth record created successfully.',
            'growth_record' => $growthRecord->load('appointment'),
        ], 201);
    }

    public function show($id)
    {
        $growthRecord = GrowthRecord::with([
            'child',
            'appointment',
        ])->find($id);

        if (!$growthRecord) {
            return response()->json([
                'message' => 'Growth record not found.'
            ], 404);
        }

        return response()->json($growthRecord);
    }

    public function update(Request $request, $id)
    {
        $growthRecord = GrowthRecord::find($id);

        if (!$growthRecord) {
            return response()->json([
                'message' => 'Growth record not found.'
            ], 404);
        }

        $request->validate([
            'appointment_id' => 'nullable|integer|exists:appointments,appointment_id',
            'date' => 'sometimes|date',
            'weight_kg' => 'sometimes|numeric|min:0|max:999.99',
            'height_cm' => 'sometimes|numeric|min:0|max:999.99',
        ]);

        $growthRecord->update(
            $request->only([
                'appointment_id',
                'date',
                'weight_kg',
                'height_cm',
            ])
        );

        return response()->json([
            'message' => 'Growth record updated successfully.',
            'growth_record' => $growthRecord->fresh()->load('appointment'),
        ]);
    }

    public function destroy($id)
    {
        $growthRecord = GrowthRecord::find($id);

        if (!$growthRecord) {
            return response()->json([
                'message' => 'Growth record not found.'
            ], 404);
        }

        $growthRecord->delete();

        return response()->json([
            'message' => 'Growth record deleted successfully.'
        ]);
    }
}