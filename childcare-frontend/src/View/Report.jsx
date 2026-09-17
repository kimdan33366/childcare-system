import "../css/Report.css";

import Sidebar from "../View/Sidebar";
import { useState, useEffect } from "react";
import { reportCards } from "../model/ReportModel";

function Report() {
  const [report, setReport] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/reports")
      .then((response) => response.json())
      .then((data) => {
        setReport(data);
      })
      .catch((error) => {
        console.error("Error fetching report:", error);
      });
  }, []);

  const monthlyDoses = report?.monthly_doses || [];

  const maxDose = Math.max(
    ...monthlyDoses.map((item) => Number(item.dose_count)),
    0,
  );

  const graphMax = Math.ceil(maxDose / 10) * 10 || 10;

  return (
    <div className="report-dashboard">
      <Sidebar />

      <main className="report-content">
        <div className="report-topbar">
          <div>
            <h1>Reports</h1>
            <p>Vaccination and clinic performance overview.</p>
          </div>

          <button className="report-export-btn">Export Report</button>
        </div>

        <div className="report-summary">
          <div className="report-summary-card">
            <span>Overall Coverage</span>
            <strong>{report ? `${report.overall_coverage}%` : "..."}</strong>
          </div>

          <div className="report-summary-card">
            <span>Complete Series</span>
            <strong>{report ? report.complete_series : "..."}</strong>
          </div>

          <div className="report-summary-card">
            <span>Total Doses</span>
            <strong>{report ? report.total_dose_q2 : "..."}</strong>
          </div>
        </div>

        <div className="report-middle">
          {/* Monthly Doses */}

          <div className="report-section report-monthly">
            <div className="report-section-header">
              <div>
                <h2>Monthly Doses</h2>
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
                {monthlyDoses.map((item) => (
                  <div className="report-bar-group" key={item.id}>
                    <div
                      className="report-bar"
                      style={{
                        height: `${(Number(item.dose_count) / graphMax) * 100}%`,
                      }}
                    />

                    <span>{item.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Vaccination Status */}

          <div className="report-section report-status">
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
                  {report ? (report.vaccination_status.completed ?? 0) : "..."}
                </strong>
              </div>

              <div className="report-status-item">
                <span>Continuing</span>
                <strong>
                  {report ? (report.vaccination_status.continuing ?? 0) : "..."}
                </strong>
              </div>

              <div className="report-status-item">
                <span>Missed</span>
                <strong>
                  {report ? (report.vaccination_status.missed ?? 0) : "..."}
                </strong>
              </div>

              <div className="report-status-item">
                <span>Not Started</span>
                <strong>
                  {report
                    ? (report.vaccination_status.not_started ?? 0)
                    : "..."}
                </strong>
              </div>
            </div>
          </div>
        </div>
        <div className="report-bottom">
          {/* Vaccine Usage */}

          <div className="report-section">
            <div className="report-section-header">
              <div>
                <h2>Vaccine Usage</h2>
                <p>Doses administered by vaccine.</p>
              </div>
            </div>

            <div className="report-usage-list">
              {report?.vaccine_usage?.length > 0 ? (
                report.vaccine_usage.map((item) => (
                  <div className="report-usage-item" key={item.vaccine_name}>
                    <span>{item.vaccine_name}</span>

                    <strong>{item.dose_count} doses</strong>
                  </div>
                ))
              ) : (
                <div className="report-usage-item">
                  <span>No vaccine usage recorded</span>
                  <strong>0 doses</strong>
                </div>
              )}
            </div>
          </div>

          {/* Appointment Summary */}

          <div className="report-section">
            <div className="report-section-header">
              <div>
                <h2>Appointment Summary</h2>
                <p>Appointment status overview.</p>
              </div>
            </div>

            <div className="report-appointment-list">
              {["Pending", "Confirmed", "Completed", "Missed", "Cancelled"].map(
                (status) => {
                  const appointment = report?.appointment_summary?.find(
                    (item) => item.status === status,
                  );

                  return (
                    <div className="report-appointment-item" key={status}>
                      <span>{status}</span>

                      <strong>{appointment?.count ?? 0}</strong>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Report;
