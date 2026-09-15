import { useState, useRef, useEffect } from "react";
import "../css/UserManagement.css";

function UserManagement() {
  const [showActions, setShowActions] = useState(false);
  const actionButtonRef = useRef(null);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showEditStaff, setShowEditStaff] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [showDeleteStaff, setShowDeleteStaff] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const handlePermissionChange = (permission, checked) => {
    if (checked) {
      setPermissions([...permissions, permission]);
    } else {
      setPermissions(permissions.filter((item) => item !== permission));
    }
  };
  useEffect(() => {
    const savedPermissions = localStorage.getItem("staff_permissions");

    if (savedPermissions) {
      setPermissions(JSON.parse(savedPermissions));
    }
  }, []);
  return (
    <div className="user-management">
      <div className="page-header">
        <div>
          <h1>Staff & Permissions</h1>
          <p>Manage staff accounts and system access.</p>
        </div>

        <button className="add-staff-btn" onClick={() => setShowAddStaff(true)}>
          + Add Staff
        </button>
      </div>
      <div className="summary-cards">
        <div className="summary-card">
          <span>Total Staff</span>
          <strong>0</strong>
        </div>

        <div className="summary-card">
          <span>Active</span>
          <strong>0</strong>
        </div>

        <div className="summary-card">
          <span>Inactive</span>
          <strong>0</strong>
        </div>

        <div className="summary-card">
          <span>Permissions</span>
          <strong>0</strong>
        </div>
      </div>
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
              <tr>
                <td>
                  <div className="staff-info">
                    <div className="staff-avatar">SA</div>

                    <div>
                      <strong>Sample Staff</strong>
                      <span>staff@example.com</span>
                    </div>
                  </div>
                </td>

                <td>Staff</td>

                <td>
                  <span className="status active">Active</span>
                </td>

                <td>
                  <div className="action-menu-container">
                    <button
                      ref={actionButtonRef}
                      className="action-btn"
                      onClick={() => setShowActions(!showActions)}
                    >
                      Manage
                    </button>

                    {showActions && actionButtonRef.current && (
                      <div
                        className="action-menu"
                        style={{
                          top:
                            actionButtonRef.current.getBoundingClientRect()
                              .bottom + 6,
                          left:
                            actionButtonRef.current.getBoundingClientRect()
                              .right - 180,
                        }}
                      >
                        <button
                          onClick={() => {
                            setShowActions(false);
                            setShowEditStaff(true);
                          }}
                        >
                          Edit Staff
                        </button>

                        <button
                          onClick={() => {
                            setShowActions(false);
                            setShowPermissions(true);
                          }}
                        >
                          Manage Permissions
                        </button>

                        <button
                          onClick={() => {
                            setShowActions(false);
                            setShowResetPassword(true);
                          }}
                        >
                          Reset Password
                        </button>

                        <button
                          onClick={() => {
                            setShowActions(false);
                            setShowDeactivate(true);
                          }}
                        >
                          Deactivate Staff
                        </button>

                        <button
                          className="delete-action"
                          onClick={() => {
                            setShowActions(false);
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
            </tbody>
          </table>
        </div>
      </div>
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
                <div className="staff-avatar">SA</div>

                <div>
                  <strong>Sample Staff</strong>
                  <span>Staff</span>
                </div>
              </div>

              {/* Dashboard */}
              <div className="permission-section">
                <h3>Dashboard</h3>

                <label className="permission-item">
                  <input
                    type="checkbox"
                    checked={permissions.includes("view_dashboard")}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setPermissions([...permissions, "view_dashboard"]);
                      } else {
                        setPermissions(
                          permissions.filter(
                            (permission) => permission !== "view_dashboard",
                          ),
                        );
                      }
                    }}
                  />
                  <span>View Dashboard</span>
                </label>
              </div>

              {/* Patients */}
              <div className="permission-section">
                <h3>Patients</h3>

                <label className="permission-item">
                  <input
                    type="checkbox"
                    checked={permissions.includes("view_patients")}
                    onChange={(e) =>
                      handlePermissionChange("view_patients", e.target.checked)
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
                      handlePermissionChange("edit_patients", e.target.checked)
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

              {/* Appointments */}
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

              {/* Vaccines */}
              <div className="permission-section">
                <h3>Vaccines</h3>

                <label className="permission-item">
                  <input
                    type="checkbox"
                    checked={permissions.includes("view_vaccines")}
                    onChange={(e) =>
                      handlePermissionChange("view_vaccines", e.target.checked)
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
                      handlePermissionChange("edit_vaccines", e.target.checked)
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
              <div className="permission-section">
                <h3>Reports</h3>

                <label className="permission-item">
                  <input
                    type="checkbox"
                    checked={permissions.includes("view_reports")}
                    onChange={(e) =>
                      handlePermissionChange("view_reports", e.target.checked)
                    }
                  />
                  <span>View Reports</span>
                </label>

                <label className="permission-item">
                  <input
                    type="checkbox"
                    checked={permissions.includes("generate_reports")}
                    onChange={(e) =>
                      handlePermissionChange(
                        "generate_reports",
                        e.target.checked,
                      )
                    }
                  />
                  <span>Generate Reports</span>
                </label>

                <label className="permission-item">
                  <input
                    type="checkbox"
                    checked={permissions.includes("export_reports")}
                    onChange={(e) =>
                      handlePermissionChange("export_reports", e.target.checked)
                    }
                  />
                  <span>Export Reports</span>
                </label>
              </div>
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

                <label className="permission-item">
                  <input
                    type="checkbox"
                    checked={permissions.includes("delete_notifications")}
                    onChange={(e) =>
                      handlePermissionChange(
                        "delete_notifications",
                        e.target.checked,
                      )
                    }
                  />
                  <span>Delete Notifications</span>
                </label>
              </div>
            </div>

            <div className="permissions-footer">
              <button
                className="cancel-permissions"
                onClick={() => setShowPermissions(false)}
              >
                Cancel
              </button>

              <button
                className="save-permissions"
                onClick={() => {
                  localStorage.setItem(
                    "staff_permissions",
                    JSON.stringify(permissions),
                  );

                  console.log("Saved permissions:", permissions);

                  setShowPermissions(false);
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <input type="text" placeholder="Enter staff name" />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input type="email" placeholder="Enter email address" />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input type="text" placeholder="Enter phone number" />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input type="password" placeholder="Enter password" />
                </div>

                <div className="form-group">
                  <label>Confirm Password</label>
                  <input type="password" placeholder="Confirm password" />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select>
                    <option>Active</option>
                    <option>Inactive</option>
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

              <button className="save-permissions">Save Staff</button>
            </div>
          </div>
        </div>
      )}
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
                  <input type="text" value="Sample Staff" readOnly />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value="staff@example.com" readOnly />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input type="text" value="+63 912 345 6789" readOnly />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select defaultValue="Active">
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
                <div className="staff-avatar">SA</div>

                <div>
                  <strong>Sample Staff</strong>
                  <span>staff@example.com</span>
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
      {showDeactivate && (
        <div className="confirmation-overlay">
          <div className="confirmation-modal">
            <div className="confirmation-icon">!</div>

            <h2>Deactivate Staff?</h2>

            <p>
              Are you sure you want to deactivate <strong>Sample Staff</strong>?
              This staff member will no longer be able to access the system.
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
      {showDeleteStaff && (
        <div className="confirmation-overlay">
          <div className="confirmation-modal">
            <div className="delete-confirmation-icon">!</div>

            <h2>Delete Staff?</h2>

            <p>
              Are you sure you want to permanently delete{" "}
              <strong>Sample Staff</strong>? This action cannot be undone.
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
  );
}

export default UserManagement;
