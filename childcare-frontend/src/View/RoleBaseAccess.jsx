import { useState, useRef, useEffect } from "react";
import Sidebar from "./Sidebar";
import "../css/RoleBaseAccess.css";

function RoleBaseAccess() {
  const [showActions, setShowActions] = useState(null);
  const actionButtonRefs = useRef({});

  const [showPermissions, setShowPermissions] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showEditStaff, setShowEditStaff] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [showDeleteStaff, setShowDeleteStaff] = useState(false);

  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);

  const [selectedStaff, setSelectedStaff] = useState(null);
  const [permissions, setPermissions] = useState([]);

  // =========================================================
  // PERMISSIONS
  // =========================================================

  const handlePermissionChange = (permission, checked) => {
    setPermissions((previousPermissions) => {
      if (checked) {
        if (previousPermissions.includes(permission)) {
          return previousPermissions;
        }

        return [...previousPermissions, permission];
      }

      const permissionGroups = {
        patients: [
          "view_patients",
          "add_patients",
          "edit_patients",
          "delete_patients",
        ],

        appointments: [
          "view_appointments",
          "add_appointments",
          "edit_appointments",
          "delete_appointments",
        ],

        vaccines: [
          "view_vaccines",
          "add_vaccines",
          "edit_vaccines",
          "delete_vaccines",
        ],
        users: ["view_users", "add_users", "edit_users", "delete_users"],

        notifications: ["view_notifications", "send_notifications"],
      };

      const group = Object.values(permissionGroups).find((permissionsInGroup) =>
        permissionsInGroup.includes(permission),
      );

      if (group) {
        const remainingPermissions = previousPermissions.filter(
          (item) => item !== permission,
        );

        const hasAnotherPermission = remainingPermissions.some((item) =>
          group.includes(item),
        );

        if (!hasAnotherPermission) {
          alert(
            "At least one permission must remain enabled for this section.",
          );

          return previousPermissions;
        }

        return remainingPermissions;
      }

      return previousPermissions.filter((item) => item !== permission);
    });
  };

  const handleManagePermissions = async (staff) => {
    console.log("Selected staff:", staff);
    console.log("Selected staff ID:", staff.staff_id);

    setSelectedStaff(staff);
    setShowActions(null);

    // Clear old permissions first
    setPermissions([]);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/staff/${staff.staff_id}/permissions`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load permissions.");
      }

      const data = await response.json();

      console.log("Loaded permissions:", data);
      console.log("Permissions from database:", data.permissions);

      setPermissions(data.permissions || []);
      setShowPermissions(true);
    } catch (error) {
      console.error("Error loading permissions:", error);
      alert("Failed to load staff permissions.");
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedStaff) {
      alert("No staff member selected.");
      return;
    }

    console.log("Saving permissions for:", selectedStaff);
    console.log("Saving staff ID:", selectedStaff.staff_id);
    console.log("Permissions being sent:", permissions);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/staff/${selectedStaff.staff_id}/permissions`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            permissions: permissions,
          }),
        },
      );

      const data = await response.json();

      console.log("Permission save response:", data);

      if (!response.ok) {
        console.log("Permission save error:", data);
        throw new Error("Failed to save permissions.");
      }

      alert("Permissions saved successfully.");

      setShowPermissions(false);
    } catch (error) {
      console.error("Error saving permissions:", error);
      alert("Failed to save permissions.");
    }
  };

  // =========================================================
  // STAFF FORM
  // =========================================================

  const [staffForm, setStaffForm] = useState({
    staff_name: "",
    staff_email: "",
    staff_phone: "",
    staff_password: "",
    confirm_password: "",
    status: "Active",
  });

  const handleStaffFormChange = (e) => {
    const { name, value } = e.target;

    setStaffForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleAddStaff = async () => {
    if (
      !staffForm.staff_name ||
      !staffForm.staff_email ||
      !staffForm.staff_password
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    if (staffForm.staff_password !== staffForm.confirm_password) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          staff_name: staffForm.staff_name,
          staff_email: staffForm.staff_email,
          staff_phone: staffForm.staff_phone,
          staff_password: staffForm.staff_password,
          status: staffForm.status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Add staff error:", data);
        alert(data.message || "Failed to create staff account.");
        return;
      }

      setStaffList((previous) => [...previous, data]);

      setStaffForm({
        staff_name: "",
        staff_email: "",
        staff_phone: "",
        staff_password: "",
        confirm_password: "",
        status: "Active",
      });

      setShowAddStaff(false);

      alert("Staff account created successfully.");
    } catch (error) {
      console.error("Add staff error:", error);
      alert("Unable to connect to the server.");
    }
  };

  // =========================================================
  // LOAD STAFF
  // =========================================================

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/staff")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch staff");
        }

        return response.json();
      })
      .then((data) => {
        setStaffList(data);
      })
      .catch((error) => {
        console.error("Error fetching staff:", error);
      })
      .finally(() => {
        setLoadingStaff(false);
      });
  }, []);

  // =========================================================
  // SUMMARY COUNTS
  // =========================================================

  const totalStaff = staffList.length;

  const activeStaff = staffList.filter(
    (staff) => staff.status === "Active",
  ).length;

  const inactiveStaff = staffList.filter(
    (staff) => staff.status === "Inactive",
  ).length;

  return (
    <div className="role-base-layout">
      <Sidebar />

      <div className="user-management">
        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="page-header">
          <div>
            <h1>Staff & Permissions</h1>
            <p>Manage staff accounts and system access.</p>
          </div>

          <button
            className="add-staff-btn"
            onClick={() => setShowAddStaff(true)}
          >
            + Add Staff
          </button>
        </div>

        {/* =====================================================
            SUMMARY CARDS
        ===================================================== */}

        <div className="summary-cards">
          <div className="summary-card">
            <span>Total Staff</span>
            <strong>{totalStaff}</strong>
          </div>

          <div className="summary-card">
            <span>Active</span>
            <strong>{activeStaff}</strong>
          </div>

          <div className="summary-card">
            <span>Inactive</span>
            <strong>{inactiveStaff}</strong>
          </div>

          <div className="summary-card">
            <span>Permissions</span>
            <strong>0</strong>
          </div>
        </div>

        {/* =====================================================
            STAFF SECTION
        ===================================================== */}

        <div className="staff-section">
          <div className="section-header">
            <div>
              <h2>Staff Accounts</h2>
              <p>Manage staff accounts and their access.</p>
            </div>

            <div className="staff-filters">
              <input type="text" placeholder="Search staff..." />

              <select>
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>

          <div className="staff-table-wrapper">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loadingStaff ? (
                  <tr>
                    <td colSpan="4">Loading staff...</td>
                  </tr>
                ) : staffList.length === 0 ? (
                  <tr>
                    <td colSpan="4">No staff accounts found.</td>
                  </tr>
                ) : (
                  staffList.map((staff) => (
                    <tr key={staff.staff_id}>
                      <td>
                        <div className="staff-info">
                          <div className="staff-avatar">
                            {staff.staff_name
                              .split(" ")
                              .map((name) => name[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>{staff.staff_name}</strong>
                            <span>{staff.staff_email}</span>
                          </div>
                        </div>
                      </td>

                      <td>Staff</td>

                      <td>
                        <span
                          className={`status ${staff.status.toLowerCase()}`}
                        >
                          {staff.status}
                        </span>
                      </td>

                      <td>
                        <div className="action-menu-container">
                          <button
                            ref={(element) => {
                              actionButtonRefs.current[staff.staff_id] =
                                element;
                            }}
                            className="action-btn"
                            onClick={() =>
                              setShowActions(
                                showActions === staff.staff_id
                                  ? null
                                  : staff.staff_id,
                              )
                            }
                          >
                            Manage
                          </button>

                          {showActions === staff.staff_id &&
                            actionButtonRefs.current[staff.staff_id] && (
                              <div
                                className="action-menu"
                                style={{
                                  position: "fixed",
                                  top:
                                    actionButtonRefs.current[
                                      staff.staff_id
                                    ].getBoundingClientRect().bottom + 6,
                                  left:
                                    actionButtonRefs.current[
                                      staff.staff_id
                                    ].getBoundingClientRect().right - 180,
                                }}
                              >
                                <button
                                  onClick={() => {
                                    setShowActions(null);
                                    setSelectedStaff(staff);
                                    setShowEditStaff(true);
                                  }}
                                >
                                  Edit Staff
                                </button>

                                <button
                                  onClick={() => handleManagePermissions(staff)}
                                >
                                  Manage Permissions
                                </button>

                                <button
                                  onClick={() => {
                                    setShowActions(null);
                                    setSelectedStaff(staff);
                                    setShowResetPassword(true);
                                  }}
                                >
                                  Reset Password
                                </button>

                                <button
                                  onClick={() => {
                                    setShowActions(null);
                                    setSelectedStaff(staff);
                                    setShowDeactivate(true);
                                  }}
                                >
                                  Deactivate Staff
                                </button>

                                <button
                                  className="delete-action"
                                  onClick={() => {
                                    setShowActions(null);
                                    setSelectedStaff(staff);
                                    setShowDeleteStaff(true);
                                  }}
                                >
                                  Delete Staff
                                </button>
                              </div>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* =====================================================
            MANAGE PERMISSIONS DRAWER
        ===================================================== */}

        {showPermissions && (
          <div className="permissions-overlay">
            <div className="permissions-drawer">
              <div className="permissions-header">
                <div>
                  <h2>Manage Permissions</h2>
                  <p>Control what this staff member can access.</p>
                </div>

                <button
                  className="close-permissions"
                  onClick={() => setShowPermissions(false)}
                >
                  ×
                </button>
              </div>

              <div className="permissions-content">
                <div className="staff-permission-info">
                  <div className="staff-avatar">
                    {selectedStaff?.staff_name
                      ?.split(" ")
                      .map((name) => name[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  <div>
                    <strong>{selectedStaff?.staff_name}</strong>
                    <span>{selectedStaff?.staff_email}</span>
                  </div>
                </div>

                {/* =================================================
                    PATIENTS
                ================================================= */}

                <div className="permission-section">
                  <h3>Patients</h3>

                  <label className="permission-item">
                    <input
                      type="checkbox"
                      checked={permissions.includes("view_patients")}
                      onChange={(e) =>
                        handlePermissionChange(
                          "view_patients",
                          e.target.checked,
                        )
                      }
                    />

                    <span>View Patients</span>
                  </label>

                  <label className="permission-item">
                    <input
                      type="checkbox"
                      checked={permissions.includes("add_patients")}
                      onChange={(e) =>
                        handlePermissionChange("add_patients", e.target.checked)
                      }
                    />

                    <span>Add Patients</span>
                  </label>

                  <label className="permission-item">
                    <input
                      type="checkbox"
                      checked={permissions.includes("edit_patients")}
                      onChange={(e) =>
                        handlePermissionChange(
                          "edit_patients",
                          e.target.checked,
                        )
                      }
                    />

                    <span>Edit Patients</span>
                  </label>

                  <label className="permission-item">
                    <input
                      type="checkbox"
                      checked={permissions.includes("delete_patients")}
                      onChange={(e) =>
                        handlePermissionChange(
                          "delete_patients",
                          e.target.checked,
                        )
                      }
                    />

                    <span>Delete Patients</span>
                  </label>
                </div>

                {/* =================================================
                    APPOINTMENTS
                ================================================= */}

                <div className="permission-section">
                  <h3>Appointments</h3>

                  <label className="permission-item">
                    <input
                      type="checkbox"
                      checked={permissions.includes("view_appointments")}
                      onChange={(e) =>
                        handlePermissionChange(
                          "view_appointments",
                          e.target.checked,
                        )
                      }
                    />

                    <span>View Appointments</span>
                  </label>

                  <label className="permission-item">
                    <input
                      type="checkbox"
                      checked={permissions.includes("add_appointments")}
                      onChange={(e) =>
                        handlePermissionChange(
                          "add_appointments",
                          e.target.checked,
                        )
                      }
                    />

                    <span>Add Appointments</span>
                  </label>

                  <label className="permission-item">
                    <input
                      type="checkbox"
                      checked={permissions.includes("edit_appointments")}
                      onChange={(e) =>
                        handlePermissionChange(
                          "edit_appointments",
                          e.target.checked,
                        )
                      }
                    />

                    <span>Edit Appointments</span>
                  </label>

                  <label className="permission-item">
                    <input
                      type="checkbox"
                      checked={permissions.includes("delete_appointments")}
                      onChange={(e) =>
                        handlePermissionChange(
                          "delete_appointments",
                          e.target.checked,
                        )
                      }
                    />

                    <span>Delete Appointments</span>
                  </label>
                </div>

                {/* =================================================
                    VACCINES
                ================================================= */}

                <div className="permission-section">
                  <h3>Vaccines</h3>

                  <label className="permission-item">
                    <input
                      type="checkbox"
                      checked={permissions.includes("view_vaccines")}
                      onChange={(e) =>
                        handlePermissionChange(
                          "view_vaccines",
                          e.target.checked,
                        )
                      }
                    />

                    <span>View Vaccines</span>
                  </label>

                  <label className="permission-item">
                    <input
                      type="checkbox"
                      checked={permissions.includes("add_vaccines")}
                      onChange={(e) =>
                        handlePermissionChange("add_vaccines", e.target.checked)
                      }
                    />

                    <span>Add Vaccines</span>
                  </label>

                  <label className="permission-item">
                    <input
                      type="checkbox"
                      checked={permissions.includes("edit_vaccines")}
                      onChange={(e) =>
                        handlePermissionChange(
                          "edit_vaccines",
                          e.target.checked,
                        )
                      }
                    />

                    <span>Edit Vaccines</span>
                  </label>

                  <label className="permission-item">
                    <input
                      type="checkbox"
                      checked={permissions.includes("delete_vaccines")}
                      onChange={(e) =>
                        handlePermissionChange(
                          "delete_vaccines",
                          e.target.checked,
                        )
                      }
                    />

                    <span>Delete Vaccines</span>
                  </label>
                </div>

                {/* =================================================
    USERS
================================================= */}

                <div className="permission-section">
                  <h3>Users</h3>

                  <label className="permission-item">
                    <input
                      type="checkbox"
                      checked={permissions.includes("view_users")}
                      onChange={(e) =>
                        handlePermissionChange("view_users", e.target.checked)
                      }
                    />

                    <span>View Users</span>
                  </label>

                  <label className="permission-item">
                    <input
                      type="checkbox"
                      checked={permissions.includes("add_users")}
                      onChange={(e) =>
                        handlePermissionChange("add_users", e.target.checked)
                      }
                    />

                    <span>Add Users</span>
                  </label>

                  <label className="permission-item">
                    <input
                      type="checkbox"
                      checked={permissions.includes("edit_users")}
                      onChange={(e) =>
                        handlePermissionChange("edit_users", e.target.checked)
                      }
                    />

                    <span>Edit Users</span>
                  </label>

                  <label className="permission-item">
                    <input
                      type="checkbox"
                      checked={permissions.includes("delete_users")}
                      onChange={(e) =>
                        handlePermissionChange("delete_users", e.target.checked)
                      }
                    />

                    <span>Delete Users</span>
                  </label>
                </div>

                {/* =================================================
                    NOTIFICATIONS
                ================================================= */}

                <div className="permission-section">
                  <h3>Notifications</h3>

                  <label className="permission-item">
                    <input
                      type="checkbox"
                      checked={permissions.includes("view_notifications")}
                      onChange={(e) =>
                        handlePermissionChange(
                          "view_notifications",
                          e.target.checked,
                        )
                      }
                    />

                    <span>View Notifications</span>
                  </label>

                  <label className="permission-item">
                    <input
                      type="checkbox"
                      checked={permissions.includes("send_notifications")}
                      onChange={(e) =>
                        handlePermissionChange(
                          "send_notifications",
                          e.target.checked,
                        )
                      }
                    />

                    <span>Send Notifications</span>
                  </label>
                </div>
              </div>

              {/* =================================================
                  PERMISSION FOOTER
              ================================================= */}

              <div className="permissions-footer">
                <button
                  className="cancel-permissions"
                  onClick={() => setShowPermissions(false)}
                >
                  Cancel
                </button>

                <button
                  className="save-permission"
                  onClick={handleSavePermissions}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            ADD STAFF
        ===================================================== */}

        {showAddStaff && (
          <div className="permissions-overlay">
            <div className="permissions-drawer">
              <div className="permissions-header">
                <div>
                  <h2>Add Staff</h2>
                  <p>Create a new staff account.</p>
                </div>

                <button
                  className="close-permissions"
                  onClick={() => setShowAddStaff(false)}
                >
                  ×
                </button>
              </div>

              <div className="permissions-content">
                <div className="staff-form">
                  <div className="form-group">
                    <label>Staff Name</label>

                    <input
                      type="text"
                      name="staff_name"
                      value={staffForm.staff_name}
                      onChange={handleStaffFormChange}
                      placeholder="Enter staff name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>

                    <input
                      type="email"
                      name="staff_email"
                      value={staffForm.staff_email}
                      onChange={handleStaffFormChange}
                      placeholder="Enter email address"
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone</label>

                    <input
                      type="text"
                      name="staff_phone"
                      value={staffForm.staff_phone}
                      onChange={handleStaffFormChange}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div className="form-group">
                    <label>Password</label>

                    <input
                      type="password"
                      name="staff_password"
                      value={staffForm.staff_password}
                      onChange={handleStaffFormChange}
                      placeholder="Enter password"
                    />
                  </div>

                  <div className="form-group">
                    <label>Confirm Password</label>

                    <input
                      type="password"
                      name="confirm_password"
                      value={staffForm.confirm_password}
                      onChange={handleStaffFormChange}
                      placeholder="Confirm password"
                    />
                  </div>

                  <div className="form-group">
                    <label>Status</label>

                    <select
                      name="status"
                      value={staffForm.status}
                      onChange={handleStaffFormChange}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="permissions-footer">
                <button
                  className="cancel-permissions"
                  onClick={() => setShowAddStaff(false)}
                >
                  Cancel
                </button>

                <button className="save-permissions" onClick={handleAddStaff}>
                  Save Staff
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            EDIT STAFF
        ===================================================== */}

        {showEditStaff && (
          <div className="permissions-overlay">
            <div className="permissions-drawer">
              <div className="permissions-header">
                <div>
                  <h2>Edit Staff</h2>
                  <p>Update this staff member's account information.</p>
                </div>

                <button
                  className="close-permissions"
                  onClick={() => setShowEditStaff(false)}
                >
                  ×
                </button>
              </div>

              <div className="permissions-content">
                <div className="staff-form">
                  <div className="form-group">
                    <label>Staff Name</label>

                    <input
                      type="text"
                      value={selectedStaff?.staff_name || ""}
                      readOnly
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>

                    <input
                      type="email"
                      value={selectedStaff?.staff_email || ""}
                      readOnly
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone</label>

                    <input
                      type="text"
                      value={selectedStaff?.staff_phone || ""}
                      readOnly
                    />
                  </div>

                  <div className="form-group">
                    <label>Status</label>

                    <select defaultValue={selectedStaff?.status || "Active"}>
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="permissions-footer">
                <button
                  className="cancel-permissions"
                  onClick={() => setShowEditStaff(false)}
                >
                  Cancel
                </button>

                <button className="save-permissions">Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            RESET PASSWORD
        ===================================================== */}

        {showResetPassword && (
          <div className="permissions-overlay">
            <div className="permissions-drawer">
              <div className="permissions-header">
                <div>
                  <h2>Reset Password</h2>
                  <p>Create a new password for this staff member.</p>
                </div>

                <button
                  className="close-permissions"
                  onClick={() => setShowResetPassword(false)}
                >
                  ×
                </button>
              </div>

              <div className="permissions-content">
                <div className="staff-permission-info">
                  <div className="staff-avatar">
                    {selectedStaff?.staff_name
                      ?.split(" ")
                      .map((name) => name[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  <div>
                    <strong>{selectedStaff?.staff_name}</strong>
                    <span>{selectedStaff?.staff_email}</span>
                  </div>
                </div>

                <div className="staff-form">
                  <div className="form-group">
                    <label>New Password</label>

                    <input type="password" placeholder="Enter new password" />
                  </div>

                  <div className="form-group">
                    <label>Confirm Password</label>

                    <input type="password" placeholder="Confirm new password" />
                  </div>
                </div>
              </div>

              <div className="permissions-footer">
                <button
                  className="cancel-permissions"
                  onClick={() => setShowResetPassword(false)}
                >
                  Cancel
                </button>

                <button className="save-permissions">Reset Password</button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            DEACTIVATE STAFF
        ===================================================== */}

        {showDeactivate && (
          <div className="confirmation-overlay">
            <div className="confirmation-modal">
              <div className="confirmation-icon">!</div>

              <h2>Deactivate Staff?</h2>

              <p>
                Are you sure you want to deactivate{" "}
                <strong>{selectedStaff?.staff_name}</strong>? This staff member
                will no longer be able to access the system.
              </p>

              <div className="confirmation-actions">
                <button
                  className="cancel-confirmation"
                  onClick={() => setShowDeactivate(false)}
                >
                  Cancel
                </button>

                <button className="deactivate-confirmation">Deactivate</button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            DELETE STAFF
        ===================================================== */}

        {showDeleteStaff && (
          <div className="confirmation-overlay">
            <div className="confirmation-modal">
              <div className="delete-confirmation-icon">!</div>

              <h2>Delete Staff?</h2>

              <p>
                Are you sure you want to permanently delete{" "}
                <strong>{selectedStaff?.staff_name}</strong>? This action cannot
                be undone.
              </p>

              <div className="confirmation-actions">
                <button
                  className="cancel-confirmation"
                  onClick={() => setShowDeleteStaff(false)}
                >
                  Cancel
                </button>

                <button className="delete-confirmation">Delete Staff</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoleBaseAccess;
