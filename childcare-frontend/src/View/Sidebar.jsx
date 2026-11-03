import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate, matchPath } from "react-router-dom";
import logo1 from "../images/logo1.png";
import "../css/Sidebar.css";
import {
  FaThLarge, FaUserFriends, FaCalendarAlt, FaSyringe,
  FaChartBar, FaBell, FaSignOutAlt, FaUserCircle,
  FaUser, FaTimes, FaLayerGroup
} from "react-icons/fa";
import { logoutUser, authFetch } from "../Controller/AuthController";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [recordNames, setRecordNames] = useState({ parent: "", child: "" });
  const cancelButtonRef = useRef(null);

  let currentUser = null;
  try {
    const storedUser = localStorage.getItem("currentUser");
    currentUser = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Unable to read logged-in user:", error);
  }
  const isAdmin = currentUser?.user_type === "Admin";
  const permissions = currentUser?.permissions || [];
  const canViewUsers = isAdmin || permissions.includes("all") || permissions.includes("view_users");
  const canViewChildren = isAdmin || permissions.includes("all") || permissions.includes("view_patients");

  const parentMatch = matchPath("/parent-profile/:userId", location.pathname);
  const childMatch = matchPath("/patient_viewrecord/:child_id", location.pathname);
  const parentId = parentMatch?.params.userId || (childMatch ? location.state?.parentId : null);
  const childId = childMatch?.params.child_id;

  // The origin follows the route that opened the child record, not the child's parent relationship.
  const fromPath = location.state?.from || "";
  const fromUsers = Boolean(childMatch && (location.state?.navigationSource === "users" || fromPath.startsWith("/parent-profile/")));
  const fromChildren = Boolean(childMatch && !fromUsers);
  const showUserBranch = Boolean(parentMatch || fromUsers);
  const showChildrenBranch = fromChildren;

  useEffect(() => {
    let cancelled = false;
    setRecordNames({ parent: "", child: "" });

    const loadNames = async () => {
      const fetchJson = async (url) => {
        const response = await authFetch(url, { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        return response.json();
      };

      try {
        if (parentMatch) {
          const parent = await fetchJson(`http://127.0.0.1:8000/api/users/${parentId}`);
          if (!cancelled) setRecordNames({ parent: parent.user_fullname || "Unnamed Parent", child: "" });
        } else if (childMatch) {
          const child = await fetchJson(`http://127.0.0.1:8000/api/children/${childId}`);
          if (cancelled) return;
          const childName = child.child_name || location.state?.childName || "Unnamed Child";
          if (fromUsers && parentId) {
            const parentName = child.user?.user_fullname || location.state?.parentName;
            if (parentName) {
              setRecordNames({ parent: parentName, child: childName });
            } else {
              const parent = await fetchJson(`http://127.0.0.1:8000/api/users/${parentId}`);
              if (!cancelled) setRecordNames({ parent: parent.user_fullname || "Unnamed Parent", child: childName });
            }
          } else {
            setRecordNames({ parent: "", child: childName });
          }
        }
      } catch (error) {
        console.error("Unable to load sidebar record names:", error);
        if (!cancelled) {
          setRecordNames({
            parent: parentId ? location.state?.parentName || "Parent Profile" : "",
            child: childId ? location.state?.childName || "Child Record" : "",
          });
        }
      }
    };
    loadNames();
    return () => { cancelled = true; };
  }, [location.pathname, parentId, childId, fromUsers]);

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

  const parentPath = parentId ? `/parent-profile/${parentId}` : null;
  const parentState = { from: "/user-management" };

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
            {canViewUsers && (
              <>
                <NavLink to="/user-management" className={({ isActive }) => isActive ? "active" : ""}>
                  <FaUser /><span>Users</span>
                </NavLink>
                {showUserBranch && (
                  <div className="sidebar-record-tree" aria-label="Selected user records">
                    {parentPath && (
                      <NavLink
                        to={parentPath}
                        state={parentState}
                        title={recordNames.parent || "Parent Profile"}
                        className={`sidebar-record-link sidebar-record-parent ${parentMatch ? "active" : ""}`}
                      >
                        <span className="sidebar-record-dot" aria-hidden="true" />
                        <span className="sidebar-record-name">{recordNames.parent || "Parent Profile"}</span>
                      </NavLink>
                    )}
                    {fromUsers && childId && (
                      <NavLink
                        to={location.pathname}
                        state={location.state}
                        title={recordNames.child || "Child Record"}
                        className="sidebar-record-link sidebar-record-child active"
                      >
                        <span className="sidebar-record-dot" aria-hidden="true" />
                        <span className="sidebar-record-name">{recordNames.child || "Child Record"}</span>
                      </NavLink>
                    )}
                  </div>
                )}
              </>
            )}
            <NavLink to="/appointments"><FaCalendarAlt /><span>Appointments</span></NavLink>
            <NavLink to="/vaccines"><FaSyringe /><span>Vaccines</span></NavLink>
          </div>
          <div className="nav-section">
            <span className="nav-section-title">ADMINISTRATION</span>
            {canViewChildren && (
              <>
                <NavLink to="/patients"><FaUserFriends /><span>Children</span></NavLink>
                {showChildrenBranch && (
                  <div className="sidebar-record-tree" aria-label="Selected child record">
                    <NavLink
                      to={location.pathname}
                      state={location.state}
                      title={recordNames.child || "Child Record"}
                      className="sidebar-record-link sidebar-record-parent active"
                    >
                      <span className="sidebar-record-dot" aria-hidden="true" />
                      <span className="sidebar-record-name">{recordNames.child || "Child Record"}</span>
                    </NavLink>
                  </div>
                )}
              </>
            )}
            {isAdmin && <NavLink to="/role-base-access"><FaLayerGroup /><span>Roles &amp; Permissions</span></NavLink>}
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
        <div className="sidebar-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowLogoutConfirm(false);
        }}>
          <div className="sidebar-logout-modal" role="dialog" aria-modal="true"
            aria-labelledby="sidebar-logout-title" aria-describedby="sidebar-logout-description">
            <button type="button" className="sidebar-modal-close" aria-label="Close confirmation"
              onClick={() => setShowLogoutConfirm(false)}><FaTimes /></button>
            <div className="sidebar-modal-illustration" aria-hidden="true">
              <div className="sidebar-modal-icon"><FaSignOutAlt /></div>
            </div>
            <h2 id="sidebar-logout-title">Are you sure you want to log out?</h2>
            <p id="sidebar-logout-description">You’ll need to sign in again to access your ChildCare dashboard.</p>
            <div className="sidebar-modal-actions">
              <button type="button" className="sidebar-modal-cancel" ref={cancelButtonRef}
                onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
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
