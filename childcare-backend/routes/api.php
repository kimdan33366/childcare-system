<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ReportPdfController;
use App\Http\Controllers\ChildController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AdminController; 
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\RegisterController;
use Illuminate\Support\Facades\Mail;
use App\Mail\TestMail;
use App\Http\Controllers\PasswordOtpController;
use App\Http\Controllers\VaccineController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PatientViewRecordController;


Route::get('/children', [ChildController::class, 'index']);
Route::get('/children/{id}', [ChildController::class, 'show']);
Route::post('/children', [ChildController::class, 'store']);
Route::put('/children/{id}', [ChildController::class, 'update']);
Route::delete('/children/{id}', [ChildController::class, 'destroy']);

Route::get('/users', [UserController::class, 'index']);
Route::get('/users/{id}', [UserController::class, 'show']);
Route::post('/users', [UserController::class, 'store']);
Route::put('/users/{id}', [UserController::class, 'update']);
Route::delete('/users/{id}', [UserController::class, 'destroy']);   

Route::get('/admins', [AdminController::class, 'index']);
Route::post('/admins', [AdminController::class, 'store']);
Route::post('/admins/login', [AdminController::class, 'login']);
Route::post('/admins/register', [AdminController::class, 'register']);

Route::put('/profile/{id}', [ProfileController::class, 'update']);

Route::get('/dashboard', [DashboardController::class, 'index']);

Route::get('/appointments', [AppointmentController::class, 'index']);
Route::post('/appointments', [AppointmentController::class, 'store']);
Route::get('/appointments/{id}', [AppointmentController::class, 'show']);
Route::put('/appointments/{id}', [AppointmentController::class, 'update']);
Route::delete('/appointments/{id}', [AppointmentController::class, 'destroy']);

Route::post('/send-otp', [PasswordOtpController::class, 'sendOtp']);
Route::post('/verify-otp', [PasswordOtpController::class, 'verifyOtp']);
Route::post('/reset-password', [PasswordOtpController::class, 'resetPassword']);

Route::get('/vaccines', [VaccineController::class, 'index']);
Route::get('/vaccines/{id}', [VaccineController::class, 'show']);
Route::post('/vaccines', [VaccineController::class, 'store']);
Route::put('/vaccines/{id}', [VaccineController::class, 'update']);
Route::delete('/vaccines/{id}', [VaccineController::class, 'destroy']);

Route::get('/reports', [ReportController::class, 'index']);
Route::get('/reports/export', [ReportPdfController::class, 'export']);

Route::get('/notifications', [NotificationController::class, 'index']);
Route::post('/notifications', [NotificationController::class, 'store']);
Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
Route::post('/notifications/broadcast', [NotificationController::class, 'broadcast']);

Route::get('/patient-records/{child_id}', [PatientViewRecordController::class, 'getRecords']);
Route::put('/patient-records/{patient_recordID}/status', [PatientViewRecordController::class, 'updateStatus']);
Route::post('/patient-records', [PatientViewRecordController::class, 'store']); 
Route::put('/patient-records/{patient_recordID}', [PatientViewRecordController::class, 'update']);

Route::get('/test-email', function () {
    Mail::to('arielamit43@gmail.com')->send(new TestMail());

    return response()->json([
        'message' => 'Test email sent!'
    ]);
});