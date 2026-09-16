import { useState,useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../Controller/AuthController";

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
  FaChevronDown,
  FaChevronUp,
  FaInfoCircle,
  FaLock,
  FaQuestionCircle,
  FaUser,
  FaCog,
} from "react-icons/fa";

function Sidebar() {
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/Admin")
    .then((response) => response.json())
    .then((data) => {
      setCurrentUser(data);
    })
  }, []);

  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = () => {
    alert("Logged out!");
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="logo-section">

        <div className="logo-container">
          <img
            src={logo1}
            alt="ChildCare Logo"
            className="logo"
          />
        </div>

        <h2>ChildCare</h2>

      </div>
      <nav>

        <NavLink to="/dashboard">
          <FaThLarge />
          Dashboard
        </NavLink>

        <NavLink to="/patients">
          <FaUserFriends />
          Patients
        </NavLink>

        <NavLink to="/appointments">
          <FaCalendarAlt />
          Appointments
        </NavLink>

        <NavLink to="/vaccines">
          <FaSyringe />
          Vaccines
        </NavLink>

        <NavLink to="/report">
          <FaChartBar />
          Reports
        </NavLink>

        <NavLink to="/notification">
          <FaBell />
          Notifications
        </NavLink>
        <div className="settings-menu">

          <div
            className="settings-btn"
            onClick={() => setShowSettings(!showSettings)}
          >

            <div className="settings-left">
              <FaCog />
              <span>Settings</span>
            </div>

            {showSettings ? (
              <FaChevronUp />
            ) : (
              <FaChevronDown />
            )}

          </div>

          {showSettings && (
            <div className="settings-dropdown">

              <NavLink to="/profile">
                <FaUser />
                Profile
              </NavLink>

              <NavLink to="/about">
                <FaInfoCircle />
                About
              </NavLink>

              <NavLink to="/privacy">
                <FaLock />
                Privacy & Security
              </NavLink>

              <NavLink to="/help">
                <FaQuestionCircle />
                Help
              </NavLink>

              <NavLink to="/user-management">
                <FaSignOutAlt/>
                User management
              </NavLink>

            </div>
          )}

        </div>

      </nav>
<div className="bottom-menu">

  {/* Administrator */}
  <div className="administrator">
    <FaUserCircle className="administrator-icon" />

    <div className="administrator-info">
      <h3>{currentUser?.Admin_name || "Administrator"}</h3>
      <p>{currentUser?.Admin_role || "Admin"}</p>
    </div>
  </div>

  <button onClick={handleLogout}>
    <FaSignOutAlt />
    <span>Logout</span>
  </button>

</div>

    </aside>
  );
}

export default Sidebar;