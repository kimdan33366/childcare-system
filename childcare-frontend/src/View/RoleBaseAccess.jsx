import { useState, useEffect } from "react";
import {
FaEdit,
FaUserShield,
FaKey,
FaUserSlash,
FaTrash,
} from "react-icons/fa";
import Sidebar from "./Sidebar";
import "../css/RoleBaseAccess.css";

function RoleBaseAccess() {
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

const [searchTerm, setSearchTerm] = useState("");
const [statusFilter, setStatusFilter] = useState("All Status");

// =========================================================
// STAFF EDIT FORM
// =========================================================

const [editStaffForm, setEditStaffForm] = useState({
staff_name: "",
staff_email: "",
staff_phone: "",
status: "Active",
});

const [resetPasswordForm, setResetPasswordForm] = useState({
password: "",
confirm_password: "",
});

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

// =========================================================
// PERMISSION DEFINITIONS
// =========================================================

const permissionSections = [
{
key: "dashboard",
title: "Dashboard",
permissions: [
{
key: "view_dashboard",
label: "View Dashboard",
},
],
},


{
  key: "children",
  title: "Children",
  permissions: [
    {
      key: "view_patients",
      label: "View Children",
    },
    {
      key: "add_patients",
      label: "Add Children",
    },
    {
      key: "edit_patients",
      label: "Edit Children",
    },
  ],
},

{
  key: "patient_records",
  title: "Patient Records",
  permissions: [
    {
      key: "view_patient_records",
      label: "View Patient Records",
    },
    {
      key: "add_patient_records",
      label: "Add Patient Records",
    },
    {
      key: "edit_patient_records",
      label: "Edit Patient Records",
    },
  ],
},

{
  key: "appointments",
  title: "Appointments",
  permissions: [
    {
      key: "view_appointments",
      label: "View Appointments",
    },
    {
      key: "add_appointments",
      label: "Add Appointments",
    },
    {
      key: "edit_appointments",
      label: "Edit Appointments",
    },
  ],
},

{
  key: "vaccines",
  title: "Vaccines",
  permissions: [
    {
      key: "view_vaccines",
      label: "View Vaccines",
    },
    {
      key: "add_vaccines",
      label: "Add Vaccines",
    },
    {
      key: "edit_vaccines",
      label: "Edit Vaccines",
    },
  ],
},

{
  key: "users",
  title: "Users",
  permissions: [
    {
      key: "view_users",
      label: "View Users",
    },
    {
      key: "add_users",
      label: "Add Users",
    },
    {
      key: "edit_users",
      label: "Edit Users",
    },
  ],
},

{
  key: "reports",
  title: "Reports",
  permissions: [
    {
      key: "view_reports",
      label: "View Reports",
    },
    {
      key: "generate_reports",
      label: "Generate Reports",
    },
    {
      key: "export_reports",
      label: "Export Reports",
    },
  ],
},

{
  key: "notifications",
  title: "Notifications",
  permissions: [
    {
      key: "view_notifications",
      label: "View Notifications",
    },
    {
      key: "send_notifications",
      label: "Send Notifications",
    },
    {
      key: "delete_notifications",
      label: "Delete Notifications",
    },
  ],
},


];

const availablePermissionCount = permissionSections.reduce(
(total, section) => total + section.permissions.length,
0,
);

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

  return previousPermissions.filter(
    (item) => item !== permission,
  );
});


};

// =========================================================
// MANAGE PERMISSIONS
// =========================================================

const handleManagePermissions = async (staff) => {
setSelectedStaff(staff);
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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to load permissions.",
    );
  }

  setPermissions(data.permissions || []);
  setShowPermissions(true);
} catch (error) {
  console.error("Error loading permissions:", error);

  alert(
    error.message ||
      "Failed to load staff permissions.",
  );
}


};

const handleSavePermissions = async () => {
if (!selectedStaff) {
alert("No staff member selected.");
return;
}

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

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to save permissions.",
    );
  }

  alert("Permissions saved successfully.");

  setShowPermissions(false);
} catch (error) {
  console.error("Error saving permissions:", error);

  alert(
    error.message ||
      "Failed to save permissions.",
  );
}


};

