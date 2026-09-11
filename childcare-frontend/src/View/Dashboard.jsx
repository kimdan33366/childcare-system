import "../css/Dashboard.css";

import { NavLink } from "react-router-dom";
import { useEffect,useState } from "react";


import {
  FaChild,
  FaExclamationTriangle,
  FaClock,
  FaShieldAlt,
  FaCalendarCheck,
 
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

import {

  dashboardStats,
  COLORS,
} from "../Model/DashboardModel";

function Dashboard() {
  
  const [dashboardData, setDashboardData] = useState({
  users: 0,
  children: 0,
  overdue: 0,
  due_soon: 0,
  doses_given: 0,
});
const [appointments, setAppointments] = useState([]);
const [monthlyDoses, setMonthlyDoses] = useState([]);
const [children, setChildren] = useState([]);
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

}, []);


  return (
    <div className="dashboard">

      <Sidebar />

      <main className="dashboard-content">

        <div className="dashboard-cards">

  <div className="dashboard-card">
    <div className="dashboard-card-top">
      <FaChild className="dashboard-card-icon" />
    </div>
    <small>Total Children</small>
    <h2>{dashboardData.children}</h2>
  </div>

  <div className="dashboard-card">
    <div className="dashboard-card-top">
      <FaExclamationTriangle className="dashboard-card-icon overdue" />
    </div>
    <small>Overdue</small>
    <h2>{dashboardData.overdue}</h2>
  </div>

  <div className="dashboard-card">
    <div className="dashboard-card-top">
      <FaClock className="dashboard-card-icon due" />
    </div>
    <small>Due Soon</small>
    <h2>{dashboardData.due_soon}</h2>
  </div>

  <div className="dashboard-card">
    <div className="dashboard-card-top">
      <FaShieldAlt className="dashboard-card-icon vaccine" />
    </div>
    <small>Doses Given</small>
    <h2>{dashboardData.doses_given}</h2>
  </div>

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

                  {(monthlyDoses.length > 0 ? monthlyDoses : [{ name: "No Data", value: 0 }]).map((entry, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
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

          <div className="dashboard-chart-card">

            <h4>Status Breakdown</h4>

            <ResponsiveContainer width="100%" height="100%">

              <PieChart>

                <Pie
                  data={dashboardData.status_breakdown || [{ name: "No Data", value: 0 }]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="42%"
                  innerRadius={35}
                  outerRadius={60}
                  paddingAngle={3}
                  label={false}
                >

                  {(dashboardData.status_breakdown || []).map((entry, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
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
                    lineHeight: "20px",
                  }}
                />

              </PieChart>

            </ResponsiveContainer>

          </div>

        </div>

        <div className="dashboard-appointments">

          <div className="dashboard-appointment-header">

            <h3>
              Upcoming Appointments
            </h3>

            <NavLink to="/appointments">
              View All
            </NavLink>

          </div>

          <div className="dashboard-appointments-list">

            {appointments.slice(0, 2).map((item) => (

              <div
                className="dashboard-appointment"
                key={item.appointment_id}
              >

                <FaCalendarCheck className="dashboard-appointment-icon" />

                <div>

                  <h4>

                    {children.find((child) => child.child_id === item.child_id)?.child_name || "Unknown Child"}
                  </h4>

                  <p>{item.appointment_date}</p>

                  

                </div>

              </div>

            ))}

          </div>

        </div>

      </main>

    </div>
   
  );
   
}
export default Dashboard;
