<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">

    <title>Vaccination Report</title>

    <style>

        @page {
            margin: 35px 40px;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            color: #1e293b;
        }

        h1 {
            font-size: 23px;
            margin: 0 0 5px 0;
            color: #1e293b;
        }

        h2 {
            font-size: 16px;
            margin: 25px 0 10px 0;
            color: #1e293b;
        }

        p {
            margin: 4px 0;
        }


        /* ==========================================
           HEADER
        =========================================== */

        .header {
            border-bottom: 2px solid #21457B;
            padding-bottom: 14px;
            margin-bottom: 20px;
        }

        .header-subtitle {
            color: #64748b;
            font-size: 11px;
        }

        .clinic-info {
            margin-top: 8px;
            font-size: 10px;
            color: #64748b;
        }


        /* ==========================================
           SUMMARY CARDS
        =========================================== */

        .summary-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 8px 0;
            margin-left: -8px;
            margin-right: -8px;
        }

        .summary-card {
            width: 33.33%;
            border: 1px solid #dbe2ea;
            padding: 14px;
            vertical-align: top;
        }

        .summary-label {
            font-size: 10px;
            color: #64748b;
            margin-bottom: 7px;
        }

        .summary-value {
            font-size: 21px;
            font-weight: bold;
            color: #21457B;
        }

        .summary-description {
            font-size: 9px;
            color: #94a3b8;
            margin-top: 6px;
        }


        /* ==========================================
           GENERAL TABLE
        =========================================== */

        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
        }

        .data-table th {
            background: #f5f7fa;
            border: 1px solid #dbe2ea;
            padding: 9px;
            text-align: left;
            font-size: 10px;
            color: #475569;
        }

        .data-table td {
            border: 1px solid #dbe2ea;
            padding: 9px;
            font-size: 10px;
        }

        .data-table th:last-child,
        .data-table td:last-child {
            text-align: right;
        }


        /* ==========================================
           TWO COLUMN SECTIONS
        =========================================== */

        .two-column-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 10px 0;
            margin-left: -10px;
        }

        .two-column-cell {
            width: 50%;
            vertical-align: top;
        }

        .section-box {
            border: 1px solid #dbe2ea;
            padding: 12px;
        }

        .section-box h3 {
            margin: 0 0 10px 0;
            font-size: 13px;
            color: #1e293b;
        }


        /* ==========================================
           STATUS TABLE
        =========================================== */

        .status-table {
            width: 100%;
            border-collapse: collapse;
        }

        .status-table td {
            padding: 8px 4px;
            border-bottom: 1px solid #edf0f3;
            font-size: 10px;
        }

        .status-table td:last-child {
            text-align: right;
            font-weight: bold;
            color: #21457B;
        }

        .status-table tr:last-child td {
            border-bottom: none;
        }


        /* ==========================================
           FOOTER
        =========================================== */

        .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #dbe2ea;
            text-align: center;
            font-size: 9px;
            color: #94a3b8;
        }

    </style>

</head>

