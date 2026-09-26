<?php

namespace App\Http\Controllers;

use App\Mail\NotificationMail;
use App\Models\Child;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class NotificationController extends Controller
{
    public function index()
    {
        $notifications = Notification::with('appointment')
            ->leftJoin(
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

    public function store(Request $request)
    {
        $request->validate([
            'child_id' => 'required|exists:children,child_id',
            'message' => 'required|string',
            'type' => 'nullable|string',
            'appointment_id' => 'nullable|exists:appointments,appointment_id',
        ]);

        $child = Child::findOrFail($request->child_id);

        $user = User::findOrFail($child->user_id);

        if ($user->status !== 'Active') {
            return response()->json([
                'message' => 'The parent account is inactive.'
            ], 400);
        }

        if (empty($user->email)) {
            return response()->json([
                'message' => 'The parent does not have an email address.'
            ], 400);
        }

        $notification = Notification::create([
            'child_id' => $child->child_id,
            'appointment_id' => $request->appointment_id,
            'child_name' => $child->child_name,
            'parent' => $user->user_fullname,
            'phone' => $user->mobile_number,
            'email' => $user->email,
            'type' => $request->type ?? 'General Announcement',
            'message' => $request->message,
            'status' => 'Pending',
        ]);

        try {
            Mail::to($user->email)->send(
                new NotificationMail($notification)
            );

            $notification->update([
                'status' => 'Sent',
            ]);

            return response()->json([
                'message' => 'Notification sent successfully.',
                'notification' => $notification->fresh()
            ], 201);

        } catch (\Throwable $e) {
            $notification->update([
                'status' => 'Failed',
            ]);

            return response()->json([
                'message' => 'Notification was created, but the email could not be sent.',
                'notification' => $notification->fresh(),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function broadcast(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'type' => 'nullable|string',
        ]);

        $users = User::where('status', 'Active')
            ->whereNotNull('email')
            ->where('email', '!=', '')
            ->get();

        $notifications = [];

        foreach ($users as $user) {
            $notification = Notification::create([
                'child_id' => null,
                'appointment_id' => null,
                'child_name' => null,
                'parent' => $user->user_fullname,
                'phone' => $user->mobile_number,
                'email' => $user->email,
                'type' => $request->type ?? 'General Announcement',
                'message' => $request->message,
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
            }

            $notifications[] = $notification->fresh();
        }

        return response()->json([
            'message' => 'Broadcast notification processed successfully.',
            'notifications' => $notifications,
        ], 201);
    }

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