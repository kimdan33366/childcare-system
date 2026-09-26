<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{ $notification->type }}</title>
</head>

<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">

    <h2>{{ $notification->type }}</h2>

    <p>Hello {{ $notification->parent }},</p>

    <p>
        {{ $notification->message }}
    </p>

    @if ($notification->child_name)
        <p>
            <strong>Child:</strong> {{ $notification->child_name }}
        </p>
    @endif

    @if ($notification->appointment)
        <p>
            <strong>Appointment Date:</strong>
            {{ \Carbon\Carbon::parse($notification->appointment->appointment_date)->format('F d, Y') }}
        </p>

        <p>
            <strong>Appointment Time:</strong>
            {{ \Carbon\Carbon::parse($notification->appointment->appointment_time)->format('h:i A') }}
        </p>

        <p>
            <strong>Location:</strong>
            {{ $notification->appointment->address }}
        </p>
    @endif

    <p>
        Thank you,<br>
        Child Care Immunization Clinic
    </p>

</body>
</html>