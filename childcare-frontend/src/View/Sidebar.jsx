import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo1 from "../images/logo1.png";
import "../css/Sidebar.css";
import {
  FaThLarge, FaUserFriends, FaCalendarAlt, FaSyringe,
  FaChartBar, FaBell, FaSignOutAlt, FaUserCircle,
  FaUser, FaShieldAlt, FaTimes, FaLayerGroup
} from "react-icons/fa";
import { logoutUser } from "../Controller/AuthController";

function Sidebar() {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const cancelButtonRef = useRef(null);

  let currentUser = null;
  try {
    const storedUser = localStorage.getItem("currentUser");
    currentUser = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Unable to read logged-in user:", error);
  }
  const isAdmin = currentUser?.user_type === "Admin";

  useEffect(() => {
    if (!showLogoutConfirm) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") setShowLogoutConfirm(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showLogoutConfirm]);

  const handleConfirmLogout = () => {
    logoutUser();
    setShowLogoutConfirm(false);
    navigate("/login", { replace: true });
  };

  return (
    <>
      <aside className="sidebar">
        <div className="logo-section">
          <div className="sidebar-brand-row">
            <img src={logo1} alt="ChildCare Logo" className="logo" />
            <div className="sidebar-brand-text">
              <h2>ChildCare</h2>
              <span className="sidebar-subtitle">IMMUNIZATION SYSTEM</span>
            </div>
          </div>
        </div>

        <nav aria-label="Main navigation">
          <div className="nav-section">
            <span className="nav-section-title">MAIN</span>
            <NavLink to="/dashboard"><FaThLarge /><span>Dashboard</span></NavLink>
          </div>
          <div className="nav-section">
            <span className="nav-section-title">CHILD CARE</span>
            <NavLink to="/user-management"><FaUser /><span>Users</span></NavLink>
            <NavLink to="/appointments"><FaCalendarAlt /><span>Appointments</span></NavLink>
            <NavLink to="/vaccines"><FaSyringe /><span>Vaccines</span></NavLink>
          </div>
          <div className="nav-section">
            <span className="nav-section-title">ADMINISTRATION</span>
            <NavLink to="/patients"><FaUserFriends /><span>Children</span></NavLink>
            {isAdmin && (
              <NavLink to="/role-base-access"><FaLayerGroup /><span>Roles &amp; Permissions</span></NavLink>
            )}
            <NavLink to="/report"><FaChartBar /><span>Reports</span></NavLink>
            <NavLink to="/notification"><FaBell /><span>Send Reminder</span></NavLink>
          </div>
        </nav>

        <div className="bottom-menu">
          <NavLink to="/profile"><FaUserCircle /><span>My Profile</span></NavLink>
          <button type="button" className="sidebar-logout" onClick={() => setShowLogoutConfirm(true)}>
            <FaSignOutAlt /><span>Logout</span>
          </button>
        </div>
      </aside>

      {showLogoutConfirm && (
        <div
          className="sidebar-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowLogoutConfirm(false);
          }}
        >
          <div
            className="sidebar-logout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sidebar-logout-title"
            aria-describedby="sidebar-logout-description"
          >
            <button type="button" className="sidebar-modal-close" aria-label="Close confirmation" onClick={() => setShowLogoutConfirm(false)}>
              <FaTimes />
            </button>
            <div className="sidebar-modal-illustration" aria-hidden="true">
              <div className="sidebar-modal-icon"><FaSignOutAlt /></div>
            </div>
            <h2 id="sidebar-logout-title">Are you sure you want to log out?</h2>
            <p id="sidebar-logout-description">You’ll need to sign in again to access your ChildCare dashboard.</p>
            <div className="sidebar-modal-actions">
              <button type="button" className="sidebar-modal-cancel" ref={cancelButtonRef} onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button type="button" className="sidebar-modal-confirm" onClick={handleConfirmLogout}>
                <FaSignOutAlt /> Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;