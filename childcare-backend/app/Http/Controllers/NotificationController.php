<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Child;
use App\Models\User;
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

        $child = Child::findOrFail($request->child_id);

        $user = User::findOrFail($child->user_id);

        if ($user->status !== 'Active') {
            return response()->json([
                'message' => 'The parent account is inactive.'
            ], 400);
        }

        $notification = Notification::create([
            'child_id' => $child->child_id,
            'parent' => $user->user_fullname,
            'phone' => $user->mobile_number,
            'message' => $request->message,
            'status' => 'Pending',
        ]);

        return response()->json([
            'message' => 'Notification created successfully.',
            'notification' => $notification
        ], 201);
    }

    // Send notification to all active parents
    public function broadcast(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
        ]);

        $users = User::where('status', 'Active')->get();

        $notifications = [];

        foreach ($users as $user) {
            $notifications[] = Notification::create([
                'child_id' => null,
                'parent' => $user->user_fullname,
                'phone' => $user->mobile_number,
                'message' => $request->message,
                'status' => 'Pending',
            ]);
        }

        return response()->json([
            'message' => 'Broadcast notification created successfully.',
            'notifications' => $notifications
        ], 201);
    }
        // Delete notification
    public function destroy($id)
    {
        $notification = Notification::find($id);

        if (!$notification) {
            return response()->json([
                'message' => 'Notification not found.'
            ], 404);
        }

        $notification->delete();

        return response()->json([
            'message' => 'Notification deleted successfully.'
        ]);
    }
}