import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import "../css/UserManagement.css";

function UserManagement() {
  const [users, setUsers] = useState([]);

  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    status: "Active",
  });

  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);

  const [editUser, setEditUser] = useState(null);

  const [editUserForm, setEditUserForm] = useState({
    name: "",
    email: "",
    mobile: "",
    status: "Active",
  });

  const [resetPasswordUser, setResetPasswordUser] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // ==============================
  // FETCH USERS
  // ==============================
  const fetchUsers = () => {
    fetch("http://127.0.0.1:8000/api/users")
      .then((response) => response.json())
      .then((data) => {
        const formattedUsers = data.map((user) => ({
          id: user.user_id,
          name: user.user_fullname,
          email: user.email || "",
          mobile: user.mobile_number || "",
          children: user.children_count || 0,
          status: user.status,
        }));

        setUsers(formattedUsers);
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ==============================
  // FILTER USERS
  // ==============================
  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.mobile.includes(searchTerm);

    const matchesStatus =
      statusFilter === "All" || user.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // ==============================
  // ADD USER
  // ==============================
  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.mobile || !newUser.password) {
      alert("Please fill in all required fields.");
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            user_fullname: newUser.name,
            email: newUser.email || null,
            mobile_number: newUser.mobile,
            password: newUser.password,
            status: newUser.status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to create user.");
        return;
      }

      setNewUser({
        name: "",
        email: "",
        mobile: "",
        password: "",
        confirmPassword: "",
        status: "Active",
      });

      setShowAddUserModal(false);

      fetchUsers();

      alert("User created successfully.");
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Unable to connect to the server.");
    }
  };

  // ==============================
  // EDIT USER
  // ==============================
  const handleUpdateUser = async () => {
    if (!editUserForm.name || !editUserForm.mobile) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/users/${editUser.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            user_fullname: editUserForm.name,
            email: editUserForm.email || null,
            mobile_number: editUserForm.mobile,
            status: editUserForm.status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to update user.");
        return;
      }

      setEditUser(null);

      fetchUsers();

      alert("User updated successfully.");
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Unable to connect to the server.");
    }
  };

  // ==============================
  // OPEN EDIT USER
  // ==============================
  const openEditUser = (user) => {
    setEditUser(user);

    setEditUserForm({
      name: user.name,
      email: user.email || "",
      mobile: user.mobile,
      status: user.status,
    });

    setOpenActionMenu(null);
    setActionMenuPosition(null);
  };

  // ==============================
  // OPEN ACTION MENU
  // ==============================
  const toggleActionMenu = (e, user) => {
    if (openActionMenu === user.id) {
      setOpenActionMenu(null);
      setActionMenuPosition(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();

    const menuHeight = 185;
    const menuWidth = 170;
    const spacing = 6;

    let top = rect.bottom + spacing;

    if (top + menuHeight > window.innerHeight) {
      top = rect.top - menuHeight - spacing;
    }

    let left = rect.right - menuWidth;

    if (left < 10) {
      left = 10;
    }

    setActionMenuPosition({
      top,
      left,
    });

    setOpenActionMenu(user.id);
  };

  // ==============================
  // VIEW USER
  // ==============================
  const openViewUser = (user) => {
    setSelectedUser(user);

    setOpenActionMenu(null);
    setActionMenuPosition(null);
  };

  // ==============================
  // ACTIVATE / DEACTIVATE
  // ==============================
  const openStatusConfirmation = (user) => {
    setSelectedUser({
      ...user,
      action: user.status === "Active" ? "deactivate" : "activate",
    });

    setOpenActionMenu(null);
    setActionMenuPosition(null);
  };

  // ==============================
  // DELETE USER
  // ==============================
  const openDeleteConfirmation = (user) => {
    setSelectedUser({
      ...user,
      action: "delete",
    });

    setOpenActionMenu(null);
    setActionMenuPosition(null);
  };

  // ==============================
  // CHANGE USER STATUS
  // ==============================
  const handleStatusChange = async () => {
    const newStatus =
      selectedUser.action === "deactivate" ? "Inactive" : "Active";

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/users/${selectedUser.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            user_fullname: selectedUser.name,
            email: selectedUser.email || null,
            mobile_number: selectedUser.mobile,
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to update user status.");
        return;
      }

      setSelectedUser(null);

      fetchUsers();

      alert(
        newStatus === "Active"
          ? "User activated successfully."
          : "User deactivated successfully."
      );
    } catch (error) {
      console.error("Error changing user status:", error);
      alert("Unable to connect to the server.");
    }
  };

  // ==============================
  // DELETE USER
  // ==============================
  const handleDeleteUser = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/users/${selectedUser.id}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to delete user.");
        return;
      }

      setSelectedUser(null);

      fetchUsers();

      alert("User deleted successfully.");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Unable to connect to the server.");
    }
  };

  return (
    <div className="user-management-dashboard">
      <Sidebar />

      <main className="user-management-container">

        {/* PAGE HEADER */}
        <div className="user-management-header">
          <div>
            <h1>User Management</h1>
            <p>Manage registered parent accounts and access.</p>
          </div>

          <button
            className="add-user-button"
            onClick={() => setShowAddUserModal(true)}
          >
            + Add User
          </button>
        </div>

        {/* SUMMARY CARDS */}
        <div className="user-summary-grid">

          <div className="user-summary-card">
            <span>Total Users</span>
            <strong>{users.length}</strong>
          </div>

          <div className="user-summary-card">
            <span>Active Users</span>
            <strong>
              {users.filter((user) => user.status === "Active").length}
            </strong>
          </div>

          <div className="user-summary-card">
            <span>Inactive Users</span>
            <strong>
              {users.filter((user) => user.status === "Inactive").length}
            </strong>
          </div>

        </div>

        {/* SEARCH AND FILTER */}
        <div className="user-management-toolbar">

          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

        </div>

        {/* USER TABLE */}
        <div className="user-table-container">
          <table>

            <thead>
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th>Children</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>

                    <td>
                      <div className="user-name">
                        {user.name}
                      </div>

                      <div className="user-email">
                        {user.email}
                      </div>
                    </td>

                    <td>{user.mobile}</td>

                    <td>{user.children}</td>

                    <td>
                      <span
                        className={`user-status ${user.status.toLowerCase()}`}
                      >
                        {user.status}
                      </span>
                    </td>

                    <td>
                      <div className="user-action-wrapper">

                        <button
                          type="button"
                          className="user-action-button"
                          onClick={(e) =>
                            toggleActionMenu(e, user)
                          }
                        >
                          ⋮
                        </button>

                        {openActionMenu === user.id &&
                          actionMenuPosition && (
                            <div
                              className="user-action-menu"
                              style={{
                                position: "fixed",
                                top: `${actionMenuPosition.top}px`,
                                left: `${actionMenuPosition.left}px`,
                              }}
                            >

                              <button
                                type="button"
                                onClick={() =>
                                  openViewUser(user)
                                }
                              >
                                View User
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openEditUser(user)
                                }
                              >
                                Edit User
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setResetPasswordUser(user);
                                  setOpenActionMenu(null);
                                  setActionMenuPosition(null);
                                }}
                              >
                                Reset Password
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openStatusConfirmation(user)
                                }
                              >
                                {user.status === "Active"
                                  ? "Deactivate User"
                                  : "Activate User"}
                              </button>

                              <button
                                type="button"
                                className="delete-action"
                                onClick={() =>
                                  openDeleteConfirmation(user)
                                }
                              >
                                Delete User
                              </button>

                            </div>
                          )}

                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      textAlign: "center",
                      padding: "30px",
                      color: "#6b7280",
                    }}
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

        {/* ==============================
            ADD USER MODAL
        ============================== */}
        {showAddUserModal && (
          <div className="user-modal-overlay">

            <div className="user-modal">

              <div className="user-modal-header">

                <div>
                  <h2>Add User</h2>
                  <p>Create a new parent account.</p>
                </div>

                <button
                  type="button"
                  className="user-modal-close"
                  onClick={() =>
                    setShowAddUserModal(false)
                  }
                >
                  ×
                </button>

              </div>

              <div className="user-form">

                <div className="user-form-group">
                  <label>Full Name</label>

                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="user-form-group">
                  <label>Email</label>

                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        email: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="user-form-group">
                  <label>Mobile Number</label>

                  <input
                    type="text"
                    placeholder="Enter mobile number"
                    value={newUser.mobile}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        mobile: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="user-form-row">

                  <div className="user-form-group">
                    <label>Password</label>

                    <input
                      type="password"
                      placeholder="Enter password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          password: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="user-form-group">
                    <label>Confirm Password</label>

                    <input
                      type="password"
                      placeholder="Confirm password"
                      value={newUser.confirmPassword}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                  </div>

                </div>

                <div className="user-form-group">
                  <label>Status</label>

                  <select
                    value={newUser.status}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        status: e.target.value,
                      })
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

              <div className="user-modal-actions">

                <button
                  type="button"
                  className="user-cancel-button"
                  onClick={() =>
                    setShowAddUserModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="user-create-button"
                  onClick={handleCreateUser}
                >
                  Create User
                </button>

              </div>

            </div>

          </div>
        )}

        {/* ==============================
            VIEW USER MODAL
        ============================== */}
        {selectedUser && !selectedUser.action && (
          <div className="user-modal-overlay">

            <div className="user-modal">

              <div className="user-modal-header">

                <div>
                  <h2>User Details</h2>
                  <p>
                    View parent account information.
                  </p>
                </div>

                <button
                  type="button"
                  className="user-modal-close"
                  onClick={() =>
                    setSelectedUser(null)
                  }
                >
                  ×
                </button>

              </div>

              <div className="user-details">

                <div className="user-details-top">

                  <div>
                    <h3>{selectedUser.name}</h3>

                    <span
                      className={`user-status ${selectedUser.status.toLowerCase()}`}
                    >
                      {selectedUser.status}
                    </span>
                  </div>

                </div>

                <div className="user-details-grid">

                  <div className="user-detail-item">
                    <span>Email</span>
                    <strong>
                      {selectedUser.email || "Not provided"}
                    </strong>
                  </div>

                  <div className="user-detail-item">
                    <span>Mobile Number</span>
                    <strong>
                      {selectedUser.mobile}
                    </strong>
                  </div>

                </div>

                <div className="registered-children">

                  <h3>Registered Children</h3>

                  <div className="children-list">
                    <div className="child-item">
                      {selectedUser.children > 0
                        ? `${selectedUser.children} registered child${
                            selectedUser.children > 1
                              ? "ren"
                              : ""
                          }`
                        : "No registered children"}
                    </div>
                  </div>

                </div>

              </div>

              <div className="user-modal-actions">

                <button
                  type="button"
                  className="user-cancel-button"
                  onClick={() =>
                    setSelectedUser(null)
                  }
                >
                  Close
                </button>

              </div>

            </div>

          </div>
        )}

        {/* ==============================
            EDIT USER MODAL
        ============================== */}
        {editUser && (
          <div className="user-modal-overlay">

            <div className="user-modal">

              <div className="user-modal-header">

                <div>
                  <h2>Edit User</h2>
                  <p>
                    Update parent account information.
                  </p>
                </div>

                <button
                  type="button"
                  className="user-modal-close"
                  onClick={() =>
                    setEditUser(null)
                  }
                >
                  ×
                </button>

              </div>

              <div className="user-form">

                <div className="user-form-group">
                  <label>Full Name</label>

                  <input
                    type="text"
                    value={editUserForm.name}
                    onChange={(e) =>
                      setEditUserForm({
                        ...editUserForm,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="user-form-group">
                  <label>Email</label>

                  <input
                    type="email"
                    value={editUserForm.email}
                    onChange={(e) =>
                      setEditUserForm({
                        ...editUserForm,
                        email: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="user-form-group">
                  <label>Mobile Number</label>

                  <input
                    type="text"
                    value={editUserForm.mobile}
                    onChange={(e) =>
                      setEditUserForm({
                        ...editUserForm,
                        mobile: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="user-form-group">
                  <label>Status</label>

                  <select
                    value={editUserForm.status}
                    onChange={(e) =>
                      setEditUserForm({
                        ...editUserForm,
                        status: e.target.value,
                      })
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

              <div className="user-modal-actions">

                <button
                  type="button"
                  className="user-cancel-button"
                  onClick={() =>
                    setEditUser(null)
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="user-create-button"
                  onClick={handleUpdateUser}
                >
                  Save Changes
                </button>

              </div>

            </div>

          </div>
        )}

        {/* ==============================
            RESET PASSWORD MODAL
        ============================== */}
        {resetPasswordUser && (
          <div className="user-modal-overlay">

            <div className="user-modal">

              <div className="user-modal-header">

                <div>
                  <h2>Reset Password</h2>
                  <p>
                    Set a new password for this user account.
                  </p>
                </div>

                <button
                  type="button"
                  className="user-modal-close"
                  onClick={() =>
                    setResetPasswordUser(null)
                  }
                >
                  ×
                </button>

              </div>

              <div className="user-form">

                <div className="user-form-group">
                  <label>User</label>

                  <input
                    type="text"
                    value={resetPasswordUser.name}
                    readOnly
                  />
                </div>

                <div className="user-form-group">
                  <label>New Password</label>

                  <input
                    type="password"
                    placeholder="Enter new password"
                  />
                </div>

                <div className="user-form-group">
                  <label>Confirm Password</label>

                  <input
                    type="password"
                    placeholder="Confirm new password"
                  />
                </div>

              </div>

              <div className="user-modal-actions">

                <button
                  type="button"
                  className="user-cancel-button"
                  onClick={() =>
                    setResetPasswordUser(null)
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="user-create-button"
                  onClick={() =>
                    setResetPasswordUser(null)
                  }
                >
                  Reset Password
                </button>

              </div>

            </div>

          </div>
        )}

        {/* ==============================
            ACTIVATE / DEACTIVATE MODAL
        ============================== */}
        {selectedUser?.action &&
          selectedUser.action !== "delete" && (
            <div className="user-modal-overlay">

              <div className="user-modal">

                <div className="user-modal-header">

                  <div>
                    <h2>
                      {selectedUser.action === "deactivate"
                        ? "Deactivate User"
                        : "Activate User"}
                    </h2>

                    <p>
                      {selectedUser.action === "deactivate"
                        ? "This user will no longer be able to access the system."
                        : "This user will be allowed to access the system again."}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="user-modal-close"
                    onClick={() =>
                      setSelectedUser(null)
                    }
                  >
                    ×
                  </button>

                </div>

                <div className="user-details">

                  <div className="user-detail-item">
                    <span>User</span>
                    <strong>
                      {selectedUser.name}
                    </strong>
                  </div>

                  <div
                    className="user-detail-item"
                    style={{ marginTop: "15px" }}
                  >
                    <span>Current Status</span>

                    <span
                      className={`user-status ${selectedUser.status.toLowerCase()}`}
                    >
                      {selectedUser.status}
                    </span>
                  </div>

                </div>

                <div className="user-modal-actions">

                  <button
                    type="button"
                    className="user-cancel-button"
                    onClick={() =>
                      setSelectedUser(null)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="user-create-button"
                    onClick={handleStatusChange}
                  >
                    {selectedUser.action === "deactivate"
                      ? "Deactivate User"
                      : "Activate User"}
                  </button>

                </div>

              </div>

            </div>
          )}

        {/* ==============================
            DELETE USER MODAL
        ============================== */}
        {selectedUser?.action === "delete" && (
          <div className="user-modal-overlay">

            <div className="user-modal">

              <div className="user-modal-header">

                <div>
                  <h2>Delete User</h2>
                  <p>
                    This action cannot be undone.
                  </p>
                </div>

                <button
                  type="button"
                  className="user-modal-close"
                  onClick={() =>
                    setSelectedUser(null)
                  }
                >
                  ×
                </button>

              </div>

              <div className="user-details">

                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    lineHeight: "1.6",
                    color: "#4b5563",
                  }}
                >
                  Are you sure you want to delete the
                  account of{" "}
                  <strong>{selectedUser.name}</strong>?
                </p>

              </div>

              <div className="user-modal-actions">

                <button
                  type="button"
                  className="user-cancel-button"
                  onClick={() =>
                    setSelectedUser(null)
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="delete-action"
                  onClick={handleDeleteUser}
                >
                  Delete User
                </button>

              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}

export default UserManagement;