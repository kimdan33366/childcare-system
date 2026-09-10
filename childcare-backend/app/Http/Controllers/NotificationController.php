<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // Get all notifications
    public function index()
    {
        $notifications = Notification::leftJoin(
            'children',
            'notifications.child_id',
            '=',
            'children.child_id'
        )
        ->select(
            'notifications.*',
            'children.child_name'
        )
        ->orderBy('notifications.created_at', 'desc')
        ->get();

        return response()->json($notifications);
    }

    // Create notification for a specific child
    public function store(Request $request)
    {
        $request->validate([
            'child_id' => 'required|exists:children,child_id',
            'message' => 'required|string',
        ]);

        $notification = Notification::create([
            'child_id' => $request->child_id,
            'message' => $request->message,
        ]);

        return response()->json([
            'message' => 'Notification sent successfully.',
            'notification' => $notification
        ], 201);
    }

    // Send notification to all parents
    public function broadcast(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
        ]);

        $notification = Notification::create([
            'child_id' => null,
            'message' => $request->message,
        ]);

        return response()->json([
            'message' => 'Broadcast notification sent successfully.',
            'notification' => $notification
        ], 201);
    }
}