// =========================================================
// STAFF FORM CHANGE
// =========================================================

const handleStaffFormChange = (e) => {
const { name, value } = e.target;


setStaffForm((previous) => ({
  ...previous,
  [name]: value,
}));


};

// =========================================================
// ADD STAFF
// =========================================================

const handleAddStaff = async () => {
if (
!staffForm.staff_name ||
!staffForm.staff_email ||
!staffForm.staff_password
) {
alert("Please fill in all required fields.");
return;
}


if (
  staffForm.staff_password !==
  staffForm.confirm_password
) {
  alert("Passwords do not match.");
  return;
}

try {
  const response = await fetch(
    "http://127.0.0.1:8000/api/staff",
    {
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
    },
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Add staff error:", data);

    alert(
      data.message ||
        "Failed to create staff account.",
    );

    return;
  }

  const newStaff = data.staff || data;

  setStaffList((previous) => [
    ...previous,
    newStaff,
  ]);

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
// EDIT STAFF
// =========================================================

const handleOpenEditStaff = (staff) => {
setSelectedStaff(staff);

setEditStaffForm({
  staff_name: staff.staff_name || "",
  staff_email: staff.staff_email || "",
  staff_phone: staff.staff_phone || "",
  status: staff.status || "Active",
});

setShowEditStaff(true);


};

const handleEditStaffFormChange = (e) => {
const { name, value } = e.target;


setEditStaffForm((previous) => ({
  ...previous,
  [name]: value,
}));


};

const handleSaveEditStaff = async () => {
if (!selectedStaff) {
alert("No staff member selected.");
return;
}


if (
  !editStaffForm.staff_name ||
  !editStaffForm.staff_email
) {
  alert("Staff name and email are required.");
  return;
}

try {
  const response = await fetch(
    `http://127.0.0.1:8000/api/staff/${selectedStaff.staff_id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        staff_name: editStaffForm.staff_name,
        staff_email: editStaffForm.staff_email,
        staff_phone: editStaffForm.staff_phone,
        status: editStaffForm.status,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update staff.",
    );
  }

  const updatedStaff = data.staff || data;

  setStaffList((previous) =>
    previous.map((staff) =>
      staff.staff_id === selectedStaff.staff_id
        ? {
            ...staff,
            ...updatedStaff,
          }
        : staff,
    ),
  );

  setSelectedStaff((previous) => ({
    ...previous,
    ...updatedStaff,
  }));

  setShowEditStaff(false);

  alert(
    "Staff information updated successfully.",
  );
} catch (error) {
  console.error("Edit staff error:", error);

  alert(
    error.message ||
      "Failed to update staff.",
  );
}

};

// =========================================================
// RESET PASSWORD
// =========================================================

const handleOpenResetPassword = (staff) => {
setSelectedStaff(staff);


setResetPasswordForm({
  password: "",
  confirm_password: "",
});

setShowResetPassword(true);


};

const handleResetPasswordChange = (e) => {
const { name, value } = e.target;


setResetPasswordForm((previous) => ({
  ...previous,
  [name]: value,
}));


};

const handleSaveResetPassword = async () => {
if (!selectedStaff) {
alert("No staff member selected.");
return;
}


if (
  !resetPasswordForm.password ||
  !resetPasswordForm.confirm_password
) {
  alert("Please enter the new password.");
  return;
}

if (
  resetPasswordForm.password !==
  resetPasswordForm.confirm_password
) {
  alert("Passwords do not match.");
  return;
}

try {
  const response = await fetch(
    `http://127.0.0.1:8000/api/staff/${selectedStaff.staff_id}/password`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        password: resetPasswordForm.password,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to reset password.",
    );
  }

  setResetPasswordForm({
    password: "",
    confirm_password: "",
  });

  setShowResetPassword(false);

  alert("Password reset successfully.");
} catch (error) {
  console.error(
    "Reset password error:",
    error,
  );

  alert(
    error.message ||
      "Failed to reset password.",
  );
}


};

// =========================================================
// DEACTIVATE STAFF
// =========================================================

const handleOpenDeactivate = (staff) => {
setSelectedStaff(staff);
setShowDeactivate(true);
};

const handleDeactivateStaff = async () => {
if (!selectedStaff) {
alert("No staff member selected.");
return;
}


try {
  const response = await fetch(
    `http://127.0.0.1:8000/api/staff/${selectedStaff.staff_id}/status`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        status: "Inactive",
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to deactivate staff.",
    );
  }

  setStaffList((previous) =>
    previous.map((staff) =>
      staff.staff_id === selectedStaff.staff_id
        ? {
            ...staff,
            status: "Inactive",
          }
        : staff,
    ),
  );

  setSelectedStaff((previous) => ({
    ...previous,
    status: "Inactive",
  }));

  setShowDeactivate(false);

  alert(
    "Staff member has been deactivated.",
  );
} catch (error) {
  console.error(
    "Deactivate staff error:",
    error,
  );

  alert(
    error.message ||
      "Failed to deactivate staff.",
  );
}


};

