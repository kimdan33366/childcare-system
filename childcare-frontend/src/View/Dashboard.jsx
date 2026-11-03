import "../css/Dashboard.css";
import Header from "../View/Header";

import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  FaChild,
  FaUserFriends,
  FaCalendarAlt,
  FaArrowRight,
  FaSyringe,
  FaChartBar,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import Sidebar from "../View/Sidebar";
import { authFetch } from "../Controller/AuthController";

/* =========================================================
   DASHBOARD COLORS
========================================================= */

const STATUS_COLORS = {
  completed: "#3186e6",
  continuing: "#22b58a",
  missed: "#f5b544",
  "not started": "#ff875f",
};

const DEFAULT_STATUS_COLORS = [
  "#3186e6",
  "#22b58a",
  "#f5b544",
  "#ff875f",
];

/* =========================================================
   HELPERS
========================================================= */

const formatDate = (dateString) => {
  if (!dateString) return "No date";

  const date = new Date(`${dateString.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getStatusColor = (name, index) => {
  const key = String(name || "").trim().toLowerCase();

  return (
    STATUS_COLORS[key] ||
    DEFAULT_STATUS_COLORS[index % DEFAULT_STATUS_COLORS.length]
  );
};

const getAppointmentChildNames = (appointment) => {
  if (
    Array.isArray(appointment.children) &&
    appointment.children.length > 0
  ) {
    return (
      appointment.children
        .map((child) => child.child_name)
        .filter(Boolean)
        .join(", ") || "No child"
    );
  }

  if (appointment.child?.child_name) {
    return appointment.child.child_name;
  }

  return "No child";
};

/* =========================================================
   CUSTOM CHART TOOLTIP
========================================================= */

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const item = payload[0];

  return (
    <div className="dashboard-chart-tooltip">
      <strong>{label || item.name}</strong>
      <span>{item.value} doses / records</span>
    </div>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

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
  const [loading, setLoading] = useState(true);

  /* =========================================================
     FETCH DASHBOARD DATA
  ========================================================= */

  useEffect(() => {
    let active = true;

    const fetchDashboardData = async () => {
      try {
        const response = await authFetch(
          "http://127.0.0.1:8000/api/dashboard"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await response.json();

        if (active) {
          setDashboardData((prev) => ({
            ...prev,
            ...data,
            status_breakdown: Array.isArray(data.status_breakdown)
              ? data.status_breakdown
              : [],
          }));
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    const fetchAppointments = async () => {
      try {
        const response = await authFetch(
          "http://127.0.0.1:8000/api/appointments"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch appointments");
        }

        const data = await response.json();

        if (active) {
          setAppointments(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching appointments:", error);

        if (active) {
          setAppointments([]);
        }
      }
    };

    const fetchMonthlyDoses = async () => {
      try {
        const response = await authFetch(
          "http://127.0.0.1:8000/api/reports"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch report data");
        }

        const data = await response.json();

        const formattedDoses = (
          Array.isArray(data.monthly_doses)
            ? data.monthly_doses
            : []
        ).map((item) => ({
          name: item.month,
          value: Number(item.dose_count || 0),
        }));

        if (active) {
          setMonthlyDoses(formattedDoses);
        }
      } catch (error) {
        console.error("Error fetching monthly doses:", error);

        if (active) {
          setMonthlyDoses([]);
        }
      }
    };

    const fetchVaccines = async () => {
      try {
        const response = await authFetch(
          "http://127.0.0.1:8000/api/vaccines"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch vaccines");
        }

        const data = await response.json();

        if (active) {
          setVaccines(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching vaccines:", error);

        if (active) {
          setVaccines([]);
        }
      }
    };

    const loadDashboard = async () => {
      await Promise.all([
        fetchDashboardData(),
        fetchAppointments(),
        fetchMonthlyDoses(),
        fetchVaccines(),
      ]);

      if (active) {
        setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  /* =========================================================
     APPOINTMENT STATISTICS
  ========================================================= */

  const pendingAppointments =
    Number(dashboardData.pending_appointments) || 0;

  const completedAppointments =
    Number(dashboardData.completed_appointments) || 0;

  const missedAppointments =
    Number(dashboardData.missed_appointments) || 0;

  const totalAppointments =
    pendingAppointments +
    completedAppointments +
    missedAppointments;

  /* =========================================================
     UPCOMING APPOINTMENTS
  ========================================================= */

  const upcomingAppointments = appointments
    .filter((appointment) => {
      const status = String(appointment.status || "").toLowerCase();

      return !["completed", "missed", "cancelled"].includes(status);
    })
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

  const statusBreakdown = (
    Array.isArray(dashboardData.status_breakdown)
      ? dashboardData.status_breakdown
      : []
  ).map((item) => ({
    name: item.name,
    value: Number(item.value) || 0,
  }));

  const totalStatusRecords = statusBreakdown.reduce(
    (total, item) => total + item.value,
    0
  );

  /* =========================================================
     MONTHLY DOSES
  ========================================================= */

  const totalMonthlyDoses = monthlyDoses.reduce(
    (total, item) => total + item.value,
    0
  );

  /* =========================================================
     LOW STOCK VACCINES
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
     RENDER
  ========================================================= */

  return (
    <div className="dashboard">
      <Sidebar />

      <main className="dashboard-content">
        

        {/* ==========================================
            DASHBOARD HEADER
        ========================================== */}

        <header className="dashboard-page-header">
          <div className="dashboard-heading">
            <div className="dashboard-heading-icon">
              <FaChartBar />
            </div>

            <div>
              <h1>Dashboard</h1>
              <p>
                Overview of your childcare immunization system
              </p>
            </div>
          </div>

          <div className="dashboard-header-date">
            <FaCalendarAlt />

            <span>
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <Header />
          </div>
        </header>

        {/* ==========================================
            SUMMARY CARDS
        ========================================== */}

        <section className="dashboard-cards">

          {/* TOTAL CHILDREN */}

          <NavLink
            to="/patients"
            className="dashboard-card"
          >
            <div className="dashboard-card-information">
              <div className="dashboard-card-icon blue">
                <FaChild />
              </div>

              <div className="dashboard-card-text">
                <span className="dashboard-card-label">
                  Total Children
                </span>

                <h2>{dashboardData.children || 0}</h2>

                <p>Registered children</p>
              </div>
            </div>

            <div className="dashboard-card-arrow">
              <FaArrowRight />
            </div>
          </NavLink>

          {/* APPOINTMENTS */}

          <NavLink
            to="/appointments"
            className="dashboard-card dashboard-appointment-card"
          >
            <div className="dashboard-card-information">
              <div className="dashboard-card-icon purple">
                <FaCalendarAlt />
              </div>

              <div className="dashboard-card-text">
                <span className="dashboard-card-label">
                  Appointments
                </span>

                <h2>{totalAppointments}</h2>

                <p>Pending, completed and missed</p>
              </div>
            </div>

            <div className="dashboard-appointment-summary">
              <div className="dashboard-appointment-summary-item">
                <span className="dashboard-mini-dot pending" />
                <strong>{pendingAppointments}</strong>
                <span>Pending</span>
              </div>

              <div className="dashboard-appointment-summary-item">
                <span className="dashboard-mini-dot completed" />
                <strong>{completedAppointments}</strong>
                <span>Completed</span>
              </div>

              <div className="dashboard-appointment-summary-item">
                <span className="dashboard-mini-dot missed" />
                <strong>{missedAppointments}</strong>
                <span>Missed</span>
              </div>
            </div>
          </NavLink>

          {/* ACTIVE USERS */}

          <NavLink
            to="/user-management"
            className="dashboard-card"
          >
            <div className="dashboard-card-information">
              <div className="dashboard-card-icon amber">
                <FaUserFriends />
              </div>

              <div className="dashboard-card-text">
                <span className="dashboard-card-label">
                  Active Users
                </span>

                <h2>{dashboardData.active_user || 0}</h2>

                <p>Active parent accounts</p>
              </div>
            </div>

            <div className="dashboard-card-arrow">
              <FaArrowRight />
            </div>
          </NavLink>

        </section>

        {/* ==========================================
            CHARTS
        ========================================== */}

        <section className="dashboard-chart-row">

          {/* MONTHLY DOSES */}

          <div className="dashboard-chart-card dashboard-monthly-chart">

            <div className="dashboard-section-heading">
              <div>
                <h3>Monthly Vaccination Activity</h3>
                <p>Vaccination doses recorded by month</p>
              </div>

              <div className="dashboard-section-icon">
                <FaSyringe />
              </div>
            </div>

            <div className="dashboard-chart-container">
              {monthlyDoses.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyDoses}
                    margin={{
                      top: 15,
                      right: 12,
                      left: -20,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#edf1f7"
                    />

                    <XAxis
                      dataKey="name"
                      tick={{
                        fill: "#71839b",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      allowDecimals={false}
                      tick={{
                        fill: "#71839b",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{
                        fill: "rgba(49, 134, 230, 0.06)",
                      }}
                    />

                    <Bar
                      dataKey="value"
                      fill="#3186e6"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={38}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="dashboard-chart-empty">
                  <FaChartBar />
                  <span>No monthly vaccination data available.</span>
                </div>
              )}
            </div>

            <div className="dashboard-chart-footer">
              <span className="dashboard-chart-legend-dot" />

              <span>Vaccination doses</span>

              <strong>
                {totalMonthlyDoses} total
              </strong>
            </div>

          </div>

          {/* STATUS BREAKDOWN */}

          <div className="dashboard-chart-card dashboard-status-chart">

            <div className="dashboard-section-heading">
              <div>
                <h3>Immunization Status</h3>
                <p>Current vaccination status breakdown</p>
              </div>

              <div className="dashboard-section-icon">
                <FaCheckCircle />
              </div>
            </div>

            <div className="dashboard-status-content">

              <div className="dashboard-donut-wrapper">
                {totalStatusRecords > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusBreakdown}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius="65%"
                          outerRadius="85%"
                          paddingAngle={2}
                          stroke="none"
                        >
                          {statusBreakdown.map((entry, index) => (
                            <Cell
                              key={`${entry.name}-${index}`}
                              fill={getStatusColor(entry.name, index)}
                            />
                          ))}
                        </Pie>

                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="dashboard-donut-center">
                      <strong>{totalStatusRecords}</strong>
                      <span>Records</span>
                    </div>
                  </>
                ) : (
                  <div className="dashboard-chart-empty">
                    <span>No status data</span>
                  </div>
                )}
              </div>

              <div className="dashboard-status-legend">
                {statusBreakdown.map((item, index) => {
                  const percentage =
                    totalStatusRecords > 0
                      ? Math.round(
                          (item.value / totalStatusRecords) * 100
                        )
                      : 0;

                  return (
                    <div
                      className="dashboard-status-legend-item"
                      key={`${item.name}-${index}`}
                    >
                      <div className="dashboard-status-name">
                        <span
                          className="dashboard-status-dot"
                          style={{
                            backgroundColor: getStatusColor(
                              item.name,
                              index
                            ),
                          }}
                        />

                        <span>{item.name}</span>
                      </div>

                      <strong>{percentage}%</strong>
                    </div>
                  );
                })}

                {statusBreakdown.length === 0 && (
                  <p className="dashboard-legend-empty">
                    No status records available.
                  </p>
                )}
              </div>

            </div>

          </div>

        </section>

        {/* ==========================================
            BOTTOM SECTION
        ========================================== */}

        <section className="dashboard-bottom-row">

          {/* UPCOMING APPOINTMENTS */}

          <div className="dashboard-appointments">

            <div className="dashboard-table-heading">
              <div className="dashboard-table-heading-left">
                <div className="dashboard-table-icon blue">
                  <FaClock />
                </div>

                <div>
                  <h3>Upcoming Appointments</h3>
                  <p>Scheduled immunization visits</p>
                </div>
              </div>

              <NavLink to="/appointments">
                View All <FaArrowRight />
              </NavLink>
            </div>

            <div className="dashboard-table-scroll">
              <div className="dashboard-appointment-row dashboard-table-header">
                <span>Child Name</span>
                <span>Date</span>
                <span>Status</span>
              </div>

              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((item) => {
                  const status = item.status || "Pending";

                  return (
                    <div
                      className="dashboard-appointment-row"
                      key={item.appointment_id}
                    >
                      <span
                        className="dashboard-table-name"
                        title={getAppointmentChildNames(item)}
                      >
                        {getAppointmentChildNames(item)}
                      </span>

                      <span>
                        {formatDate(item.appointment_date)}
                      </span>

                      <span
                        className={`dashboard-appointment-status ${status.toLowerCase()}`}
                      >
                        {status}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="dashboard-empty-state">
                  <FaCalendarAlt />
                  <p>
                    {loading
                      ? "Loading appointments..."
                      : "No upcoming appointments."}
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* VACCINE INVENTORY */}

          <div className="dashboard-inventory">

            <div className="dashboard-table-heading">
              <div className="dashboard-table-heading-left">
                <div className="dashboard-table-icon teal">
                  <FaSyringe />
                </div>

                <div>
                  <h3>Vaccine Inventory</h3>
                  <p>Vaccines requiring attention</p>
                </div>
              </div>

              <NavLink to="/vaccines">
                View All <FaArrowRight />
              </NavLink>
            </div>

            <div className="dashboard-table-scroll">
              <div className="dashboard-inventory-item dashboard-table-header">
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
                      <span
                        className="dashboard-table-name"
                        title={
                          vaccine.vaccine_name ||
                          vaccine.name ||
                          "Unknown Vaccine"
                        }
                      >
                        {vaccine.vaccine_name ||
                          vaccine.name ||
                          "Unknown Vaccine"}
                      </span>

                      <span className="inventory-quantity">
                        {stock}
                      </span>

                      <span
                        className={`inventory-status ${status
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {status === "Out of Stock" && (
                          <FaExclamationCircle />
                        )}

                        {status}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="dashboard-empty-state">
                  <FaCheckCircle />

                  <p>
                    {loading
                      ? "Loading vaccine inventory..."
                      : "No low-stock vaccines."}
                  </p>
                </div>
              )}
            </div>

          </div>

        </section>

      </main>
    </div>
  );
}

export default Dashboard;