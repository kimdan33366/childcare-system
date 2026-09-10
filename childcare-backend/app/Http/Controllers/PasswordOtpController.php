<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\PasswordOtp;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class PasswordOtpController extends Controller
{
    public function sendOtp(Request $request)
    {
        $request->validate([
            'Admin_email' => 'required|email',
        ]);

        // Check if the email exists
        $admin = Admin::where('Admin_email', $request->Admin_email)->first();

        if (!$admin) {
            return response()->json([
                'message' => 'Email not found.'
            ], 404);
        }

        // Generate 6-digit OTP
        $otp = random_int(100000, 999999);

        // Save OTP
        PasswordOtp::create([
            'Admin_email' => $request->Admin_email,
            'otp' => $otp,
            'expires_at' => now()->addMinutes(5),
            'used' => false,
        ]);

        // Send email
        Mail::raw(
            "Your ChildCare-System password reset OTP is: {$otp}\n\nThis OTP will expire in 5 minutes.",
            function ($message) use ($request) {
                $message->to($request->Admin_email)
                        ->subject('ChildCare-System Password Reset OTP');
            }
        );

        return response()->json([
            'message' => 'OTP sent successfully.'
        ], 200);
    }
    public function verifyOtp(Request $request)
{
    $request->validate([
        'Admin_email' => 'required|email',
        'otp' => 'required|string|size:6',
    ]);

    $otpRecord = PasswordOtp::where('Admin_email', $request->Admin_email)
        ->where('otp', $request->otp)
        ->where('used', false)
        ->latest()
        ->first();

    if (!$otpRecord) {
        return response()->json([
            'success' => false,
            'message' => 'Invalid OTP.'
        ], 400);
    }

    if (now()->greaterThan($otpRecord->expires_at)) {
        return response()->json([
            'success' => false,
            'message' => 'OTP has expired.'
        ], 400);
    }

    return response()->json([
        'success' => true,
        'message' => 'OTP verified successfully.'
    ]);
}
public function resetPassword(Request $request)
{
    $request->validate([
        'Admin_email' => 'required|email',
        'otp' => 'required|string|size:6',
        'new_password' => 'required|string|min:6',
    ]);

    // Find the verified OTP
    $otpRecord = PasswordOtp::where('Admin_email', $request->Admin_email)
        ->where('otp', $request->otp)
        ->where('used', false)
        ->latest()
        ->first();

    // OTP doesn't exist
    if (!$otpRecord) {
        return response()->json([
            'success' => false,
            'message' => 'Invalid OTP.'
        ], 400);
    }

    // OTP expired
    if (now()->greaterThan($otpRecord->expires_at)) {
        return response()->json([
            'success' => false,
            'message' => 'OTP has expired.'
        ], 400);
    }

    // Find admin
    $admin = Admin::where(
        'Admin_email',
        $request->Admin_email
    )->first();

    if (!$admin) {
        return response()->json([
            'success' => false,
            'message' => 'Admin account not found.'
        ], 404);
    }

    // Change password
    $admin->Admin_password = \Illuminate\Support\Facades\Hash::make(
        $request->new_password
    );

    $admin->save();

    // Mark OTP as used
    $otpRecord->used = true;
    $otpRecord->save();

    return response()->json([
        'success' => true,
        'message' => 'Password reset successfully.'
    ], 200);
}
}