<body>


    {{-- ==========================================
         HEADER
    =========================================== --}}

    <div class="header">

        <h1>Vaccination Report</h1>

        <p class="header-subtitle">
            Vaccination and clinic performance overview
        </p>

        <div class="clinic-info">

            @if($clinic)

                {{ $clinic->clinic_name ?? 'Child Care Clinic' }}

                @if(!empty($clinic->address))
                    &nbsp; | &nbsp; {{ $clinic->address }}
                @endif

                @if(!empty($clinic->contact_number))
                    &nbsp; | &nbsp; {{ $clinic->contact_number }}
                @endif

            @else

                Child Care Clinic

            @endif

            &nbsp; | &nbsp;

            Report Year:
            {{ $report->report_year ?? date('Y') }}

        </div>

    </div>


    {{-- ==========================================
         SUMMARY
    =========================================== --}}

    <h2>Summary</h2>

    <table class="summary-table">

        <tr>

            {{-- Vaccination Coverage --}}

            <td class="summary-card">

                <div class="summary-label">
                    Vaccination Coverage
                </div>

                <div class="summary-value">
                    {{ $report->overall_coverage ?? 0 }}%
                </div>

                <div class="summary-description">
                    Overall vaccination progress
                </div>

            </td>


            {{-- Children Completed --}}

            <td class="summary-card">

                <div class="summary-label">
                    Children Completed
                </div>

                <div class="summary-value">
                    {{ $report->complete_series ?? 0 }}
                </div>

                <div class="summary-description">
                    Completed vaccination series
                </div>

            </td>


            {{-- Appointments --}}

            <td class="summary-card">

                <div class="summary-label">
                    Appointments
                </div>

                <div class="summary-value">
                    {{ $appointmentSummary->sum('count') }}
                </div>

                <div class="summary-description">
                    Total recorded appointments
                </div>

            </td>

        </tr>

    </table>


    {{-- ==========================================
         MONTHLY VACCINATION ACTIVITY
    =========================================== --}}

    <h2>Monthly Vaccination Activity</h2>

    <table class="data-table">

        <thead>

            <tr>
                <th>
                    Month
                </th>

                <th>
                    Doses Administered
                </th>
            </tr>

        </thead>

        <tbody>

            @forelse($monthlyDoses as $item)

                <tr>

                    <td>
                        {{ $item->month }}
                    </td>

                    <td>
                        {{ $item->dose_count }}
                    </td>

                </tr>

            @empty

                <tr>

                    <td colspan="2">
                        No monthly vaccination data available.
                    </td>

                </tr>

            @endforelse

        </tbody>

    </table>


    {{-- ==========================================
         VACCINATION + APPOINTMENT STATUS
    =========================================== --}}

    <h2>Current Status</h2>

    <table class="two-column-table">

        <tr>

            {{-- Vaccination Status --}}

            <td class="two-column-cell">

                <div class="section-box">

                    <h3>
                        Vaccination Status
                    </h3>

                    <table class="status-table">

                        <tr>
                            <td>Completed</td>

                            <td>
                                {{ $vaccinationStatus['completed'] ?? 0 }}
                            </td>
                        </tr>

                        <tr>
                            <td>Continuing</td>

                            <td>
                                {{ $vaccinationStatus['continuing'] ?? 0 }}
                            </td>
                        </tr>

                        <tr>
                            <td>Missed</td>

                            <td>
                                {{ $vaccinationStatus['missed'] ?? 0 }}
                            </td>
                        </tr>

                        <tr>
                            <td>Not Started</td>

                            <td>
                                {{ $vaccinationStatus['not_started'] ?? 0 }}
                            </td>
                        </tr>

                    </table>

                </div>

            </td>


            {{-- Appointment Status --}}

            <td class="two-column-cell">

                <div class="section-box">

                    <h3>
                        Appointment Status
                    </h3>

                    <table class="status-table">

                        @php
                            $appointmentStatuses = [
                                'Pending' => 0,
                                'Completed' => 0,
                                'Missed' => 0,
                                'Cancelled' => 0,
                            ];
                        @endphp


                        @foreach($appointmentSummary as $appointment)

                            @php
                                $status = $appointment->status ?? '';

                                foreach ($appointmentStatuses as $key => $value) {
                                    if (strtolower($key) === strtolower($status)) {
                                        $appointmentStatuses[$key] = $appointment->count;
                                    }
                                }
                            @endphp

                        @endforeach


                        <tr>
                            <td>Upcoming</td>

                            <td>
                                {{ $appointmentStatuses['Pending'] }}
                            </td>
                        </tr>

                        <tr>
                            <td>Completed</td>

                            <td>
                                {{ $appointmentStatuses['Completed'] }}
                            </td>
                        </tr>

                        <tr>
                            <td>Missed</td>

                            <td>
                                {{ $appointmentStatuses['Missed'] }}
                            </td>
                        </tr>

                        <tr>
                            <td>Cancelled</td>

                            <td>
                                {{ $appointmentStatuses['Cancelled'] }}
                            </td>
                        </tr>

                    </table>

                </div>

            </td>

        </tr>

    </table>


    {{-- ==========================================
         VACCINE USAGE
    =========================================== --}}

    <h2>Vaccine Usage</h2>

    <table class="data-table">

        <thead>

            <tr>

                <th>
                    Vaccine
                </th>

                <th>
                    Doses Administered
                </th>

            </tr>

        </thead>

        <tbody>

            @forelse($vaccineUsage as $vaccine)

                <tr>

                    <td>
                        {{ $vaccine->vaccine_name }}
                    </td>

                    <td>
                        {{ $vaccine->dose_count }}
                    </td>

                </tr>

            @empty

                <tr>

                    <td colspan="2">
                        No vaccine usage recorded.
                    </td>

                </tr>

            @endforelse

        </tbody>

    </table>


    {{-- ==========================================
         FOOTER
    =========================================== --}}

    <div class="footer">

        Child Care Immunization System

        &nbsp; | &nbsp;

        Generated on
        {{ now()->format('F d, Y h:i A') }}

    </div>


</body>
</html>