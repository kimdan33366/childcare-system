import "../css/Report.css";

import Sidebar from "../View/Sidebar";
import { useState, useEffect } from "react";

function Report() {
  const [report, setReport] = useState(null);

  // Logged-in user
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const isAdmin = currentUser?.user_type === "Admin";
  const permissions = currentUser?.permissions || [];

  // Permission helper
  const hasPermission = (permission) => {
    return (
      isAdmin || permissions.includes("all") || permissions.includes(permission)
    );
  };

  /* =========================================================
     FETCH REPORT
  ========================================================= */

  useEffect(() => {
    if (!hasPermission("view_reports")) {
      return;
    }

    const fetchReport = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/reports");

        if (!response.ok) {
          throw new Error("Failed to fetch report");
        }

        const data = await response.json();

        setReport(data);
      } catch (error) {
        console.error("Error fetching report:", error);
        setReport(null);
      }
    };

    fetchReport();
  }, []);

  /* =========================================================
     PAGE ACCESS
  ========================================================= */

  if (!isAdmin && !permissions.includes("view_reports")) {
    return (
      <div className="report-dashboard">
        <Sidebar />

        <main className="report-content">
          <div className="report-access-denied">
            <h2>Access Denied</h2>

            <p>You do not have permission to access Reports.</p>
          </div>
        </main>
      </div>
    );
  }

  /* =========================================================
     REPORT DATA
  ========================================================= */

  const monthlyDoses = Array.isArray(report?.monthly_doses)
    ? report.monthly_doses
    : [];

  const vaccinationStatus = report?.vaccination_status || {};

  const vaccineUsage = Array.isArray(report?.vaccine_usage)
    ? report.vaccine_usage
    : [];

  const appointmentSummary = Array.isArray(report?.appointment_summary)
    ? report.appointment_summary
    : [];

  /* =========================================================
     MONTHLY DOSE GRAPH
  ========================================================= */

  const maxDose = Math.max(
    ...monthlyDoses.map((item) => Number(item.dose_count || 0)),
    0,
  );

  const graphMax = Math.ceil(maxDose / 10) * 10 || 10;

  /* =========================================================
     APPOINTMENT COUNTS
  ========================================================= */

  const getAppointmentCount = (status) => {
    const appointment = appointmentSummary.find(
      (item) => String(item.status).toLowerCase() === status.toLowerCase(),
    );

    return appointment?.count ?? 0;
  };

  const pendingAppointments = getAppointmentCount("Pending");

  const completedAppointments = getAppointmentCount("Completed");

  const missedAppointments = getAppointmentCount("Missed");

  const cancelledAppointments = getAppointmentCount("Cancelled");

  /*
   * For the summary card, use all currently known
   * appointment statuses.
   */
  const totalAppointmentsThisMonth =
    Number(pendingAppointments || 0) +
    Number(completedAppointments || 0) +
    Number(missedAppointments || 0) +
    Number(cancelledAppointments || 0);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="report-dashboard">
      <Sidebar />

      <main className="report-content">
        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="report-topbar">
          <div className="report-header-text">
            <h1>Reports</h1>

            <p>Vaccination and clinic performance overview.</p>
          </div>

          <button
            type="button"
            className="report-export-btn"
            onClick={() =>{
              window.open("http://127.0.0.1:8000/api/reports/export", "_blank");
            }}
          >
            Export Report
          </button>
        </div>

        {/* =====================================================
            SUMMARY CARDS
        ===================================================== */}

        <div className="report-summary">
          {/* Vaccination Coverage */}

          <div className="report-summary-card">
            <div className="report-summary-card-content">
              <span>Vaccination Coverage</span>

              <strong>
                {report ? `${report.overall_coverage ?? 0}%` : "..."}
              </strong>

              <small>Overall vaccination progress</small>
            </div>
          </div>

          {/* Children Completed */}

          <div className="report-summary-card">
            <div className="report-summary-card-content">
              <span>Children Completed</span>

              <strong>{report ? (report.complete_series ?? 0) : "..."}</strong>

              <small>Completed vaccination series</small>
            </div>
          </div>

          {/* Appointments This Month */}

          <div className="report-summary-card">
            <div className="report-summary-card-content">
              <span>Appointments This Month</span>

              <strong>{report ? totalAppointmentsThisMonth : "..."}</strong>

              <small>Scheduled clinic visits</small>
            </div>
          </div>
        </div>

        {/* =====================================================
            MONTHLY VACCINATION ACTIVITY
        ===================================================== */}

        <div className="report-section report-monthly">
          <div className="report-section-header">
            <div>
              <h2>Monthly Vaccination Activity</h2>

              <p>Doses administered throughout the year.</p>
            </div>
          </div>

          <div className="report-chart">
            <div className="report-y-axis">
              {Array.from({ length: 6 }, (_, index) => (
                <span key={index}>
                  {Math.round(graphMax - (graphMax / 5) * index)}
                </span>
              ))}
            </div>

            <div className="report-bars">
              {monthlyDoses.length > 0 ? (
                monthlyDoses.map((item, index) => {
                  const doseCount = Number(item.dose_count || 0);

                  const height =
                    graphMax > 0 ? (doseCount / graphMax) * 100 : 0;

                  return (
                    <div
                      className="report-bar-group"
                      key={item.id || item.month || index}
                    >
                      <div
                        className="report-bar"
                        style={{
                          height: `${height}%`,
                        }}
                        title={`${doseCount} doses`}
                      />

                      <span>{item.month}</span>
                    </div>
                  );
                })
              ) : (
                <div className="report-no-data">
                  No monthly vaccination data available.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =====================================================
            STATUS SECTION
        ===================================================== */}

        <div className="report-status-grid">
          {/* ===================================================
              VACCINATION STATUS
          =================================================== */}

          <div className="report-section">
            <div className="report-section-header">
              <div>
                <h2>Vaccination Status</h2>

                <p>Current vaccination progress.</p>
              </div>
            </div>

            <div className="report-status-list">
              <div className="report-status-item">
                <span>Completed</span>

                <strong>
                  {report ? (vaccinationStatus.completed ?? 0) : "..."}
                </strong>
              </div>

              <div className="report-status-item">
                <span>Continuing</span>

                <strong>
                  {report ? (vaccinationStatus.continuing ?? 0) : "..."}
                </strong>
              </div>

              <div className="report-status-item">
                <span>Missed</span>

                <strong>
                  {report ? (vaccinationStatus.missed ?? 0) : "..."}
                </strong>
              </div>

              <div className="report-status-item">
                <span>Not Started</span>

                <strong>
                  {report ? (vaccinationStatus.not_started ?? 0) : "..."}
                </strong>
              </div>
            </div>
          </div>

          {/* ===================================================
              APPOINTMENT STATUS
          =================================================== */}

          <div className="report-section">
            <div className="report-section-header">
              <div>
                <h2>Appointment Status</h2>

                <p>Current appointment activity.</p>
              </div>
            </div>

            <div className="report-status-list">
              <div className="report-status-item">
                <span>Upcoming</span>

                <strong>{report ? pendingAppointments : "..."}</strong>
              </div>

              <div className="report-status-item">
                <span>Completed</span>

                <strong>{report ? completedAppointments : "..."}</strong>
              </div>

              <div className="report-status-item">
                <span>Missed</span>

                <strong>{report ? missedAppointments : "..."}</strong>
              </div>

              <div className="report-status-item">
                <span>Cancelled</span>

                <strong>{report ? cancelledAppointments : "..."}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            VACCINE USAGE
        ===================================================== */}

        <div className="report-section report-vaccine-usage">
          <div className="report-section-header">
            <div>
              <h2>Vaccine Usage</h2>

              <p>Doses administered by vaccine.</p>
            </div>
          </div>

          <div className="report-usage-table">
            <div className="report-usage-header">
              <span>Vaccine</span>

              <span>Doses Administered</span>
            </div>

            {vaccineUsage.length > 0 ? (
              vaccineUsage.map((item, index) => (
                <div
                  className="report-usage-row"
                  key={item.vaccine_id || item.vaccine_name || index}
                >
                  <span>{item.vaccine_name || "Unknown Vaccine"}</span>

                  <strong>{item.dose_count ?? 0}</strong>
                </div>
              ))
            ) : (
              <div className="report-usage-row report-empty-row">
                <span>No vaccine usage recorded</span>

                <strong>0</strong>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Report;
