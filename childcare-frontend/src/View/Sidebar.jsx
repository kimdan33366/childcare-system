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
  FaQuestionCircle,
} from "react-icons/fa";

function Sidebar() {
  const navigate = useNavigate();

  // Get current logged-in user
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  // Check if the logged-in user is Admin
  const isAdmin = currentUser?.user_type === "Admin";

  const handleLogout = () => {
    alert("Logged out!");
    navigate("/login");
  };

  return (
    <aside className="sidebar">

      {/* Logo */}
      <div className="logo-section">
        <div className="logo-container">
          <img
            src={logo1}
            alt="ChildCare Logo"
            className="logo"
          />
        </div>

        <h2>ChildCare</h2>

        <span className="sidebar-subtitle">
          Management System
        </span>
      </div>


      {/* Navigation */}
      <nav>

        {/* MAIN */}
        <div className="nav-section">
          <span className="nav-section-title">
            MAIN
          </span>

          <NavLink to="/dashboard">
            <FaThLarge />
            Dashboard
          </NavLink>
        </div>


        {/* PATIENT CARE */}
        <div className="nav-section">
          <span className="nav-section-title">
            CHILD CARE
          </span>

          <NavLink to="/patients">
            <FaUserFriends />
            Children
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
          <span className="nav-section-title">
            ADMINISTRATION
          </span>

          {/* Admin only */}
          
            <NavLink to="/user-management">
              <FaUser />
              Users
            </NavLink>
          

          {/* Admin only */}
          {isAdmin && (
            <NavLink to="/role-base-access">
              <FaUser />
              Staff & Permissions
            </NavLink>
          )}

          {/* Everyone */}
          <NavLink to="/report">
            <FaChartBar />
            Reports
          </NavLink>

          <NavLink to="/notification">
            <FaBell />
            Notifications
          </NavLink>
        </div>

      </nav>


      {/* Bottom Menu */}
      <div className="bottom-menu">

        <NavLink to="/profile">
          <FaUserCircle />
          Profile
        </NavLink>

        <NavLink to="/help">
          <FaQuestionCircle />
          Help & Feedback
        </NavLink>

        <button onClick={handleLogout}>
          <FaSignOutAlt />
          <span>Logout</span>
        </button>

      </div>

    </aside>
  );
}

export default Sidebar;