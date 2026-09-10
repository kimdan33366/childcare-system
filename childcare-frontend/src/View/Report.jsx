
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
    0
  );

  const graphMax = Math.ceil(maxDose / 10) * 10 || 10;

  return (

    <div className="report-dashboard">

      <Sidebar />

      <main className="report-content">

        <div className="report-topbar">
          <h1>Reports</h1>
        </div>

        <div className="report-cards">

          {reportCards.map((card, index) => (

            <div
              className="report-card"
              key={index}
            >

              <h2>
                {index === 0 && report
                  ? `${report.overall_coverage}%`
                  : index === 1 && report
                  ? report.complete_series
                  : index === 2 && report
                  ? report.total_dose_q2
                  : "..."}
              </h2>

              <h3>
                {card.title}
              </h3>

              <p>
                {card.description}
              </p>

            </div>

          ))}

        </div>

        <div className="report-chart-container">

          <h2>
            Doses Administered 2026
          </h2>

          <div className="report-chart">

            <div className="report-y-axis">

              {Array.from({ length: 6 }, (_, index) => (

                <span key={index}>
                  {Math.round(
                    graphMax -
                    (graphMax / 5) * index
                  )}
                </span>

              ))}

            </div>

            <div className="report-bars">

              {monthlyDoses.map((item) => (

                <div
                  className="report-bar-group"
                  key={item.id}
                >

                  <div
                    className="report-bar"
                    style={{
                      height:
                        `${(Number(item.dose_count) / graphMax) * 100}%`,
                    }}
                  />

                  <span>
                    {item.month}
                  </span>

                </div>

              ))}

            </div>

          </div>

        </div>

      </main>

    </div>

  );
}

export default Report;

