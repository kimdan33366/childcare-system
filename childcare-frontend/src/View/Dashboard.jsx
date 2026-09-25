import "../css/Dashboard.css";

import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  FaChild,
  FaUserFriends,
  FaShieldAlt,
} from "react-icons/fa";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import Sidebar from "../View/Sidebar";

import { COLORS } from "../Model/DashboardModel";

function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    users: 0,
    children: 0,
    active_user: 0,
    doses_given: 0,
    pending_appointments: 0,
    completed_appointments: 0,
    missed_appointments: 0,
    status_breakdown: [],
  });

  const [appointments, setAppointments] = useState([]);
  const [monthlyDoses, setMonthlyDoses] = useState([]);
  const [vaccines, setVaccines] = useState([]);

  /* =========================================================
     FETCH DASHBOARD DATA
  ========================================================= */

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/dashboard"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await response.json();

        setDashboardData((prev) => ({
          ...prev,
          ...data,
          status_breakdown: Array.isArray(data.status_breakdown)
            ? data.status_breakdown
            : [],
        }));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    const fetchAppointments = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/appointments"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch appointments");
        }

        const data = await response.json();

        setAppointments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        setAppointments([]);
      }
    };

    const fetchMonthlyDoses = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/reports"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch report data");
        }

        const data = await response.json();

        const formattedDoses = (data.monthly_doses || []).map(
          (item) => ({
            name: item.month,
            value: Number(item.dose_count || 0),
          })
        );

        setMonthlyDoses(formattedDoses);
      } catch (error) {
        console.error("Error fetching monthly doses:", error);
        setMonthlyDoses([]);
      }
    };

    const fetchVaccines = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/vaccines"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch vaccines");
        }

        const data = await response.json();

        setVaccines(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching vaccines:", error);
        setVaccines([]);
      }
    };

    fetchDashboardData();
    fetchAppointments();
    fetchMonthlyDoses();
    fetchVaccines();
  }, []);

  /* =========================================================
     UPCOMING APPOINTMENTS
  ========================================================= */

  const upcomingAppointments = appointments
    .filter(
      (appointment) =>
        appointment.status !== "Completed" &&
        appointment.status !== "Missed" &&
        appointment.status !== "Cancelled"
    )
    .sort((a, b) => {
      const dateA = `${a.appointment_date || ""} ${
        a.appointment_time || ""
      }`;

      const dateB = `${b.appointment_date || ""} ${
        b.appointment_time || ""
      }`;

      return dateA.localeCompare(dateB);
    })
    .slice(0, 3);

  /* =========================================================
     STATUS BREAKDOWN
  ========================================================= */

  const statusBreakdown =
    dashboardData.status_breakdown &&
    dashboardData.status_breakdown.length > 0
      ? dashboardData.status_breakdown
      : [{ name: "No Data", value: 0 }];

  /* =========================================================
     LOW VACCINE STOCK
  ========================================================= */

  const lowStockVaccines = vaccines
    .map((vaccine) => {
      const stock = Number(
        vaccine.stock ??
          vaccine.stock_quantity ??
          vaccine.quantity ??
          0
      );

      return {
        ...vaccine,
        currentStock: stock,
      };
    })
    .filter((vaccine) => vaccine.currentStock <= 10)
    .slice(0, 5);

  /* =========================================================
     APPOINTMENT CHILD NAME
  ========================================================= */

  const getAppointmentChildNames = (appointment) => {
    if (
      Array.isArray(appointment.children) &&
      appointment.children.length > 0
    ) {
      return appointment.children
        .map((child) => child.child_name)
        .filter(Boolean)
        .join(", ");
    }

    if (appointment.child?.child_name) {
      return appointment.child.child_name;
    }

    return "No child";
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="dashboard">

      <Sidebar />

      <main className="dashboard-content">

        {/* =====================================================
            DASHBOARD SUMMARY CARDS
        ===================================================== */}

        <div className="dashboard-cards">

          <NavLink
            to="/patients"
            className="dashboard-card"
          >
            <div className="dashboard-card-top">
              <FaChild className="dashboard-card-icon" />
            </div>

            <small>Total Children</small>

            <h2>{dashboardData.children || 0}</h2>
          </NavLink>


          <NavLink
            to="/appointments"
            className="dashboard-card dashboard-appointment-card"
          >
            <div className="dashboard-card-top">
              <span className="dashboard-card-icon">
                📅
              </span>
            </div>

            <small>Appointments</small>

            <div className="dashboard-appointment-summary">

              <div className="dashboard-appointment-summary-item">
                <strong>
                  {dashboardData.pending_appointments || 0}
                </strong>

                <span>Pending</span>
              </div>

              <div className="dashboard-appointment-summary-item">
                <strong>
                  {dashboardData.completed_appointments || 0}
                </strong>

                <span>Completed</span>
              </div>

              <div className="dashboard-appointment-summary-item">
                <strong>
                  {dashboardData.missed_appointments || 0}
                </strong>

                <span>Missed</span>
              </div>

            </div>
          </NavLink>


          <NavLink
            to="/user-management"
            className="dashboard-card"
          >
            <div className="dashboard-card-top">
              <FaUserFriends className="dashboard-card-icon due" />
            </div>

            <small>Active Users</small>

            <h2>{dashboardData.active_user || 0}</h2>
          </NavLink>


          <NavLink
            to="/report"
            className="dashboard-card"
          >
            <div className="dashboard-card-top">
              <FaShieldAlt className="dashboard-card-icon vaccine" />
            </div>

            <small>Doses Given</small>

            <h2>{dashboardData.doses_given || 0}</h2>
          </NavLink>

        </div>


        {/* =====================================================
            CHARTS
        ===================================================== */}

        <div className="dashboard-chart-row">

          {/* MONTHLY DOSES */}

          <div className="dashboard-chart-card">

            <h4>Monthly Doses</h4>

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>

                <Pie
                  data={
                    monthlyDoses.length > 0
                      ? monthlyDoses
                      : [{ name: "No Data", value: 0 }]
                  }
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="42%"
                  outerRadius={60}
                  paddingAngle={3}
                  label={false}
                >

                  {(monthlyDoses.length > 0
                    ? monthlyDoses
                    : [{ name: "No Data", value: 0 }]
                  ).map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={
                        COLORS[index % COLORS.length]
                      }
                    />
                  ))}

                </Pie>

                <Tooltip />

                <Legend
                  verticalAlign="bottom"
                  align="center"
                  layout="horizontal"
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: "12px",
                    paddingTop: "10px",
                  }}
                />

              </PieChart>
            </ResponsiveContainer>

          </div>


          {/* STATUS BREAKDOWN */}

          <div className="dashboard-chart-card">

            <h4>Status Breakdown</h4>

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>

                <Pie
                  data={statusBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="42%"
                  innerRadius={35}
                  outerRadius={60}
                  paddingAngle={3}
                  label={false}
                >

                  {statusBreakdown.map(
                    (entry, index) => (
                      <Cell
                        key={`${entry.name}-${index}`}
                        fill={
                          COLORS[index % COLORS.length]
                        }
                      />
                    )
                  )}

                </Pie>

                <Tooltip />

                <Legend
                  verticalAlign="bottom"
                  align="center"
                  layout="horizontal"
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: "12px",
                    paddingTop: "10px",
                    lineHeight: "20px",
                  }}
                />

              </PieChart>
            </ResponsiveContainer>

          </div>

        </div>


        {/* =====================================================
            BOTTOM SECTION
        ===================================================== */}

        <div className="dashboard-bottom-row">

          {/* ===================================================
              UPCOMING APPOINTMENTS
          =================================================== */}

          <div className="dashboard-appointments">

            <div className="dashboard-appointment-header">

              <h3>Upcoming Appointments</h3>

              <NavLink to="/appointments">
                View All
              </NavLink>

            </div>


            <div className="dashboard-appointments-list">

              <div className="dashboard-appointment-row dashboard-appointment-header-row">
                <span>Name</span>
                <span>Date</span>
                <span>Status</span>
              </div>


              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((item) => (

                  <div
                    className="dashboard-appointment-row"
                    key={item.appointment_id}
                  >

                    <span>
                      {getAppointmentChildNames(item)}
                    </span>

                    <span>
                      {item.appointment_date || "No date"}
                    </span>

                    <span
                      className={`appointment-status ${
                        item.status
                          ? item.status.toLowerCase()
                          : "pending"
                      }`}
                    >
                      {item.status || "Pending"}
                    </span>

                  </div>

                ))
              ) : (

                <div className="dashboard-empty-state">
                  No upcoming appointments.
                </div>

              )}

            </div>

          </div>


          {/* ===================================================
              VACCINE INVENTORY
          =================================================== */}

          <div className="dashboard-inventory">

            <div className="dashboard-inventory-header">

              <h3>Vaccine Inventory</h3>

              <NavLink to="/vaccines">
                View All
              </NavLink>

            </div>


            <div className="dashboard-inventory-list">

              <div className="dashboard-inventory-item dashboard-inventory-header-row">
                <span>Vaccine</span>
                <span>Remaining</span>
                <span>Status</span>
              </div>


              {lowStockVaccines.length > 0 ? (
                lowStockVaccines.map((vaccine) => {

                  const stock = vaccine.currentStock;

                  let status = "Available";

                  if (stock === 0) {
                    status = "Out of Stock";
                  } else if (stock <= 10) {
                    status = "Low";
                  }

                  return (

                    <div
                      className="dashboard-inventory-item"
                      key={vaccine.vaccine_ID}
                    >

                      <span>
                        {vaccine.vaccine_name ||
                          vaccine.name ||
                          "Unknown Vaccine"}
                      </span>

                      <span>
                        {stock}
                      </span>

                      <span
                        className={`inventory-status ${status
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {status}
                      </span>

                    </div>

                  );
                })
              ) : (

                <div className="dashboard-empty-state">
                  No low-stock vaccines.
                </div>

              )}

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

export default Dashboard;