// =========================================================
// DELETE STAFF
// =========================================================

const handleOpenDeleteStaff = (staff) => {
setSelectedStaff(staff);
setShowDeleteStaff(true);
};

const handleDeleteStaff = async () => {
if (!selectedStaff) {
alert("No staff member selected.");
return;
}


try {
  const response = await fetch(
    `http://127.0.0.1:8000/api/staff/${selectedStaff.staff_id}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to delete staff.",
    );
  }

  setStaffList((previous) =>
    previous.filter(
      (staff) =>
        staff.staff_id !==
        selectedStaff.staff_id,
    ),
  );

  setShowDeleteStaff(false);
  setSelectedStaff(null);

  alert(
    "Staff account deleted successfully.",
  );
} catch (error) {
  console.error(
    "Delete staff error:",
    error,
  );

  alert(
    error.message ||
      "Failed to delete staff.",
  );
}


};

// =========================================================
// LOAD STAFF
// =========================================================

useEffect(() => {
const loadStaff = async () => {
try {
const response = await fetch(
"http://127.0.0.1:8000/api/staff",
{
headers: {
Accept: "application/json",
},
},
);


    if (!response.ok) {
      throw new Error(
        "Failed to fetch staff.",
      );
    }

    const data = await response.json();

    setStaffList(
      Array.isArray(data)
        ? data
        : data.staff || [],
    );
  } catch (error) {
    console.error(
      "Error fetching staff:",
      error,
    );
  } finally {
    setLoadingStaff(false);
  }
};

loadStaff();


}, []);

// =========================================================
// SEARCH + FILTER
// =========================================================

const filteredStaff = staffList.filter(
(staff) => {
const search =
searchTerm.toLowerCase();


  const matchesSearch =
    staff.staff_name
      ?.toLowerCase()
      .includes(search) ||
    staff.staff_email
      ?.toLowerCase()
      .includes(search) ||
    staff.staff_phone
      ?.toLowerCase()
      .includes(search);

  const matchesStatus =
    statusFilter === "All Status" ||
    staff.status === statusFilter;

  return (
    matchesSearch &&
    matchesStatus
  );
},


);

// =========================================================
// SUMMARY COUNTS
// =========================================================

const totalStaff = staffList.length;

const activeStaff = staffList.filter(
(staff) =>
staff.status === "Active",
).length;

const inactiveStaff = staffList.filter(
(staff) =>
staff.status === "Inactive",
).length;

// =========================================================
// RENDER
// =========================================================

return ( <div className="role-base-layout"> <Sidebar />


  <div className="user-management">

    <div className="page-header">
      <div>
        <h1>Staff & Permissions</h1>
        <p>
          Manage staff accounts and system
          access.
        </p>
      </div>

      <button
        className="add-staff-btn"
        onClick={() =>
          setShowAddStaff(true)
        }
      >
        + Add Staff
      </button>
    </div>

    <div className="summary-cards">
      <div className="summary-card">
        <span>Total Staff</span>
        <strong>
          {totalStaff}
        </strong>
      </div>

      <div className="summary-card">
        <span>Active</span>
        <strong>
          {activeStaff}
        </strong>
      </div>

      <div className="summary-card">
        <span>Inactive</span>
        <strong>
          {inactiveStaff}
        </strong>
      </div>

      <div className="summary-card">
        <span>Available Permissions</span>
        <strong>
          {availablePermissionCount}
        </strong>
      </div>
    </div>

    <div className="staff-section">
      <div className="section-header">
        <div>
          <h2>Staff Accounts</h2>

          <p>
            Manage staff accounts and
            their access.
          </p>
        </div>

        <div className="staff-filters">
          <input
            type="text"
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value,
              )
            }
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value,
              )
            }
          >
            <option>
              All Status
            </option>

            <option>
              Active
            </option>

            <option>
              Inactive
            </option>
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
                <td colSpan="4">
                  Loading staff...
                </td>
              </tr>
            ) : filteredStaff.length === 0 ? (
              <tr>
                <td colSpan="4">
                  No staff accounts found.
                </td>
              </tr>
            ) : (
              filteredStaff.map(
                (staff) => (
                  <tr
                    key={
                      staff.staff_id
                    }
                  >
                    <td>
                      <div className="staff-info">
                        <div className="staff-avatar">
                          {staff.staff_name
                            ?.split(" ")
                            .map(
                              (name) =>
                                name[0],
                            )
                            .join("")
                            .slice(
                              0,
                              2,
                            )
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {
                              staff.staff_name
                            }
                          </strong>

                          <span>
                            {
                              staff.staff_email
                            }
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      Staff
                    </td>

                    <td>
                      <span
                        className={`status ${
                          staff.status
                            ?.toLowerCase() ||
                          ""
                        }`}
                      >
                        {
                          staff.status
                        }
                      </span>
                    </td>

                    <td>
                      <div className="action-icons">

                        <button
                          type="button"
                          className="action-icon edit-icon"
                          title="Edit Staff"
                          aria-label={`Edit ${staff.staff_name}`}
                          onClick={() =>
                            handleOpenEditStaff(
                              staff,
                            )
                          }
                        >
                          <FaEdit />
                        </button>

                        <button
                          type="button"
                          className="action-icon permission-icon"
                          title="Manage Permissions"
                          aria-label={`Manage permissions for ${staff.staff_name}`}
                          onClick={() =>
                            handleManagePermissions(
                              staff,
                            )
                          }
                        >
                          <FaUserShield />
                        </button>

                        <button
                          type="button"
                          className="action-icon password-icon"
                          title="Reset Password"
                          aria-label={`Reset password for ${staff.staff_name}`}
                          onClick={() =>
                            handleOpenResetPassword(
                              staff,
                            )
                          }
                        >
                          <FaKey />
                        </button>

                        <button
                          type="button"
                          className="action-icon deactivate-icon"
                          title={
                            staff.status ===
                            "Inactive"
                              ? "Already Inactive"
                              : "Deactivate Staff"
                          }
                          aria-label={
                            staff.status ===
                            "Inactive"
                              ? `${staff.staff_name} is already inactive`
                              : `Deactivate ${staff.staff_name}`
                          }
                          onClick={() =>
                            handleOpenDeactivate(
                              staff,
                            )
                          }
                          disabled={
                            staff.status ===
                            "Inactive"
                          }
                        >
                          <FaUserSlash />
                        </button>

                        <button
                          type="button"
                          className="action-icon delete-icon"
                          title="Delete Staff"
                          aria-label={`Delete ${staff.staff_name}`}
                          onClick={() =>
                            handleOpenDeleteStaff(
                              staff,
                            )
                          }
                        >
                          <FaTrash />
                        </button>

                      </div>
                    </td>
                  </tr>
                ),
              )
            )}
          </tbody>
        </table>
      </div>
    </div>

    {showPermissions && (
      <div className="permissions-overlay">
        <div className="permissions-drawer">

          <div className="permissions-header">
            <div>
              <h2>
                Manage Permissions
              </h2>

              <p>
                Control what this staff
                member can access.
              </p>
            </div>

            <button
              className="close-permissions"
              onClick={() =>
                setShowPermissions(
                  false,
                )
              }
            >
              ×
            </button>
          </div>

          <div className="permissions-content">

            <div className="staff-permission-info">
              <div className="staff-avatar">
                {selectedStaff?.staff_name
                  ?.split(" ")
                  .map(
                    (name) =>
                      name[0],
                  )
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {
                    selectedStaff?.staff_name
                  }
                </strong>

                <span>
                  {
                    selectedStaff?.staff_email
                  }
                </span>
              </div>
            </div>

            {permissionSections.map(
              (section) => (
                <div
                  className="permission-section"
                  key={
                    section.key
                  }
                >
                  <h3>
                    {
                      section.title
                    }
                  </h3>

                  {section.permissions.map(
                    (permission) => (
                      <label
                        className="permission-item"
                        key={
                          permission.key
                        }
                      >
                        <input
                          type="checkbox"
                          checked={permissions.includes(
                            permission.key,
                          )}
                          onChange={(
                            e,
                          ) =>
                            handlePermissionChange(
                              permission.key,
                              e.target
                                .checked,
                            )
                          }
                        />

                        <span>
                          {
                            permission.label
                          }
                        </span>
                      </label>
                    ),
                  )}
                </div>
              ),
            )}
          </div>

          <div className="permissions-footer">
            <button
              className="cancel-permissions"
              onClick={() =>
                setShowPermissions(
                  false,
                )
              }
            >
              Cancel
            </button>

            <button
              className="save-permission"
              onClick={
                handleSavePermissions
              }
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

              <p>
                Create a new staff
                account.
              </p>
            </div>

            <button
              className="close-permissions"
              onClick={() =>
                setShowAddStaff(
                  false,
                )
              }
            >
              ×
            </button>
          </div>

          <div className="permissions-content">
            <div className="staff-form">

              <div className="form-group">
                <label>
                  Staff Name
                </label>

                <input
                  type="text"
                  name="staff_name"
                  value={
                    staffForm.staff_name
                  }
                  onChange={
                    handleStaffFormChange
                  }
                  placeholder="Enter staff name"
                />
              </div>

              <div className="form-group">
                <label>
                  Email
                </label>

                <input
                  type="email"
                  name="staff_email"
                  value={
                    staffForm.staff_email
                  }
                  onChange={
                    handleStaffFormChange
                  }
                  placeholder="Enter email address"
                />
              </div>

              <div className="form-group">
                <label>
                  Phone
                </label>

                <input
                  type="text"
                  name="staff_phone"
                  value={
                    staffForm.staff_phone
                  }
                  onChange={
                    handleStaffFormChange
                  }
                  placeholder="Enter phone number"
                />
              </div>

              <div className="form-group">
                <label>
                  Password
                </label>

                <input
                  type="password"
                  name="staff_password"
                  value={
                    staffForm.staff_password
                  }
                  onChange={
                    handleStaffFormChange
                  }
                  placeholder="Enter password"
                />
              </div>

              <div className="form-group">
                <label>
                  Confirm Password
                </label>

                <input
                  type="password"
                  name="confirm_password"
                  value={
                    staffForm.confirm_password
                  }
                  onChange={
                    handleStaffFormChange
                  }
                  placeholder="Confirm password"
                />
              </div>

              <div className="form-group">
                <label>
                  Status
                </label>

                <select
                  name="status"
                  value={
                    staffForm.status
                  }
                  onChange={
                    handleStaffFormChange
                  }
                >
                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div className="permissions-footer">
            <button
              className="cancel-permissions"
              onClick={() =>
                setShowAddStaff(
                  false,
                )
              }
            >
              Cancel
            </button>

            <button
              className="save-permissions"
              onClick={
                handleAddStaff
              }
            >
              Save Staff
            </button>
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

              <p>
                Update this staff
                member's account
                information.
              </p>
            </div>

            <button
              className="close-permissions"
              onClick={() =>
                setShowEditStaff(
                  false,
                )
              }
            >
              ×
            </button>
          </div>

          <div className="permissions-content">
            <div className="staff-form">

              <div className="form-group">
                <label>
                  Staff Name
                </label>

                <input
                  type="text"
                  name="staff_name"
                  value={
                    editStaffForm.staff_name
                  }
                  onChange={
                    handleEditStaffFormChange
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  Email
                </label>

                <input
                  type="email"
                  name="staff_email"
                  value={
                    editStaffForm.staff_email
                  }
                  onChange={
                    handleEditStaffFormChange
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  Phone
                </label>

                <input
                  type="text"
                  name="staff_phone"
                  value={
                    editStaffForm.staff_phone
                  }
                  onChange={
                    handleEditStaffFormChange
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  Status
                </label>

                <select
                  name="status"
                  value={
                    editStaffForm.status
                  }
                  onChange={
                    handleEditStaffFormChange
                  }
                >
                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div className="permissions-footer">
            <button
              className="cancel-permissions"
              onClick={() =>
                setShowEditStaff(
                  false,
                )
              }
            >
              Cancel
            </button>

            <button
              className="save-permissions"
              onClick={
                handleSaveEditStaff
              }
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    )}

    {showResetPassword && (
      <div className="permissions-overlay">
        <div className="permissions-drawer">

          <div className="permissions-header">
            <div>
              <h2>
                Reset Password
              </h2>

              <p>
                Create a new password
                for this staff
                member.
              </p>
            </div>

            <button
              className="close-permissions"
              onClick={() =>
                setShowResetPassword(
                  false,
                )
              }
            >
              ×
            </button>
          </div>

          <div className="permissions-content">

            <div className="staff-permission-info">
              <div className="staff-avatar">
                {selectedStaff?.staff_name
                  ?.split(" ")
                  .map(
                    (name) =>
                      name[0],
                  )
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {
                    selectedStaff?.staff_name
                  }
                </strong>

                <span>
                  {
                    selectedStaff?.staff_email
                  }
                </span>
              </div>
            </div>

            <div className="staff-form">

              <div className="form-group">
                <label>
                  New Password
                </label>

                <input
                  type="password"
                  name="password"
                  value={
                    resetPasswordForm.password
                  }
                  onChange={
                    handleResetPasswordChange
                  }
                  placeholder="Enter new password"
                />
              </div>

              <div className="form-group">
                <label>
                  Confirm Password
                </label>

                <input
                  type="password"
                  name="confirm_password"
                  value={
                    resetPasswordForm.confirm_password
                  }
                  onChange={
                    handleResetPasswordChange
                  }
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>

          <div className="permissions-footer">
            <button
              className="cancel-permissions"
              onClick={() =>
                setShowResetPassword(
                  false,
                )
              }
            >
              Cancel
            </button>

            <button
              className="save-permissions"
              onClick={
                handleSaveResetPassword
              }
            >
              Reset Password
            </button>
          </div>
        </div>
      </div>
    )}

    {showDeactivate && (
      <div className="confirmation-overlay">
        <div className="confirmation-modal">

          <div className="confirmation-icon">
            !
          </div>

          <h2>
            Deactivate Staff?
          </h2>

          <p>
            Are you sure you want to
            deactivate{" "}
            <strong>
              {
                selectedStaff?.staff_name
              }
            </strong>
            ? This staff member will
            no longer be able to
            access the system.
          </p>

          <div className="confirmation-actions">

            <button
              className="cancel-confirmation"
              onClick={() =>
                setShowDeactivate(
                  false,
                )
              }
            >
              Cancel
            </button>

            <button
              className="deactivate-confirmation"
              onClick={
                handleDeactivateStaff
              }
            >
              Deactivate
            </button>
          </div>
        </div>
      </div>
    )}

    {showDeleteStaff && (
      <div className="confirmation-overlay">
        <div className="confirmation-modal">

          <div className="delete-confirmation-icon">
            !
          </div>

          <h2>
            Delete Staff?
          </h2>

          <p>
            Are you sure you want to
            permanently delete{" "}
            <strong>
              {
                selectedStaff?.staff_name
              }
            </strong>
            ? This action cannot be
            undone.
          </p>

          <div className="confirmation-actions">

            <button
              className="cancel-confirmation"
              onClick={() =>
                setShowDeleteStaff(
                  false,
                )
              }
            >
              Cancel
            </button>

            <button
              className="delete-confirmation"
              onClick={
                handleDeleteStaff
              }
            >
              Delete Staff
            </button>
          </div>
        </div>
      </div>
    )}

  </div>
</div>


);
}

export default RoleBaseAccess;
