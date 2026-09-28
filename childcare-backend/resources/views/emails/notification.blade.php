<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>{{ $notification->type }}</title>
</head>

<body style="
    margin: 0;
    padding: 0;
    background-color: #f3f6fa;
    font-family: Arial, Helvetica, sans-serif;
    color: #334155;
">

    <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="
            background-color: #f3f6fa;
            padding: 35px 15px;
        "
    >

        <tr>
            <td align="center">

                <!-- Main Card -->
                <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="
                        max-width: 620px;
                        background-color: #ffffff;
                        border: 1px solid #e2e8f0;
                        border-radius: 10px;
                        overflow: hidden;
                    "
                >

                    <!-- Header -->
                    <tr>
                        <td
                            style="
                                background-color: #21457B;
                                padding: 24px 30px;
                                text-align: center;
                            "
                        >

                            <div style="
                                color: #ffffff;
                                font-size: 20px;
                                font-weight: bold;
                                margin-bottom: 5px;
                            ">
                                Child Care Immunization Clinic
                            </div>

                            <div style="
                                color: #dbeafe;
                                font-size: 12px;
                            ">
                                Immunization & Appointment Notification
                            </div>

                        </td>
                    </tr>


                    <!-- Notification Title -->
                    <tr>
                        <td style="padding: 30px 35px 10px 35px;">

                            <div style="
                                font-size: 12px;
                                font-weight: bold;
                                color: #21457B;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                                margin-bottom: 8px;
                            ">
                                Notification
                            </div>

                            <h2 style="
                                margin: 0;
                                font-size: 22px;
                                color: #1e293b;
                                font-weight: 600;
                            ">
                                {{ $notification->type }}
                            </h2>

                        </td>
                    </tr>


                    <!-- Message -->
                    <tr>
                        <td style="padding: 10px 35px 25px 35px;">

                            <p style="
                                margin: 0 0 18px 0;
                                font-size: 14px;
                                line-height: 1.7;
                                color: #475569;
                            ">
                                Hello
                                <strong style="color: #1e293b;">
                                    {{ $notification->parent }}
                                </strong>,
                            </p>

                            <p style="
                                margin: 0;
                                font-size: 14px;
                                line-height: 1.7;
                                color: #475569;
                            ">
                                {{ $notification->message }}
                            </p>

                        </td>
                    </tr>


                    <!-- Child Information -->
                    @if ($notification->child_name)

                        <tr>
                            <td style="padding: 0 35px 20px 35px;">

                                <table
                                    width="100%"
                                    cellpadding="0"
                                    cellspacing="0"
                                    border="0"
                                    style="
                                        background-color: #f8fafc;
                                        border: 1px solid #e2e8f0;
                                        border-radius: 8px;
                                    "
                                >

                                    <tr>
                                        <td style="padding: 18px 20px;">

                                            <div style="
                                                font-size: 11px;
                                                color: #64748b;
                                                margin-bottom: 5px;
                                            ">
                                                CHILD
                                            </div>

                                            <div style="
                                                font-size: 15px;
                                                font-weight: bold;
                                                color: #1e293b;
                                            ">
                                                {{ $notification->child_name }}
                                            </div>

                                        </td>
                                    </tr>

                                </table>

                            </td>
                        </tr>

                    @endif


                    <!-- Appointment Information -->
                    @if ($notification->appointment)

                        <tr>
                            <td style="padding: 0 35px 25px 35px;">

                                <div style="
                                    font-size: 13px;
                                    font-weight: bold;
                                    color: #1e293b;
                                    margin-bottom: 10px;
                                ">
                                    Appointment Details
                                </div>


                                <table
                                    width="100%"
                                    cellpadding="0"
                                    cellspacing="0"
                                    border="0"
                                    style="
                                        border: 1px solid #e2e8f0;
                                        border-radius: 8px;
                                        border-collapse: separate;
                                    "
                                >

                                    <!-- Date -->
                                    <tr>
                                        <td style="
                                            padding: 13px 15px;
                                            border-bottom: 1px solid #edf2f7;
                                            width: 38%;
                                            font-size: 12px;
                                            color: #64748b;
                                        ">
                                            Appointment Date
                                        </td>

                                        <td style="
                                            padding: 13px 15px;
                                            border-bottom: 1px solid #edf2f7;
                                            font-size: 13px;
                                            font-weight: bold;
                                            color: #1e293b;
                                        ">
                                            {{ \Carbon\Carbon::parse($notification->appointment->appointment_date)->format('F d, Y') }}
                                        </td>
                                    </tr>


                                    <!-- Time -->
                                    <tr>
                                        <td style="
                                            padding: 13px 15px;
                                            border-bottom: 1px solid #edf2f7;
                                            font-size: 12px;
                                            color: #64748b;
                                        ">
                                            Appointment Time
                                        </td>

                                        <td style="
                                            padding: 13px 15px;
                                            border-bottom: 1px solid #edf2f7;
                                            font-size: 13px;
                                            font-weight: bold;
                                            color: #1e293b;
                                        ">
                                            {{ \Carbon\Carbon::parse($notification->appointment->appointment_time)->format('h:i A') }}
                                        </td>
                                    </tr>


                                    <!-- Location -->
                                    <tr>
                                        <td style="
                                            padding: 13px 15px;
                                            font-size: 12px;
                                            color: #64748b;
                                        ">
                                            Location
                                        </td>

                                        <td style="
                                            padding: 13px 15px;
                                            font-size: 13px;
                                            color: #1e293b;
                                        ">
                                            {{ $notification->appointment->address }}
                                        </td>
                                    </tr>

                                </table>

                            </td>
                        </tr>

                    @endif


                    <!-- Closing -->
                    <tr>
                        <td style="
                            padding: 5px 35px 30px 35px;
                        ">

                            <p style="
                                margin: 0;
                                font-size: 14px;
                                line-height: 1.7;
                                color: #475569;
                            ">
                                Thank you,<br>

                                <strong style="color: #21457B;">
                                    Child Care Immunization Clinic
                                </strong>
                            </p>

                        </td>
                    </tr>


                    <!-- Footer -->
                    <tr>
                        <td style="
                            background-color: #f8fafc;
                            border-top: 1px solid #e2e8f0;
                            padding: 18px 30px;
                            text-align: center;
                        ">

                            <div style="
                                font-size: 11px;
                                color: #94a3b8;
                                line-height: 1.5;
                            ">
                                This is an automated notification from the
                                Child Care Immunization Clinic.
                            </div>

                            <div style="
                                margin-top: 5px;
                                font-size: 10px;
                                color: #cbd5e1;
                            ">
                                Please do not reply directly to this email.
                            </div>

                        </td>
                    </tr>

                </table>

            </td>
        </tr>

    </table>

</body>
</html>