import { NavLink, useNavigate } from "react-router-dom";

import logo1 from "../images/logo1.png";
import "../css/Sidebar.css";

import {
  FaThLarge,
  FaUserFriends,
  FaCalendarAlt,
  FaSyringe,
  FaChartBar,
  FaBell,
  FaSignOutAlt,
  FaUserCircle,
  FaUser,
} from "react-icons/fa";

import { logoutUser } from "../Controller/AuthController";

function Sidebar() {
  const navigate = useNavigate();

  // Get current logged-in user safely
  const storedUser = localStorage.getItem("currentUser");

  let currentUser = null;

  try {
    currentUser = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Unable to read logged-in user:", error);
  }

  // Check if the logged-in user is Admin
  const isAdmin = currentUser?.user_type === "Admin";

  const handleLogout = () => {
    // Clear the user information and Sanctum token
    logoutUser();

    // Return to the login page
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="logo-section">
        <div className="logo-container">
          <img src={logo1} alt="ChildCare Logo" className="logo" />
        </div>

        <h2>ChildCare</h2>

        <span className="sidebar-subtitle">Management System</span>
      </div>

      {/* Navigation */}
      <nav>
        {/* MAIN */}
        <div className="nav-section">
          <span className="nav-section-title">MAIN</span>

          <NavLink to="/dashboard">
            <FaThLarge />
            Dashboard
          </NavLink>
        </div>

        {/* CHILD CARE */}
        <div className="nav-section">
          <span className="nav-section-title">CHILD CARE</span>

          <NavLink to="/user-management">
            <FaUser />
            Users
          </NavLink>

          <NavLink to="/appointments">
            <FaCalendarAlt />
            Appointments
          </NavLink>

          <NavLink to="/vaccines">
            <FaSyringe />
            Vaccines
          </NavLink>
        </div>

        {/* ADMINISTRATION */}
        <div className="nav-section">
          <span className="nav-section-title">ADMINISTRATION</span>

          <NavLink to="/patients">
            <FaUserFriends />
            Children
          </NavLink>

          {isAdmin && (
            <NavLink to="/role-base-access">
              <FaUser />
              Roles & Permissions
            </NavLink>
          )}

          <NavLink to="/report">
            <FaChartBar />
            Reports
          </NavLink>

          <NavLink to="/notification">
            <FaBell />
            Send Reminder
          </NavLink>
        </div>
      </nav>

      {/* Bottom Menu */}
      <div className="bottom-menu">
        <NavLink to="/profile">
          <FaUserCircle />
          Profile
        </NavLink>

        <button type="button" onClick={handleLogout}>
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
