import "../css/Dashboard.css";

import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  FaChild,
  FaExclamationTriangle,
  FaUserFriends,
  FaShieldAlt,
  FaCalendarCheck,
  FaBell,
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

import { dashboardStats, COLORS } from "../Model/DashboardModel";

function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    users: 0,
    children: 0,
    active_user: 0,
    doses_given: 0,
    pending_appointments: 0,
    completed_appointments: 0,
    missed_appointments: 0,
  });
  const [appointments, setAppointments] = useState([]);
  const [monthlyDoses, setMonthlyDoses] = useState([]);
  const [children, setChildren] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/dashboard")
      .then((response) => response.json())
      .then((data) => {
        setDashboardData(data);
      })
      .catch((error) => {
        console.error("Error fetching dashboard data:", error);
      });

    fetch("http://127.0.0.1:8000/api/appointments")
      .then((response) => response.json())
      .then((data) => {
        setAppointments(data);
      })
      .catch((error) => {
        console.error("Error fetching appointments:", error);
      });

    fetch("http://127.0.0.1:8000/api/reports")
      .then((response) => response.json())
      .then((data) => {
        const formattedDoses = (data.monthly_doses || []).map((item) => ({
          name: item.month,
          value: Number(item.dose_count),
        }));

        setMonthlyDoses(formattedDoses);
      })
      .catch((error) => {
        console.error("Error fetching monthly doses:", error);
      });

    fetch("http://127.0.0.1:8000/api/children")
      .then((response) => response.json())
      .then((data) => {
        setChildren(data);
      })
      .catch((error) => {
        console.error("Error fetching children:", error);
      });

    fetch("http://127.0.0.1:8000/api/vaccines")
      .then((response) => response.json())
      .then((data) => {
        setVaccines(data);
      })
      .catch((error) => {
        console.error("Error fetching vaccines:", error);
      });
  }, []);

  return (
    <div className="dashboard">
      <Sidebar />

      <main className="dashboard-content">
        <div className="dashboard-cards">
          <NavLink to="/patients" className="dashboard-card">
            <div className="dashboard-card-top">
              <FaChild className="dashboard-card-icon" />
            </div>
            <small>Total Children</small>
            <h2>{dashboardData.children}</h2>
          </NavLink>

          <NavLink
            to="/appointments"
            className="dashboard-card dashboard-appointment-card"
          >
            <div className="dashboard-card-top">
              <span className="dashboard-card-icon">📅</span>
            </div>

            <small>Appointments</small>

            <div className="dashboard-appointment-summary">
              <div className="dashboard-appointment-summary-item">
                <strong>{dashboardData.pending_appointments}</strong>
                <span>Pending</span>
              </div>

              <div className="dashboard-appointment-summary-item">
                <strong>{dashboardData.completed_appointments}</strong>
                <span>Completed</span>
              </div>

              <div className="dashboard-appointment-summary-item">
                <strong>{dashboardData.missed_appointments}</strong>
                <span>Missed</span>
              </div>
            </div>
          </NavLink>

          <NavLink to="/user-management" className="dashboard-card">
            <div className="dashboard-card-top">
              <FaUserFriends className="dashboard-card-icon due" />
            </div>
            <small>Active User</small>
            <h2>{dashboardData.active_user}</h2>
          </NavLink>

          <NavLink to="/report" className="dashboard-card">
            <div className="dashboard-card-top">
              <FaShieldAlt className="dashboard-card-icon vaccine" />
            </div>
            <small>Doses Given</small>
            <h2>{dashboardData.doses_given}</h2>
          </NavLink>
        </div>

        <div className="dashboard-chart-row">
          <div className="dashboard-chart-card">
            <h4>Monthly Doses</h4>

            <ResponsiveContainer width="100%" height="100%">
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
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
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

          <div className="dashboard-chart-card">
            <h4>Status Breakdown</h4>

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={
                    dashboardData.status_breakdown || [
                      { name: "No Data", value: 0 },
                    ]
                  }
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="42%"
                  innerRadius={35}
                  outerRadius={60}
                  paddingAngle={3}
                  label={false}
                >
                  {(dashboardData.status_breakdown || []).map(
                    (entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ),
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

        <div className="dashboard-bottom-row">
          <div className="dashboard-appointments">
            <div className="dashboard-appointment-header">
              <h3>Upcoming Appointments</h3>

              <NavLink to="/appointments">View All</NavLink>
            </div>

            <div className="dashboard-appointments-list">
              <div className="dashboard-appointment-row dashboard-appointment-header-row">
                <span>Name</span>
                <span>Date</span>
                <span>Status</span>
              </div>

              {appointments.slice(0, 3).map((item) => (
                <div
                  className="dashboard-appointment-row"
                  key={item.appointment_id}
                >
                  <span>
                    {children.find((child) => child.child_id === item.child_id)
                      ?.child_name || "Unknown Child"}
                  </span>

                  <span>{item.appointment_date}</span>

                  <span
                    className={`appointment-status ${item.status?.toLowerCase()}`}
                  >
                    {item.status || "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-inventory">
            <div className="dashboard-inventory-header">
              <h3>Vaccine Inventory</h3>

              <NavLink to="/vaccines">View All</NavLink>
            </div>

            <div className="dashboard-inventory-list">
              <div className="dashboard-inventory-item dashboard-inventory-header-row">
                <span>Vaccine</span>
                <span>Remaining</span>
                <span>Status</span>
              </div>
              {vaccines
                .filter((vaccine) => Number(vaccine.stock_quantity) <= 10)
                .slice(0, 5)
                .map((vaccine) => {
                  const stock = Number(vaccine.stock_quantity || 0);

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
                      <span>{vaccine.vaccine_name}</span>

                      <span>{stock}</span>

                      <span
                        className={`inventory-status ${status
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {status}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
export default Dashboard;
