import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import {
  FaUserCircle,
  FaSignOutAlt,
  FaChevronDown,
  FaTimes,
} from "react-icons/fa";

import {
  getCurrentUser,
  logoutUser,
} from "../Controller/AuthController";

import "../css/Header.css";

function Header() {
  const navigate = useNavigate();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const dropdownRef = useRef(null);
  const cancelButtonRef = useRef(null);

  const currentUser = getCurrentUser();

  const isAdmin = currentUser?.user_type === "Admin";

  const userName = isAdmin
    ? currentUser?.Admin_name
    : currentUser?.staff_name;

  const displayName = userName || "User";

  const role = isAdmin ? "Administrator" : "Staff Member";

  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  /* =========================================================
     CLOSE DROPDOWN WHEN CLICKING OUTSIDE
  ========================================================= */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  /* =========================================================
     LOGOUT MODAL
  ========================================================= */

  useEffect(() => {
    if (!showLogoutConfirm) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    cancelButtonRef.current?.focus();

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowLogoutConfirm(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showLogoutConfirm]);

  const handleLogoutClick = () => {
    setShowDropdown(false);
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    logoutUser();

    setShowLogoutConfirm(false);

    navigate("/login", { replace: true });
  };

  return (
    <>
      <div className="childcare-header">

        <div className="childcare-header-spacer" />

        <div
          className="childcare-header-profile-wrapper"
          ref={dropdownRef}
        >
          <button
            type="button"
            className={`childcare-header-profile ${
              showDropdown ? "opened" : ""
            }`}
            onClick={() => setShowDropdown(!showDropdown)}
            aria-expanded={showDropdown}
            aria-haspopup="menu"
          >
            <div className="childcare-header-avatar">
              {initials}
            </div>

            <div className="childcare-header-user-info">
              <strong title={displayName}>
                {displayName}
              </strong>

              <span>{role}</span>
            </div>

            <FaChevronDown
              className={`childcare-header-chevron ${
                showDropdown ? "rotated" : ""
              }`}
            />
          </button>

          {showDropdown && (
            <div
              className="childcare-header-dropdown"
              role="menu"
            >
              <div className="childcare-header-dropdown-user">
                <div className="childcare-header-dropdown-avatar">
                  {initials}
                </div>

                <div>
                  <strong>{displayName}</strong>
                  <span>{role}</span>
                </div>
              </div>

              <div className="childcare-header-dropdown-divider" />

              <NavLink
                to="/profile"
                className="childcare-header-dropdown-item"
                role="menuitem"
                onClick={() => setShowDropdown(false)}
              >
                <FaUserCircle />
                <span>My Profile</span>
              </NavLink>

              <button
                type="button"
                className="childcare-header-dropdown-item logout"
                role="menuitem"
                onClick={handleLogoutClick}
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* LOGOUT CONFIRMATION */}

      {showLogoutConfirm && (
        <div
          className="sidebar-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowLogoutConfirm(false);
            }
          }}
        >
          <div
            className="sidebar-logout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="header-logout-title"
            aria-describedby="header-logout-description"
          >
            <button
              type="button"
              className="sidebar-modal-close"
              aria-label="Close confirmation"
              onClick={() => setShowLogoutConfirm(false)}
            >
              <FaTimes />
            </button>

            <div
              className="sidebar-modal-illustration"
              aria-hidden="true"
            >
              <div className="sidebar-modal-icon">
                <FaSignOutAlt />
              </div>
            </div>

            <h2 id="header-logout-title">
              Are you sure you want to log out?
            </h2>

            <p id="header-logout-description">
              You'll need to sign in again to access your
              ChildCare dashboard.
            </p>

            <div className="sidebar-modal-actions">
              <button
                type="button"
                className="sidebar-modal-cancel"
                ref={cancelButtonRef}
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="sidebar-modal-confirm"
                onClick={handleConfirmLogout}
              >
                <FaSignOutAlt />
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;