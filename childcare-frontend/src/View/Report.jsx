import "../css/Report.css";

import Sidebar from "../View/Sidebar";
import { useState, useEffect } from "react";

function Report() {
  const [report, setReport] = useState(null);

  // Logged-in user
  const currentUser = JSON.parse(
    localStorage.getItem("currentUser")
  );

  const isAdmin = currentUser?.user_type === "Admin";
  const permissions = currentUser?.permissions || [];

  // Permission helper
  const hasPermission = (permission) => {
    return (
      isAdmin ||
      permissions.includes("all") ||
      permissions.includes(permission)
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
        const response = await fetch(
          "http://127.0.0.1:8000/api/reports"
        );

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
          <div
            style={{
              padding: "40px",
              textAlign: "center",
            }}
          >
            <h2>Access Denied</h2>

            <p>
              You do not have permission to access Reports.
            </p>
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

  const vaccinationStatus =
    report?.vaccination_status || {};

  const vaccineUsage = Array.isArray(
    report?.vaccine_usage
  )
    ? report.vaccine_usage
    : [];

  const appointmentSummary = Array.isArray(
    report?.appointment_summary
  )
    ? report.appointment_summary
    : [];

  /* =========================================================
     MONTHLY DOSE GRAPH
  ========================================================= */

  const maxDose = Math.max(
    ...monthlyDoses.map((item) =>
      Number(item.dose_count || 0)
    ),
    0
  );

  const graphMax =
    Math.ceil(maxDose / 10) * 10 || 10;

  /* =========================================================
     APPOINTMENT COUNTS
  ========================================================= */

  const getAppointmentCount = (status) => {
    const appointment = appointmentSummary.find(
      (item) =>
        String(item.status).toLowerCase() ===
        status.toLowerCase()
    );

    return appointment?.count ?? 0;
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="report-dashboard">

      <Sidebar />

      <main className="report-content">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="report-topbar">

          <div>
            <h1>Reports</h1>

            <p>
              Vaccination and clinic performance overview.
            </p>
          </div>

        </div>


        {/* =====================================================
            SUMMARY CARDS
        ===================================================== */}

        <div className="report-summary">

          <div className="report-summary-card">

            <span>Overall Coverage</span>

            <strong>
              {report
                ? `${report.overall_coverage ?? 0}%`
                : "..."}
            </strong>

          </div>


          <div className="report-summary-card">

            <span>Complete Series</span>

            <strong>
              {report
                ? report.complete_series ?? 0
                : "..."}
            </strong>

          </div>


          <div className="report-summary-card">

            <span>Total Doses</span>

            <strong>
              {report
                ? report.total_dose_q2 ??
                  report.total_doses ??
                  0
                : "..."}
            </strong>

          </div>

        </div>


        {/* =====================================================
            MIDDLE SECTION
        ===================================================== */}

        <div className="report-middle">

          {/* ===================================================
              MONTHLY DOSES
          =================================================== */}

          <div className="report-section report-monthly">

            <div className="report-section-header">

              <div>

                <h2>Monthly Doses</h2>

                <p>
                  Doses administered throughout the year.
                </p>

              </div>

            </div>


            <div className="report-chart">

              <div className="report-y-axis">

                {Array.from(
                  { length: 6 },
                  (_, index) => (
                    <span key={index}>
                      {Math.round(
                        graphMax -
                          (graphMax / 5) *
                            index
                      )}
                    </span>
                  )
                )}

              </div>


              <div className="report-bars">

                {monthlyDoses.length > 0 ? (

                  monthlyDoses.map(
                    (item, index) => {

                      const doseCount = Number(
                        item.dose_count || 0
                      );

                      const height =
                        graphMax > 0
                          ? (doseCount /
                              graphMax) *
                            100
                          : 0;

                      return (
                        <div
                          className="report-bar-group"
                          key={
                            item.id ||
                            item.month ||
                            index
                          }
                        >

                          <div
                            className="report-bar"
                            style={{
                              height: `${height}%`,
                            }}
                            title={`${doseCount} doses`}
                          />

                          <span>
                            {item.month}
                          </span>

                        </div>
                      );
                    }
                  )

                ) : (

                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#777",
                    }}
                  >
                    No monthly dose data available.
                  </div>

                )}

              </div>

            </div>

          </div>


          {/* ===================================================
              VACCINATION STATUS
          =================================================== */}

          <div className="report-section report-status">

            <div className="report-section-header">

              <div>

                <h2>Vaccination Status</h2>

                <p>
                  Current vaccination progress.
                </p>

              </div>

            </div>


            <div className="report-status-list">

              <div className="report-status-item">

                <span>Completed</span>

                <strong>
                  {report
                    ? vaccinationStatus.completed ?? 0
                    : "..."}
                </strong>

              </div>


              <div className="report-status-item">

                <span>Continuing</span>

                <strong>
                  {report
                    ? vaccinationStatus.continuing ?? 0
                    : "..."}
                </strong>

              </div>


              <div className="report-status-item">

                <span>Missed</span>

                <strong>
                  {report
                    ? vaccinationStatus.missed ?? 0
                    : "..."}
                </strong>

              </div>


              <div className="report-status-item">

                <span>Not Started</span>

                <strong>
                  {report
                    ? vaccinationStatus.not_started ?? 0
                    : "..."}
                </strong>

              </div>

            </div>

          </div>

        </div>


        {/* =====================================================
            BOTTOM SECTION
        ===================================================== */}

        <div className="report-bottom">

          {/* ===================================================
              VACCINE USAGE
          =================================================== */}

          <div className="report-section">

            <div className="report-section-header">

              <div>

                <h2>Vaccine Usage</h2>

                <p>
                  Doses administered by vaccine.
                </p>

              </div>

            </div>


            <div className="report-usage-list">

              {vaccineUsage.length > 0 ? (

                vaccineUsage.map(
                  (item, index) => (

                    <div
                      className="report-usage-item"
                      key={
                        item.vaccine_id ||
                        item.vaccine_name ||
                        index
                      }
                    >

                      <span>
                        {item.vaccine_name ||
                          "Unknown Vaccine"}
                      </span>

                      <strong>
                        {item.dose_count ?? 0} doses
                      </strong>

                    </div>

                  )
                )

              ) : (

                <div className="report-usage-item">

                  <span>
                    No vaccine usage recorded
                  </span>

                  <strong>
                    0 doses
                  </strong>

                </div>

              )}

            </div>

          </div>


          {/* ===================================================
              APPOINTMENT SUMMARY
          =================================================== */}

          <div className="report-section">

            <div className="report-section-header">

              <div>

                <h2>Appointment Summary</h2>

                <p>
                  Appointment status overview.
                </p>

              </div>

            </div>


            <div className="report-appointment-list">

              <div className="report-appointment-item">

                <span>Pending</span>

                <strong>
                  {report
                    ? getAppointmentCount("Pending")
                    : "..."}
                </strong>

              </div>


              <div className="report-appointment-item">

                <span>Completed</span>

                <strong>
                  {report
                    ? getAppointmentCount("Completed")
                    : "..."}
                </strong>

              </div>


              <div className="report-appointment-item">

                <span>Missed</span>

                <strong>
                  {report
                    ? getAppointmentCount("Missed")
                    : "..."}
                </strong>

              </div>


              <div className="report-appointment-item">

                <span>Cancelled</span>

                <strong>
                  {report
                    ? getAppointmentCount("Cancelled")
                    : "..."}
                </strong>

              </div>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

export default Report;