import { useState, useEffect } from "react";
import { FiEye, FiEdit2, FiKey } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../css/UserManagement.css";

function UserManagement() {
  // ==============================
  // NAVIGATION
  // ==============================
  const navigate = useNavigate();

  // ==============================
  // CURRENT USER / PERMISSIONS
  // ==============================
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const isAdmin = currentUser?.user_type === "Admin";
  const permissions = currentUser?.permissions || [];

  const hasPermission = (permission) => {
    return (
      isAdmin ||
      permissions.includes("all") ||
      permissions.includes(permission)
    );
  };

  // ==============================
  // USERS
  // ==============================
  const [users, setUsers] = useState([]);

  // ==============================
  // ADD USER
  // ==============================
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const [addUserStep, setAddUserStep] = useState(1);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
    password: "",
    confirmPassword: "",
    status: "Active",

    childName: "",
    childBirthdate: "",
    childGender: "",
    childAddress: "",
    relationship: "",
  });

  // ==============================
  // ACTION MENU
  // ==============================
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState(null);

  // ==============================
  // SELECTED USER
  // Used for Activate / Deactivate
  // ==============================
  const [selectedUser, setSelectedUser] = useState(null);

  // ==============================
  // EDIT USER
  // ==============================
  const [editUser, setEditUser] = useState(null);

  const [editUserForm, setEditUserForm] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
    date_of_birth: "",
    gender: "",
    status: "Active",
  });

  // ==============================
  // RESET PASSWORD
  // ==============================
  const [resetPasswordUser, setResetPasswordUser] = useState(null);

  const [resetPasswordForm, setResetPasswordForm] = useState({
    password: "",
    confirmPassword: "",
  });

  // ==============================
  // SEARCH / FILTER
  // ==============================
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
          address: user.address || "",
          date_of_birth: user.date_of_birth || "",
          gender: user.gender || "",
          children: user.children || [],
          childrenCount:
            user.children_count ??
            (Array.isArray(user.children) ? user.children.length : 0),
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
      (user.name || "").toLowerCase().includes(search) ||
      (user.email || "").toLowerCase().includes(search) ||
      (user.mobile || "").includes(searchTerm);

    const matchesStatus =
      statusFilter === "All" || user.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // ==============================
  // OPEN ADD USER
  // ==============================
  const openAddUser = () => {
    if (!hasPermission("add_users")) {
      alert("You do not have permission to add users.");
      return;
    }

    setNewUser({
      name: "",
      email: "",
      mobile: "",
      address: "",
      password: "",
      confirmPassword: "",
      status: "Active",

      childName: "",
      childBirthdate: "",
      childGender: "",
      childAddress: "",
      relationship: "",
    });

    setAddUserStep(1);
    setShowAddUserModal(true);
  };

  // ==============================
  // NEXT TO CHILD INFORMATION
  // ==============================
  const handleNextAddUserStep = () => {
    if (!newUser.name || !newUser.mobile || !newUser.address) {
      alert("Please fill in all required parent information.");
      return;
    }

    if (!newUser.password) {
      alert("Please enter a password.");
      return;
    }

    if (newUser.password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setNewUser((prev) => ({
      ...prev,
      childAddress: prev.childAddress || prev.address,
    }));

    setAddUserStep(2);
  };

  // ==============================
  // BACK TO PARENT INFORMATION
  // ==============================
  const handleBackAddUserStep = () => {
    setAddUserStep(1);
  };

  // ==============================
  // CREATE USER + FIRST CHILD
  // ==============================
  const handleCreateUser = async () => {
    if (!hasPermission("add_users")) {
      alert("You do not have permission to add users.");
      return;
    }

    if (
      !newUser.childName ||
      !newUser.childBirthdate ||
      !newUser.childGender ||
      !newUser.childAddress ||
      !newUser.relationship
    ) {
      alert("Please fill in all required child information.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          // Parent
          user_fullname: newUser.name,
          email: newUser.email || null,
          mobile_number: newUser.mobile,
          address: newUser.address,
          password: newUser.password,
          status: newUser.status,

          // First child
          child_name: newUser.childName,
          child_birthdate: newUser.childBirthdate,
          child_gender: newUser.childGender,
          child_address: newUser.childAddress,
          relationship: newUser.relationship,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to create parent account.");
        return;
      }

      setNewUser({
        name: "",
        email: "",
        mobile: "",
        address: "",
        password: "",
        confirmPassword: "",
        status: "Active",

        childName: "",
        childBirthdate: "",
        childGender: "",
        childAddress: "",
        relationship: "",
      });

      setAddUserStep(1);
      setShowAddUserModal(false);

      fetchUsers();

      alert("Parent and first child created successfully.");
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Unable to connect to the server.");
    }
  };

  // ==============================
  // EDIT USER
  // ==============================
  const handleUpdateUser = async () => {
    if (!hasPermission("edit_users")) {
      alert("You do not have permission to edit users.");
      return;
    }

    if (!editUser) {
      return;
    }

    if (!editUserForm.name || !editUserForm.mobile || !editUserForm.address) {
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
            date_of_birth: editUserForm.date_of_birth || null,
            gender: editUserForm.gender || null,
            address: editUserForm.address,
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
    if (!hasPermission("edit_users")) {
      alert("You do not have permission to edit users.");
      return;
    }

    setEditUser(user);

    setEditUserForm({
      name: user.name || "",
      email: user.email || "",
      mobile: user.mobile || "",
      address: user.address || "",
      date_of_birth: user.date_of_birth || "",
      gender: user.gender || "",
      status: user.status || "Active",
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

    const menuHeight = 170;
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
  // VIEW USER / PARENT PROFILE
  // ==============================
  const openViewUser = (user) => {
    if (!hasPermission("view_users")) {
      alert("You do not have permission to view users.");
      return;
    }

    setOpenActionMenu(null);
    setActionMenuPosition(null);

    navigate(`/parent-profile/${user.id}`);
  };

  // ==============================
  // OPEN RESET PASSWORD
  // ==============================
  const openResetPassword = (user) => {
    if (!hasPermission("edit_users")) {
      alert("You do not have permission to edit users.");
      return;
    }

    setResetPasswordUser(user);

    setResetPasswordForm({
      password: "",
      confirmPassword: "",
    });

    setOpenActionMenu(null);
    setActionMenuPosition(null);
  };

  // ==============================
  // RESET PASSWORD
  // ==============================
  const handleResetPassword = async () => {
    if (!hasPermission("edit_users")) {
      alert("You do not have permission to edit users.");
      return;
    }

    if (!resetPasswordUser) {
      return;
    }

    if (!resetPasswordForm.password) {
      alert("Please enter a new password.");
      return;
    }

    if (resetPasswordForm.password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    if (resetPasswordForm.password !== resetPasswordForm.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/users/${resetPasswordUser.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            user_fullname: resetPasswordUser.name,
            email: resetPasswordUser.email || null,
            date_of_birth: resetPasswordUser.date_of_birth || null,
            gender: resetPasswordUser.gender || null,
            address: resetPasswordUser.address || "",
            mobile_number: resetPasswordUser.mobile,
            password: resetPasswordForm.password,
            status: resetPasswordUser.status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to reset password.");
        return;
      }

      setResetPasswordUser(null);

      setResetPasswordForm({
        password: "",
        confirmPassword: "",
      });

      alert("Password reset successfully.");
    } catch (error) {
      console.error("Error resetting password:", error);
      alert("Unable to connect to the server.");
    }
  };

  // ==============================
  // ACTIVATE / DEACTIVATE
  // ==============================
  const openStatusConfirmation = (user) => {
    if (!hasPermission("edit_users")) {
      alert("You do not have permission to edit users.");
      return;
    }

    setSelectedUser({
      ...user,
      action: user.status === "Active" ? "deactivate" : "activate",
    });

    setOpenActionMenu(null);
    setActionMenuPosition(null);
  };

  // ==============================
  // CHANGE USER STATUS
  // ==============================
  const handleStatusChange = async () => {
    if (!hasPermission("edit_users")) {
      alert("You do not have permission to edit users.");
      return;
    }

    if (!selectedUser) {
      return;
    }

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
            date_of_birth: selectedUser.date_of_birth || null,
            gender: selectedUser.gender || null,
            address: selectedUser.address || "",
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
  // ACCESS CONTROL
  // ==============================
  if (!isAdmin && !permissions.includes("view_users")) {
    return (
      <div className="user-management-dashboard">
        <Sidebar />

        <main className="user-management-container">
          <div
            style={{
              padding: "40px",
              textAlign: "center",
            }}
          >
            <h2>Access Denied</h2>

            <p>You do not have permission to access User Management.</p>
          </div>
        </main>
      </div>
    );
  }

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

          {hasPermission("add_users") && (
            <button className="add-user-button" onClick={openAddUser}>
              + Add User
            </button>
          )}
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
                      <div className="user-name">{user.name}</div>

                      <div className="user-email">{user.email}</div>
                    </td>

                    <td>{user.mobile}</td>

                    <td>{user.childrenCount}</td>

                    <td>
                      <span
                        className={`user-status ${(
                          user.status || ""
                        ).toLowerCase()}`}
                      >
                        {user.status}
                      </span>
                    </td>

                    <td>
                      <div className="user-action-wrapper">
                        {/* VIEW USER / PARENT PROFILE */}
                        {hasPermission("view_users") && (
                          <button
                            type="button"
                            className="user-action-icon"
                            onClick={() => openViewUser(user)}
                            title="View Parent"
                          >
                            <FiEye size={17} />
                          </button>
                        )}

                        {/* EDIT USER */}
                        {hasPermission("edit_users") && (
                          <button
                            type="button"
                            className="user-action-icon"
                            onClick={() => openEditUser(user)}
                            title="Edit User"
                          >
                            <FiEdit2 size={17} />
                          </button>
                        )}

                        {/* RESET PASSWORD */}
                        {hasPermission("edit_users") && (
                          <button
                            type="button"
                            className="user-action-icon"
                            onClick={() => openResetPassword(user)}
                            title="Reset Password"
                          >
                            <FiKey size={17} />
                          </button>
                        )}

                        {/* ACTIVATE / DEACTIVATE */}
                        {hasPermission("edit_users") && (
                          <button
                            type="button"
                            className="user-action-icon"
                            onClick={() => openStatusConfirmation(user)}
                            title={
                              user.status === "Active"
                                ? "Deactivate User"
                                : "Activate User"
                            }
                          >
                            {user.status === "Active" ? "🚫" : "✓"}
                          </button>
                        )}

                        {/* VIEW ONLY */}
                        {!hasPermission("edit_users") &&
                          hasPermission("view_users") && (
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#6b7280",
                                marginLeft: "6px",
                              }}
                            >
                              View only
                            </span>
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
        {showAddUserModal && hasPermission("add_users") && (
          <div className="user-modal-overlay">
            <div className="user-modal">
              <div className="user-modal-header">
                <div>
                  <h2>
                    {addUserStep === 1
                      ? "Parent Information"
                      : "Child Information"}
                  </h2>

                  <p>
                    {addUserStep === 1
                      ? "Create a new parent account."
                      : "Register the parent's first child."}
                  </p>
                </div>

                <button
                  type="button"
                  className="user-modal-close"
                  onClick={() => {
                    setShowAddUserModal(false);
                    setAddUserStep(1);
                  }}
                >
                  ×
                </button>
              </div>

              {/* STEP INDICATOR */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "20px",
                  fontSize: "13px",
                }}
              >
                <span
                  style={{
                    fontWeight: addUserStep === 1 ? "600" : "400",
                    color: addUserStep === 1 ? "#2563eb" : "#6b7280",
                  }}
                >
                  1. Parent
                </span>

                <span style={{ color: "#9ca3af" }}>→</span>

                <span
                  style={{
                    fontWeight: addUserStep === 2 ? "600" : "400",
                    color: addUserStep === 2 ? "#2563eb" : "#6b7280",
                  }}
                >
                  2. Child
                </span>
              </div>

              {/* STEP 1 */}
              {addUserStep === 1 && (
                <div className="user-form">
                  <div className="user-form-group">
                    <label>Full Name *</label>

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
                    <label>Mobile Number *</label>

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

                  <div className="user-form-group">
                    <label>Address *</label>

                    <input
                      type="text"
                      placeholder="Enter address"
                      value={newUser.address}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          address: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="user-form-row">
                    <div className="user-form-group">
                      <label>Password *</label>

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
                      <label>Confirm Password *</label>

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
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {addUserStep === 2 && (
                <div className="user-form">
                  <div className="user-form-group">
                    <label>Child Name *</label>

                    <input
                      type="text"
                      placeholder="Enter child's full name"
                      value={newUser.childName}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          childName: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="user-form-group">
                    <label>Birthdate *</label>

                    <input
                      type="date"
                      value={newUser.childBirthdate}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          childBirthdate: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="user-form-group">
                    <label>Gender *</label>

                    <select
                      value={newUser.childGender}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          childGender: e.target.value,
                        })
                      }
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div className="user-form-group">
                    <label>Address *</label>

                    <input
                      type="text"
                      placeholder="Child's address"
                      value={newUser.childAddress}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          childAddress: e.target.value,
                        })
                      }
                    />

                    <small
                      style={{
                        display: "block",
                        marginTop: "5px",
                        color: "#6b7280",
                      }}
                    >
                      Initially copied from the parent's address. You can edit
                      it separately later.
                    </small>
                  </div>

                  <div className="user-form-group">
                    <label>Relationship to Child *</label>

                    <select
                      value={newUser.relationship}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          relationship: e.target.value,
                        })
                      }
                    >
                      <option value="">Select relationship</option>
                      <option value="Mother">Mother</option>
                      <option value="Father">Father</option>
                      <option value="Guardian">Guardian</option>
                    </select>
                  </div>
                </div>
              )}

              {/* MODAL ACTIONS */}
              <div className="user-modal-actions">
                {addUserStep === 1 ? (
                  <>
                    <button
                      type="button"
                      className="user-cancel-button"
                      onClick={() => {
                        setShowAddUserModal(false);
                        setAddUserStep(1);
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="user-create-button"
                      onClick={handleNextAddUserStep}
                    >
                      Next
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="user-cancel-button"
                      onClick={handleBackAddUserStep}
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      className="user-create-button"
                      onClick={handleCreateUser}
                    >
                      Create User
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==============================
            EDIT USER MODAL
        ============================== */}
        {editUser && hasPermission("edit_users") && (
          <div className="user-modal-overlay">
            <div className="user-modal">
              <div className="user-modal-header">
                <div>
                  <h2>Edit User</h2>
                  <p>Update parent account information.</p>
                </div>

                <button
                  type="button"
                  className="user-modal-close"
                  onClick={() => setEditUser(null)}
                >
                  ×
                </button>
              </div>

              <div className="user-form">
                <div className="user-form-group">
                  <label>Full Name *</label>

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
                  <label>Mobile Number *</label>

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
                  <label>Address *</label>

                  <input
                    type="text"
                    value={editUserForm.address}
                    onChange={(e) =>
                      setEditUserForm({
                        ...editUserForm,
                        address: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="user-form-row">
                  <div className="user-form-group">
                    <label>Date of Birth</label>

                    <input
                      type="date"
                      value={editUserForm.date_of_birth}
                      onChange={(e) =>
                        setEditUserForm({
                          ...editUserForm,
                          date_of_birth: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="user-form-group">
                    <label>Gender</label>

                    <select
                      value={editUserForm.gender}
                      onChange={(e) =>
                        setEditUserForm({
                          ...editUserForm,
                          gender: e.target.value,
                        })
                      }
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
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
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="user-modal-actions">
                <button
                  type="button"
                  className="user-cancel-button"
                  onClick={() => setEditUser(null)}
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
        {resetPasswordUser && hasPermission("edit_users") && (
          <div className="user-modal-overlay">
            <div className="user-modal">
              <div className="user-modal-header">
                <div>
                  <h2>Reset Password</h2>
                  <p>Set a new password for this user account.</p>
                </div>

                <button
                  type="button"
                  className="user-modal-close"
                  onClick={() => setResetPasswordUser(null)}
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
                  <label>New Password *</label>

                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={resetPasswordForm.password}
                    onChange={(e) =>
                      setResetPasswordForm({
                        ...resetPasswordForm,
                        password: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="user-form-group">
                  <label>Confirm Password *</label>

                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={resetPasswordForm.confirmPassword}
                    onChange={(e) =>
                      setResetPasswordForm({
                        ...resetPasswordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="user-modal-actions">
                <button
                  type="button"
                  className="user-cancel-button"
                  onClick={() => setResetPasswordUser(null)}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="user-create-button"
                  onClick={handleResetPassword}
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
        {selectedUser?.action && hasPermission("edit_users") && (
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
                  onClick={() => setSelectedUser(null)}
                >
                  ×
                </button>
              </div>

              <div className="user-details">
                <div className="user-detail-item">
                  <span>User</span>
                  <strong>{selectedUser.name}</strong>
                </div>

                <div
                  className="user-detail-item"
                  style={{ marginTop: "15px" }}
                >
                  <span>Current Status</span>

                  <span
                    className={`user-status ${(
                      selectedUser.status || ""
                    ).toLowerCase()}`}
                  >
                    {selectedUser.status}
                  </span>
                </div>
              </div>

              <div className="user-modal-actions">
                <button
                  type="button"
                  className="user-cancel-button"
                  onClick={() => setSelectedUser(null)}
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
      </main>
    </div>
  );
}

export default UserManagement;