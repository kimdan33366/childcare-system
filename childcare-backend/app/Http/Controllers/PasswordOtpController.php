<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Admin;
use App\Models\PasswordOtp;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class PasswordOtpController extends Controller
{
    // ==========================================
    // SEND OTP
    // Supports both User and Admin accounts
    // ==========================================
    public function sendOtp(Request $request)
    {
        $request->validate([
            'email' => 'nullable|required_without:Admin_email|email',
            'Admin_email' => 'nullable|required_without:email|email',
        ]);

        $email = $request->input('email')
            ?? $request->input('Admin_email');

        // Check whether the email belongs to a regular user or admin.
        $user = User::where('email', $email)->first();
        $admin = Admin::where('Admin_email', $email)->first();

        if (!$user && !$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Email not found.',
            ], 404);
        }
        



        // Generate a six-digit OTP.
        $otp = (string) random_int(100000, 999999);

        PasswordOtp::create([
            'Admin_email' => $email,
            'otp' => $otp,
            'expires_at' => now()->addMinutes(5),
            'used' => false,
        ]);

        // Send the OTP to the supplied email.
        Mail::raw(
            "Your ChildCare-System password reset OTP is: {$otp}\n\n"
            . "This OTP will expire in 5 minutes.",
            function ($message) use ($email) {
                $message->to($email)
                    ->subject('ChildCare-System Password Reset OTP');
            }
        );

        return response()->json([
            'success' => true,
            'message' => 'OTP sent successfully.',
        ], 200);
    }

    // ==========================================
    // VERIFY OTP
    // Supports both email request formats
    // ==========================================
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'nullable|required_without:Admin_email|email',
            'Admin_email' => 'nullable|required_without:email|email',
            'otp' => 'required|string|size:6',
        ]);

        $email = $request->input('email')
            ?? $request->input('Admin_email');

        $otpRecord = PasswordOtp::where('Admin_email', $email)
            ->where('otp', $request->otp)
            ->where('used', false)
            ->latest()
            ->first();

        if (!$otpRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid OTP.',
            ], 400);
        }

        if (now()->greaterThan($otpRecord->expires_at)) {
            return response()->json([
                'success' => false,
                'message' => 'OTP has expired.',
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'OTP verified successfully.',
        ], 200);
    }

    // ==========================================
    // RESET PASSWORD
    // Supports both User and Admin accounts
    // ==========================================
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'nullable|required_without:Admin_email|email',
            'Admin_email' => 'nullable|required_without:email|email',
            'otp' => 'required|string|size:6',
            'new_password' => 'required|string|min:6',
        ]);

        $email = $request->input('email')
            ?? $request->input('Admin_email');

        // Find the latest matching, unused OTP.
        $otpRecord = PasswordOtp::where('Admin_email', $email)
            ->where('otp', $request->otp)
            ->where('used', false)
            ->latest()
            ->first();

        if (!$otpRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid OTP.',
            ], 400);
        }

        if (now()->greaterThan($otpRecord->expires_at)) {
            return response()->json([
                'success' => false,
                'message' => 'OTP has expired.',
            ], 400);
        }

        // Find the matching account.
        $user = User::where('email', $email)->first();
        $admin = Admin::where('Admin_email', $email)->first();

        if (!$user && !$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Account not found.',
            ], 404);
        }

        // Update the password and consume the OTP together.
        DB::transaction(function () use (
            $user,
            $admin,
            $request,
            $otpRecord
        ) {
            if ($user) {
                $user->password = Hash::make($request->new_password);
                $user->save();
            } else {
                $admin->Admin_password = Hash::make(
                    $request->new_password
                );
                $admin->save();
            }

            $otpRecord->used = true;
            $otpRecord->save();
        });

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully.',
        ], 200);
    }
}
